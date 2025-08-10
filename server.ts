import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { env } from './config/env.ts';
import { api } from './routes/index.ts';

dotenv.config();

const app = express();

app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => res.json({ ok: true, env: env.NODE_ENV }));
app.use('/api', api);

const port = env.PORT;
app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`);
});