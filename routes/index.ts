import { Router } from 'express';
import { invoicesRouter } from './invoices.ts';
import { authRouter } from './auth.ts';
import { verifyRouter } from './verify.ts';
import { eventsRouter } from './events.ts';

export const api = Router();

api.use('/auth', authRouter);
api.use('/invoices', invoicesRouter);
api.use('/verify', verifyRouter);
api.use('/events', eventsRouter);