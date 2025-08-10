import { Router } from 'express';
import { db } from '../lib/db.ts';
import { EventType, InvoiceStatus } from '../types/index.ts';

export const verifyRouter = Router();

function ok(data: any) { return { success: true, data }; }
function err(message: string) { return { success: false, error: message }; }

verifyRouter.post('/buyer-ack', (req, res) => {
  const { invoiceId, buyerId } = req.body as { invoiceId?: string; buyerId?: string };
  if (!invoiceId || !buyerId) return res.status(400).json(err('invoiceId and buyerId required'));
  const inv = db.invoice.get(invoiceId);
  if (!inv) return res.status(404).json(err('Invoice not found'));
  const updated = db.invoice.update(invoiceId, { buyerId });
  db.event.publish(EventType.BUYER_ACK, { invoiceId, buyerId }, invoiceId);
  return res.json(ok(updated));
});

verifyRouter.post('/attester-sign', (req, res) => {
  const { invoiceId, attesterId } = req.body as { invoiceId?: string; attesterId?: string };
  if (!invoiceId || !attesterId) return res.status(400).json(err('invoiceId dan attesterId wajib'));
  const inv = db.invoice.get(invoiceId);
  if (!inv) return res.status(404).json(err('Invoice not found'));
  const updated = db.invoice.update(invoiceId, { attesterId });
  db.event.publish(EventType.ATTESTER_SIGN, { invoiceId, attesterId }, invoiceId);
  return res.json(ok(updated));
});