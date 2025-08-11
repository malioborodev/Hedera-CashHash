import { Router } from 'express';
import { invoicesRouter } from './invoices.ts';
import { eventsRouter } from './events.ts';

export const api = Router();

api.use('/invoices', invoicesRouter);
api.use('/events', eventsRouter);