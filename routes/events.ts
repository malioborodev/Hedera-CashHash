import { Router } from 'express';
import { db } from '../lib/db.ts';
import { EventType } from '../types/index.ts';
import { HederaOps } from '../lib/hedera.ts';

export const eventsRouter = Router();

// GET /api/events?after=iso&invoiceId=xxx&type=INVOICE_LISTED
eventsRouter.get('/', async (req, res) => {
  const { after, invoiceId, type } = req.query as { after?: string; invoiceId?: string; type?: EventType };
  const items = db.event.list(after, invoiceId, type as EventType | undefined);

  // Best-effort: publish a heartbeat/metrics event to HCS
  try {
    await HederaOps.publishLifecycleEvent('EVENTS_QUERIED', 'system', { count: items.length, filter: { after, invoiceId, type } });
  } catch {}

  res.json({ success: true, data: items });
});