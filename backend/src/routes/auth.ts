import { Router } from 'express';
import { nanoid } from 'nanoid';
import type { ApiResponse } from '../types/index.js';

const nonces = new Map<string, string>();

export const authRouter = Router();

function ok<T>(data: T): ApiResponse<T> { return { success: true, data }; }
function err(message: string, code = 400): ApiResponse { return { success: false, error: message }; }

// NOTE: For now we only issue nonce. Signature verification can be integrated per wallet later.

authRouter.get('/nonce', (req, res) => {
  const sessionId = nanoid();
  const nonce = nanoid();
  nonces.set(sessionId, nonce);
  res.json(ok({ sessionId, nonce }));
});

// Placeholder verification endpoint
authRouter.post('/verify', (req, res) => {
  // In real-world, verify signature from wallet. For now accept any.
  res.json(ok({ authenticated: true }));
});