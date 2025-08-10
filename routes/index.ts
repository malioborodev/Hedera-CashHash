import { Router } from 'express';
import { invoicesRouter } from './invoices.js';
import { authRouter } from './auth.js';
import { verifyRouter } from './verify.js';
import { eventsRouter } from './events.js';

export const api = Router();

api.use('/auth', authRouter);
api.use('/invoices', invoicesRouter);
api.use('/verify', verifyRouter);
api.use('/events', eventsRouter);