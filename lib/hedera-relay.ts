import { ethers } from 'ethers';
import { Client, ContractExecuteTransaction, ContractId, Hbar, AccountId, PrivateKey, ContractFunctionParameters } from '@hashgraph/sdk';
import { hcsService } from './hcs.ts';
import { HederaOps } from './hedera.ts';
import { env } from '../config/env.ts';

export interface CrossChainTransaction {
  id: string;
  fromChain: string;
  toChain: string;
  token: string;
  amount: string;
  recipient: string;
  status: 'pending' | 'confirmed' | 'failed';
  txHash?: string;
  hederaTxId?: string;
  timestamp: number;
}

export interface BridgeEvent {
  eventType: 'lock' | 'mint' | 'burn' | 'release';
  chainId: string;
  token: string;
  amount: string;
  user: string;
  nonce: number;
  signature?: string;
  timestamp: number;
}

/**
 * Hedera Relay Bridge Service
 * Handles cross-chain operations between Hedera and other EVM chains
 */
export class HederaRelayService {
  private hederaClient: Client;
  private ethProviders: Map<string, ethers.JsonRpcProvider> = new Map();
  private bridgeContracts: Map<string, ethers.Contract> = new Map();
  private hederaBridgeContract?: ContractId;

  constructor() {
    // Only initialize if not in demo mode and credentials available
    if (!env.DEMO_MODE && env.HEDERA_OPERATOR_ID && env.HEDERA_OPERATOR_KEY) {
      this.hederaClient = Client.forTestnet()
        .setOperator(
          AccountId.fromString(env.HEDERA_OPERATOR_ID),
          PrivateKey.fromString(env.HEDERA_OPERATOR_KEY)
        );
      this.initializeProviders();
    } else {
      // Create dummy client for demo mode
      this.hederaClient = Client.forTestnet();
    }
  }

  private initializeProviders() {
    // Initialize EVM providers for cross-chain (only in production)
    if (!env.DEMO_MODE) {
      if (env.ETHEREUM_RPC_URL) {
        this.ethProviders.set('ethereum', new ethers.JsonRpcProvider(env.ETHEREUM_RPC_URL));
      }
      if (env.BSC_RPC_URL) {
        this.ethProviders.set('bsc', new ethers.JsonRpcProvider(env.BSC_RPC_URL));
      }
      if (env.POLYGON_RPC_URL) {
        this.ethProviders.set('polygon', new ethers.JsonRpcProvider(env.POLYGON_RPC_URL));
      }

      // Initialize bridge contracts (simplified ABI)
      const bridgeABI = [
        'function lockTokens(address token, uint256 amount, string hederaRecipient) external',
        'function releaseTokens(address token, uint256 amount, address recipient, bytes signature) external',
        'event TokensLocked(address indexed user, address indexed token, uint256 amount, string hederaRecipient)',
        'event TokensReleased(address indexed user, address indexed token, uint256 amount)'
      ];

      for (const [chain, provider] of this.ethProviders) {
        const contractAddress = this.getBridgeContractAddress(chain);
        if (contractAddress && env.CROSSCHAIN_VALIDATOR_KEY) {
          const signer = new ethers.Wallet(env.CROSSCHAIN_VALIDATOR_KEY, provider);
          this.bridgeContracts.set(chain, new ethers.Contract(contractAddress, bridgeABI, signer));
        }
      }

      // Set Hedera bridge contract
      if (env.HEDERA_BRIDGE_CONTRACT) {
        this.hederaBridgeContract = ContractId.fromString(env.HEDERA_BRIDGE_CONTRACT);
      }
    }
  }

  private getBridgeContractAddress(chain: string): string | undefined {
    switch (chain) {
      case 'ethereum': return env.ETHEREUM_BRIDGE_CONTRACT;
      case 'bsc': return env.BSC_BRIDGE_CONTRACT;
      case 'polygon': return env.POLYGON_BRIDGE_CONTRACT;
      default: return undefined;
    }
  }

  /**
   * Bridge tokens from EVM chain to Hedera
   */
  async bridgeToHedera(
    fromChain: string,
    token: string,
    amount: string,
    hederaRecipient: string
  ): Promise<CrossChainTransaction> {
    const txId = `bridge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Demo mode simulation
    if (env.DEMO_MODE) {
      const demoTx: CrossChainTransaction = {
        id: txId,
        fromChain,
        toChain: 'hedera',
        token,
        amount,
        recipient: hederaRecipient,
        status: 'confirmed',
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        hederaTxId: `0.0.${Math.floor(Math.random() * 1000000)}@${Date.now()}`,
        timestamp: Date.now()
      };

      // Publish to HCS
      await hcsService.publishEvent({
        type: 'BRIDGE_TO_HEDERA' as any,
        data: demoTx,
        invoiceId: txId,
        timestamp: Date.now()
      });

      return demoTx;
    }
    
    try {
      const bridgeContract = this.bridgeContracts.get(fromChain);
      if (!bridgeContract) {
        throw new Error(`Bridge contract not found for chain: ${fromChain}`);
      }

      // Lock tokens on source chain
      const tx = await bridgeContract.lockTokens(token, amount, hederaRecipient);
      await tx.wait();

      const crossChainTx: CrossChainTransaction = {
        id: txId,
        fromChain,
        toChain: 'hedera',
        token,
        amount,
        recipient: hederaRecipient,
        status: 'pending',
        txHash: tx.hash,
        timestamp: Date.now()
      };

      // Publish cross-chain event to HCS
      await hcsService.publishEvent({
        type: 'BRIDGE_TO_HEDERA' as any,
        data: crossChainTx,
        invoiceId: txId,
        timestamp: Date.now()
      });

      // Process on Hedera side (mint tokens)
      const hederaTxId = await this.mintOnHedera(token, amount, hederaRecipient);
      
      crossChainTx.hederaTxId = hederaTxId;
      crossChainTx.status = 'confirmed';

      // Update status in HCS
      await hcsService.publishEvent({
        type: 'BRIDGE_CONFIRMED' as any,
        data: crossChainTx,
        invoiceId: txId,
        timestamp: Date.now()
      });

      return crossChainTx;

    } catch (error) {
      console.error('[HederaRelay] Bridge to Hedera failed:', error);
      
      const failedTx: CrossChainTransaction = {
        id: txId,
        fromChain,
        toChain: 'hedera',
        token,
        amount,
        recipient: hederaRecipient,
        status: 'failed',
        timestamp: Date.now()
      };

      await hcsService.publishEvent({
        type: 'BRIDGE_FAILED' as any,
        data: { ...failedTx, error: (error as Error).message },
        invoiceId: txId,
        timestamp: Date.now()
      });

      throw error;
    }
  }

  /**
   * Bridge tokens from Hedera to EVM chain
   */
  async bridgeFromHedera(
    toChain: string,
    token: string,
    amount: string,
    evmRecipient: string,
    hederaSender?: string
  ): Promise<CrossChainTransaction> {
    const txId = `bridge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Demo mode simulation
    if (env.DEMO_MODE) {
      const demoTx: CrossChainTransaction = {
        id: txId,
        fromChain: 'hedera',
        toChain,
        token,
        amount,
        recipient: evmRecipient,
        status: 'confirmed',
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        hederaTxId: `0.0.${Math.floor(Math.random() * 1000000)}@${Date.now()}`,
        timestamp: Date.now()
      };

      await hcsService.publishEvent({
        type: 'BRIDGE_FROM_HEDERA' as any,
        data: demoTx,
        invoiceId: txId,
        timestamp: Date.now()
      });

      return demoTx;
    }

    try {
      // Burn tokens on Hedera
      const hederaTxId = await this.burnOnHedera(token, amount, hederaSender || '');

      const crossChainTx: CrossChainTransaction = {
        id: txId,
        fromChain: 'hedera',
        toChain,
        token,
        amount,
        recipient: evmRecipient,
        status: 'pending',
        hederaTxId,
        timestamp: Date.now()
      };

      // Publish to HCS
      await hcsService.publishEvent({
        type: 'BRIDGE_FROM_HEDERA' as any,
        data: crossChainTx,
        invoiceId: txId,
        timestamp: Date.now()
      });

      // Release tokens on target chain
      const bridgeContract = this.bridgeContracts.get(toChain);
      if (!bridgeContract) {
        throw new Error(`Bridge contract not found for chain: ${toChain}`);
      }

      // Generate signature for release (simplified)
      const signature = await this.generateReleaseSignature(crossChainTx);
      const tx = await bridgeContract.releaseTokens(token, amount, evmRecipient, signature);
      await tx.wait();

      crossChainTx.txHash = tx.hash;
      crossChainTx.status = 'confirmed';

      // Update status
      await hcsService.publishEvent({
        type: 'BRIDGE_CONFIRMED' as any,
        data: crossChainTx,
        invoiceId: txId,
        timestamp: Date.now()
      });

      return crossChainTx;

    } catch (error) {
      console.error('[HederaRelay] Bridge from Hedera failed:', error);
      
      const failedTx: CrossChainTransaction = {
        id: txId,
        fromChain: 'hedera',
        toChain,
        token,
        amount,
        recipient: evmRecipient,
        status: 'failed',
        timestamp: Date.now()
      };

      await hcsService.publishEvent({
        type: 'BRIDGE_FAILED' as any,
        data: { ...failedTx, error: (error as Error).message },
        invoiceId: txId,
        timestamp: Date.now()
      });

      throw error;
    }
  }

  private async mintOnHedera(token: string, amount: string, recipient: string): Promise<string> {
    if (!this.hederaBridgeContract) {
      throw new Error('Hedera bridge contract not configured');
    }

    // Use ContractFunctionParameters for proper parameter encoding
    const functionParameters = new ContractFunctionParameters()
      .addString(token)        // Original token address
      .addUint256(amount)      // Amount to mint
      .addString(recipient);   // Hedera recipient account

    const mintTx = new ContractExecuteTransaction()
      .setContractId(this.hederaBridgeContract)
      .setGas(100000)
      .setFunction('mintWrappedToken', functionParameters)
      .setMaxTransactionFee(new Hbar(2));

    const response = await mintTx.execute(this.hederaClient);
    const receipt = await response.getReceipt(this.hederaClient);
    
    return response.transactionId.toString();
  }

  private async burnOnHedera(token: string, amount: string, sender: string): Promise<string> {
    if (!this.hederaBridgeContract) {
      throw new Error('Hedera bridge contract not configured');
    }

    const functionParameters = new ContractFunctionParameters()
      .addString(token)      // Wrapped token ID
      .addUint256(amount)    // Amount to burn
      .addString(sender);    // Token holder

    const burnTx = new ContractExecuteTransaction()
      .setContractId(this.hederaBridgeContract)
      .setGas(100000)
      .setFunction('burnWrappedToken', functionParameters)
      .setMaxTransactionFee(new Hbar(2));

    const response = await burnTx.execute(this.hederaClient);
    const receipt = await response.getReceipt(this.hederaClient);
    
    return response.transactionId.toString();
  }

  private async generateReleaseSignature(tx: CrossChainTransaction): Promise<string> {
    if (!env.CROSSCHAIN_VALIDATOR_KEY) {
      throw new Error('Cross-chain validator key not configured');
    }

    // Generate validator signature for token release
    const validatorWallet = new ethers.Wallet(env.CROSSCHAIN_VALIDATOR_KEY);
    
    const message = ethers.solidityPackedKeccak256(
      ['string', 'address', 'uint256', 'string', 'uint256'],
      [tx.token, tx.recipient, tx.amount, tx.id, tx.timestamp]
    );
    
    return await validatorWallet.signMessage(ethers.getBytes(message));
  }

  /**
   * Get cross-chain transaction status
   */
  async getTransactionStatus(txId: string): Promise<CrossChainTransaction | null> {
    try {
      const events = await hcsService.getEvents(txId);
      const latestEvent = events
        .filter(e => ['BRIDGE_TO_HEDERA', 'BRIDGE_FROM_HEDERA', 'BRIDGE_CONFIRMED', 'BRIDGE_FAILED'].includes(e.type))
        .sort((a, b) => b.timestamp - a.timestamp)[0];

      return latestEvent?.data as CrossChainTransaction || null;
    } catch (error) {
      console.error('[HederaRelay] Get transaction status failed:', error);
      return null;
    }
  }

  /**
   * Get supported chains and their bridge contracts
   */
  getSupportedChains(): Record<string, { rpc: string; bridge: string }> {
    const chains: Record<string, { rpc: string; bridge: string }> = {};
    
    if (env.DEMO_MODE) {
      // Return demo chains
      return {
        ethereum: { rpc: 'https://sepolia.infura.io/v3/demo', bridge: '0x1234...demo' },
        bsc: { rpc: 'https://bsc-testnet.public.blastapi.io', bridge: '0x5678...demo' },
        polygon: { rpc: 'https://polygon-mumbai.g.alchemy.com/v2/demo', bridge: '0x9abc...demo' }
      };
    }
    
    for (const [chain, provider] of this.ethProviders) {
      const bridge = this.getBridgeContractAddress(chain);
      if (bridge) {
        chains[chain] = {
          rpc: provider.url || '',
          bridge
        };
      }
    }

    return chains;
  }

  /**
   * Get bridge status by event ID
   */
  async getBridgeStatus(eventId: string): Promise<{
    status: 'pending' | 'confirmed' | 'failed';
    sourceChain?: string;
    targetChain?: string;
    amount?: string;
    userAddress?: string;
    hederaTxId?: string;
    evmTxHash?: string;
    timestamp?: string;
  }> {
    try {
      // Get events from HCS 
      const events = await hcsService.getEvents(eventId);
      const bridgeEvent = events.find(e => e.invoiceId === eventId);
      
      if (!bridgeEvent) {
        return { status: 'failed' };
      }

      const txData = bridgeEvent.data as CrossChainTransaction;
      
      return {
        status: txData.status || 'confirmed',
        sourceChain: txData.fromChain,
        targetChain: txData.toChain,
        amount: txData.amount,
        userAddress: txData.recipient,
        hederaTxId: txData.hederaTxId,
        evmTxHash: txData.txHash,
        timestamp: new Date(txData.timestamp).toISOString()
      };
    } catch (error) {
      console.error('Failed to get bridge status:', error);
      return { status: 'failed' };
    }
  }

  /**
   * Get user's bridge history
   */
  async getUserBridgeHistory(
    userAddress: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<Array<{
    eventId: string;
    sourceChain: string;
    targetChain: string;
    amount: string;
    status: 'pending' | 'confirmed' | 'failed';
    timestamp: string;
    hederaTxId?: string;
    evmTxHash?: string;
  }>> {
    try {
      // Get events from HCS topic
      const events = await hcsService.getEvents();
      
      // Filter bridge events for this user and apply pagination
      const userEvents = events
        .filter(e => ['BRIDGE_TO_HEDERA', 'BRIDGE_FROM_HEDERA'].includes(e.type))
        .filter(e => {
          const txData = e.data as CrossChainTransaction;
          return txData.recipient === userAddress || txData.token === userAddress;
        })
        .slice(offset, offset + limit)
        .map(e => {
          const txData = e.data as CrossChainTransaction;
          return {
            eventId: txData.id,
            sourceChain: txData.fromChain,
            targetChain: txData.toChain,
            amount: txData.amount,
            status: txData.status,
            timestamp: new Date(txData.timestamp).toISOString(),
            hederaTxId: txData.hederaTxId,
            evmTxHash: txData.txHash
          };
        });

      return userEvents;
    } catch (error) {
      console.error('Failed to get user bridge history:', error);
      return [];
    }
  }

  /**
   * Validate bridge parameters
   */
  async validateBridgeParameters(params: {
    sourceChain?: string;
    targetChain?: string;
    amount?: string;
    tokenAddress?: string;
  }): Promise<{
    isValid: boolean;
    errors: string[];
    suggestions?: string[];
  }> {
    const errors: string[] = [];
    const suggestions: string[] = [];

    // Validate source chain
    if (!params.sourceChain) {
      errors.push('Source chain is required');
    } else {
      const supportedChains = this.getSupportedChains();
      if (params.sourceChain !== 'hedera' && !supportedChains[params.sourceChain]) {
        errors.push(`Unsupported source chain: ${params.sourceChain}`);
        suggestions.push(`Supported chains: hedera, ${Object.keys(supportedChains).join(', ')}`);
      }
    }

    // Validate target chain
    if (!params.targetChain) {
      errors.push('Target chain is required');
    } else if (params.targetChain === params.sourceChain) {
      errors.push('Source and target chains cannot be the same');
    } else {
      const supportedChains = this.getSupportedChains();
      if (params.targetChain !== 'hedera' && !supportedChains[params.targetChain]) {
        errors.push(`Unsupported target chain: ${params.targetChain}`);
        suggestions.push(`Supported chains: hedera, ${Object.keys(supportedChains).join(', ')}`);
      }
    }

    // Validate amount
    if (!params.amount) {
      errors.push('Amount is required');
    } else {
      const amount = parseFloat(params.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.push('Amount must be a positive number');
      } else if (amount < 0.001) {
        errors.push('Minimum bridge amount is 0.001 tokens');
      }
    }

    // Validate token address format
    if (params.tokenAddress) {
      if (params.sourceChain === 'hedera') {
        // Hedera token ID format: 0.0.xxxxx
        if (!/^0\.0\.\d+$/.test(params.tokenAddress)) {
          errors.push('Invalid Hedera token ID format (expected: 0.0.xxxxx)');
        }
      } else {
        // EVM address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(params.tokenAddress)) {
          errors.push('Invalid EVM token address format (expected: 0x...)');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  }

  /**
   * Monitor cross-chain events for auto-processing
   */
  async startEventMonitoring() {
    console.log('[HederaRelay] Starting cross-chain event monitoring...');
    
    // Monitor HCS for bridge events
    // In production, this would run as a background service
    setInterval(async () => {
      try {
        const recentEvents = await hcsService.getEvents();
        const pendingBridges = recentEvents
          .filter(e => ['BRIDGE_TO_HEDERA', 'BRIDGE_FROM_HEDERA'].includes(e.type))
          .filter(e => (e.data as CrossChainTransaction).status === 'pending');

        for (const event of pendingBridges) {
          const tx = event.data as CrossChainTransaction;
          console.log(`[HederaRelay] Processing pending bridge: ${tx.id}`);
          // Process pending transactions
        }
      } catch (error) {
        console.error('[HederaRelay] Event monitoring error:', error);
      }
    }, 30000); // Check every 30 seconds
  }
}

export const hederaRelayService = new HederaRelayService();