import dotenv from 'dotenv';

dotenv.config();

export const env = {
  // Server
  PORT: parseInt(process.env.PORT || '3001'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Demo Mode (default false for 100% Hedera-native)
  DEMO_MODE: process.env.DEMO_MODE === 'true' || false,
  
  // Hedera Network
  HEDERA_NETWORK: process.env.HEDERA_NETWORK || 'testnet',
  HEDERA_OPERATOR_ID: process.env.HEDERA_OPERATOR_ID,
  HEDERA_OPERATOR_KEY: process.env.HEDERA_OPERATOR_KEY,
  HEDERA_ACCOUNT_ID: process.env.HEDERA_OPERATOR_ID,
  HEDERA_PRIVATE_KEY: process.env.HEDERA_OPERATOR_KEY,
  
  // HCS (Consensus Service)
  HCS_TOPIC_ID: process.env.HCS_TOPIC_ID || '0.0.4000000',
  
  // Mirror Node
  MIRROR_BASE: process.env.MIRROR_BASE || 'https://testnet.mirrornode.hedera.com',
  
  // Cross-chain Hedera Relay
  HEDERA_RELAY_URL: process.env.HEDERA_RELAY_URL || 'https://relay.hedera.com',
  ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL || 'https://eth-sepolia.public.blastapi.io',
  BSC_RPC_URL: process.env.BSC_RPC_URL || 'https://bsc-testnet.public.blastapi.io',
  POLYGON_RPC_URL: process.env.POLYGON_RPC_URL || 'https://polygon-mumbai.g.alchemy.com/v2/demo',
  
  // Bridge Contracts
  ETHEREUM_BRIDGE_CONTRACT: process.env.ETHEREUM_BRIDGE_CONTRACT,
  BSC_BRIDGE_CONTRACT: process.env.BSC_BRIDGE_CONTRACT,
  POLYGON_BRIDGE_CONTRACT: process.env.POLYGON_BRIDGE_CONTRACT,
  
  // Cross-chain validator keys
  CROSSCHAIN_VALIDATOR_KEY: process.env.CROSSCHAIN_VALIDATOR_KEY,
} as const;

// Validate required env vars for 100% Hedera-native
if (!env.DEMO_MODE) {
  if (!env.HEDERA_OPERATOR_ID || !env.HEDERA_OPERATOR_KEY) {
    throw new Error('HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY are required for 100% Hedera-native operations');
  }
}