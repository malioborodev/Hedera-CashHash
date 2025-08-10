import { Router } from 'express';
import { db } from '../lib/db.js';
import { EventType } from '../types/index.js';

export const eventsRouter = Router();

// GET /api/events?after=iso&invoiceId=xxx&type=INVOICE_LISTED
eventsRouter.get('/', (req, res) => {
  const { after, invoiceId, type } = req.query as { after?: string; invoiceId?: string; type?: EventType };
  const items = db.event.list(after, invoiceId, type as EventType | undefined);
  res.json({ success: true, data: items });
});