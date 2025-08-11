import { Router } from 'express';
import { db } from '../lib/db.ts';
import type { Invoice } from '../types/index.ts';
import { InvoiceStatus, EventType } from '../types/index.ts';
import { upload, hashFile } from '../lib/multer.ts';
import { HederaOps } from '../lib/hedera.ts';

export const invoicesRouter = Router();

function ok<T>(data: T) { return { success: true, data }; }
function err(message: string) { return { success: false, error: message }; }

// List invoices with optional status filter
invoicesRouter.get('/', async (req, res) => {
  const { status } = req.query as { status?: string };
  const items = await db.invoice.list(status as InvoiceStatus | undefined);
  res.json(ok(items));
});

// Get single invoice by id
invoicesRouter.get('/:id', async (req, res) => {
  const { id } = req.params;
  const inv = await db.invoice.get(id);
  if (!inv) return res.status(404).json(err('Invoice not found'));
  res.json(ok(inv));
});

// Create invoice
invoicesRouter.post('/', async (req, res) => {
  const { sellerId, buyerId, dueDate, amount, currency, yieldBps } = req.body as Partial<Invoice> & { yieldBps?: number };
  if (!sellerId || !dueDate || !amount || !currency) {
    return res.status(400).json(err('sellerId, dueDate, amount, currency required'));
  }
  
  try {
    // 100% Hedera-native creation with HTS/HCS/HFS
    const inv = await db.invoice.create({ sellerId, buyerId, dueDate, amount, currency, yieldBps });
    await db.event.publish(EventType.INVOICE_CREATED, { invoiceId: inv.id, amount, currency, buyerId, yieldBps });
    
    res.status(201).json(ok(inv));
  } catch (e) {
    console.error('[invoices] Hedera-native create failed:', (e as Error).message);
    res.status(500).json(err('Failed to create invoice on Hedera network'));
  }
});

// Upload invoice file and attach to invoice
invoicesRouter.post('/:id/upload', upload.single('file'), async (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json(err('file required'));
  const inv = await db.invoice.get(id);
  if (!inv) return res.status(404).json(err('Invoice not found'));
  const hash = hashFile(req.file.buffer);
  const rec = await db.file.create({
    invoiceId: id,
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    sha256: hash,
    buffer: req.file.buffer,
  });
  const updated = await db.invoice.update(id, { fileId: rec.id });
  await db.event.publish(EventType.FILE_UPLOADED, { invoiceId: id, fileId: rec.id, sha256: hash }, id);

  // Hedera-native: publish lifecycle event and optionally upload to File Service
  try {
    await HederaOps.publishLifecycleEvent('FILE_UPLOADED', id, { fileId: rec.id, sha256: hash });
  } catch (e) {
    console.warn('[invoices] HederaOps.publishLifecycleEvent(FILE_UPLOADED) skipped:', (e as Error).message);
  }

  res.json(ok({ invoice: updated, file: rec }));
});

// List file metadata for an invoice
invoicesRouter.get('/:id/file', async (req, res) => {
  const { id } = req.params;
  const file = await db.file.getByInvoice(id);
  if (!file) return res.status(404).json(err('No file for invoice'));
  const { buffer, ...meta } = file as any;
  res.json(ok(meta));
});

// Download file
invoicesRouter.get('/:id/file/download', async (req, res) => {
  const { id } = req.params;
  const file = await db.file.getByInvoice(id);
  if (!file) return res.status(404).json(err('No file for invoice'));
  res.setHeader('Content-Type', file.mimetype);
  res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
  res.send((file as any).buffer);
});

// Update status to LISTED and publish event
invoicesRouter.post('/:id/list', async (req, res) => {
  const { id } = req.params;
  const inv = await db.invoice.get(id);
  if (!inv) return res.status(404).json(err('Invoice not found'));
  const updated = await db.invoice.update(id, { status: InvoiceStatus.LISTED });
  await db.event.publish(EventType.INVOICE_LISTED, { invoiceId: id }, id);

  try {
    await HederaOps.publishLifecycleEvent('INVOICE_LISTED', id, {});
  } catch (e) {
    console.warn('[invoices] HederaOps.publishLifecycleEvent(INVOICE_LISTED) skipped:', (e as Error).message);
  }

  res.json(ok(updated));
});

// Invest into an invoice
invoicesRouter.post('/:id/invest', async (req, res) => {
  const { id } = req.params;
  const { investorId, amount } = req.body as { investorId?: string; amount?: number };
  if (!investorId || !amount) return res.status(400).json(err('investorId and amount required'));
  const inv = await db.invoice.get(id);
  if (!inv) return res.status(404).json(err('Invoice not found'));
  const invst = await db.investment.create({ invoiceId: id, investorId, amount });
  await db.event.publish(EventType.INVESTMENT_MADE, { invoiceId: id, investmentId: invst.id, amount, investorId }, id);

  // Update funding progress and status
  const allInvestments = await db.investment.list(id);
  const total = allInvestments.reduce((s, it) => s + (it.amount || 0), 0);
  const fundedPct = Math.min(100, Math.round((total / (inv.amount || 1)) * 100));
  let newStatus: InvoiceStatus | undefined;
  if (fundedPct >= 100) newStatus = InvoiceStatus.FUNDED; else if (fundedPct > 0) newStatus = InvoiceStatus.INVESTING;
  const updated = await db.invoice.update(id, { fundedPct, status: newStatus || inv.status });

  // Hedera token transfer if FT exists, otherwise only publish event
  try {
    if (inv.ftId) {
      await HederaOps.investInInvoice(id, investorId, amount, inv.ftId);
    } else {
      await HederaOps.publishLifecycleEvent('INVESTMENT_MADE', id, { investorId, amount, fundedPct });
    }
    if (newStatus === InvoiceStatus.FUNDED) {
      await db.event.publish(EventType.INVOICE_FUNDED, { invoiceId: id, fundedPct: 100 }, id);
      await HederaOps.publishLifecycleEvent('INVOICE_FUNDED', id, { fundedPct: 100 });
    }
  } catch (e) {
    console.warn('[invoices] HederaOps investment publish skipped:', (e as Error).message);
  }

  res.status(201).json(ok(invst));
});

// Mark invoice as PAID (simulate settlement) and publish payouts
invoicesRouter.post('/:id/pay', async (req, res) => {
  const { id } = req.params;
  const inv = await db.invoice.get(id);
  if (!inv) return res.status(404).json(err('Invoice not found'));
  if (inv.status !== InvoiceStatus.FUNDED) {
    return res.status(400).json(err('Invoice must be FUNDED to mark as PAID'));
  }
  const allInvestments = await db.investment.list(id);
  const total = allInvestments.reduce((s, it) => s + (it.amount || 0), 0) || 1;
  const yieldBps = inv.yieldBps || 0;
  const grossYield = (inv.amount * yieldBps) / 10000;

  const payouts = allInvestments.map(it => {
    const share = it.amount / total;
    const principal = inv.amount * share;
    const yieldAmt = grossYield * share;
    return { investorId: it.investorId, principal, yield: yieldAmt, total: principal + yieldAmt };
  });

  const updated = await db.invoice.update(id, { status: InvoiceStatus.PAID });
  await db.event.publish(EventType.INVOICE_PAID, { invoiceId: id, payouts }, id);

  try {
    await HederaOps.publishLifecycleEvent('INVOICE_PAID', id, { payoutsCount: payouts.length });
  } catch {}

  res.json(ok(updated));
});