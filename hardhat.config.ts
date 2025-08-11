import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import * as dotenv from 'dotenv';

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hedera: {
      url: 'https://testnet.hashio.io/api',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 296
    },
    hedera_mainnet: {
      url: 'https://mainnet.hashio.io/api',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 295
    }
  },
  etherscan: {
    apiKey: {
      hedera: 'no-api-key-needed'
    },
    customChains: [
      {
        network: 'hedera',
        chainId: 296,
        urls: {
          apiURL: 'https://testnet.hashio.io/api',
          browserURL: 'https://hashscan.io/testnet'
        }
      }
    ]
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts'
  }
};

export default config;