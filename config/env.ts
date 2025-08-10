import dotenv from 'dotenv';

dotenv.config();

export const env = {
  // Server
  PORT: parseInt(process.env.PORT || '3001'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Demo Mode (default true if not provided)
  DEMO_MODE: process.env.DEMO_MODE ? process.env.DEMO_MODE === 'true' : true,
  
  // Hedera
  HEDERA_NETWORK: process.env.HEDERA_NETWORK || 'testnet',
  HEDERA_OPERATOR_ID: process.env.HEDERA_OPERATOR_ID,
  HEDERA_OPERATOR_KEY: process.env.HEDERA_OPERATOR_KEY,
} as const;

// Validate required env vars in production or when demo mode disabled
if (!env.DEMO_MODE) {
  if (!env.HEDERA_OPERATOR_ID || !env.HEDERA_OPERATOR_KEY) {
    throw new Error('HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY are required when DEMO_MODE is false');
  }
}