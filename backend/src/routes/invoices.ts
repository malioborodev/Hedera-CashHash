import { Router } from 'express';
import { db } from '../lib/db.js';
import type { Invoice } from '../types/index.js';
import { InvoiceStatus, EventType } from '../types/index.js';
import { upload, hashFile } from '../lib/multer.js';

export const invoicesRouter = Router();

function ok<T>(data: T) { return { success: true, data }; }
function err(message: string) { return { success: false, error: message }; }

// List invoices with optional status filter
invoicesRouter.get('/', (req, res) => {
  const { status } = req.query as { status?: string };
  const items = db.invoice.list(status as InvoiceStatus | undefined);
  res.json(ok(items));
});

// Create invoice
invoicesRouter.post('/', (req, res) => {
  const { sellerId, buyerId, dueDate, amount, currency } = req.body as Partial<Invoice>;
  if (!sellerId || !dueDate || !amount || !currency) {
    return res.status(400).json(err('sellerId, dueDate, amount, currency required'));
  }
  const inv = db.invoice.create({ sellerId, buyerId, dueDate, amount, currency });
  db.event.publish(EventType.INVOICE_CREATED, { invoiceId: inv.id, amount, currency });
  res.status(201).json(ok(inv));
});

// Upload invoice file and attach to invoice
invoicesRouter.post('/:id/upload', upload.single('file'), (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json(err('file required'));
  const inv = db.invoice.get(id);
  if (!inv) return res.status(404).json(err('Invoice not found'));
  const hash = hashFile(req.file.buffer);
  const rec = db.file.create({
    invoiceId: id,
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    sha256: hash,
    buffer: req.file.buffer,
  });
  const updated = db.invoice.update(id, { fileId: rec.id });
  db.event.publish(EventType.FILE_UPLOADED, { invoiceId: id, fileId: rec.id, sha256: hash }, id);
  res.json(ok({ invoice: updated, file: rec }));
});

// List file metadata for an invoice
invoicesRouter.get('/:id/file', (req, res) => {
  const { id } = req.params;
  const file = db.file.getByInvoice(id);
  if (!file) return res.status(404).json(err('No file for invoice'));
  const { buffer, ...meta } = file;
  res.json(ok(meta));
});

// Download file
invoicesRouter.get('/:id/file/download', (req, res) => {
  const { id } = req.params;
  const file = db.file.getByInvoice(id);
  if (!file) return res.status(404).json(err('No file for invoice'));
  res.setHeader('Content-Type', file.mimetype);
  res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
  res.send(file.buffer);
});

// Update status to LISTED and publish event
invoicesRouter.post('/:id/list', (req, res) => {
  const { id } = req.params;
  const inv = db.invoice.get(id);
  if (!inv) return res.status(404).json(err('Invoice not found'));
  const updated = db.invoice.update(id, { status: InvoiceStatus.LISTED });
  db.event.publish(EventType.INVOICE_LISTED, { invoiceId: id }, id);
  res.json(ok(updated));
});

// Invest into an invoice
invoicesRouter.post('/:id/invest', (req, res) => {
  const { id } = req.params;
  const { investorId, amount } = req.body as { investorId?: string; amount?: number };
  if (!investorId || !amount) return res.status(400).json(err('investorId and amount required'));
  const inv = db.invoice.get(id);
  if (!inv) return res.status(404).json(err('Invoice not found'));
  const invst = db.investment.create({ invoiceId: id, investorId, amount });
  db.event.publish(EventType.INVESTMENT_MADE, { invoiceId: id, investmentId: invst.id, amount }, id);
  res.status(201).json(ok(invst));
});