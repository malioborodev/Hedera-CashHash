import multer from 'multer';
import crypto from 'crypto';

export const upload = multer({ storage: multer.memoryStorage() });

export function hashFile(buffer: Buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}