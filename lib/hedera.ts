import { 
  Client, 
  PrivateKey, 
  AccountId,
  PublicKey,
  KeyList,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  FileCreateTransaction,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TransferTransaction,
  Hbar,
  TokenId,
  TopicId,
  FileId,
  Status
} from '@hashgraph/sdk';
import { env } from '../config/env.ts';

// Hedera client initialization
let client: Client | null = null;
let operatorPublicKey: PublicKey | null = null;
let operatorAccount: AccountId | null = null;

export function getHederaClient(): Client {
  if (!client) {
    if (env.DEMO_MODE) {
      // Return a mock client for demo mode
      throw new Error('Demo mode - Hedera operations disabled');
    }
    
    const operatorId = AccountId.fromString(env.HEDERA_OPERATOR_ID!);
    const operatorKey = PrivateKey.fromString(env.HEDERA_OPERATOR_KEY!);
    
    client = env.HEDERA_NETWORK === 'mainnet' 
      ? Client.forMainnet()
      : Client.forTestnet();
      
    client.setOperator(operatorId, operatorKey);
    operatorPublicKey = operatorKey.publicKey;
    operatorAccount = operatorId;
  }
  return client;
}

// HTS Operations for Invoice Tokenization
export class HederaTokenService {
  static async createInvoiceNFT(invoiceId: string, metadata: Record<string, any>) {
    if (env.DEMO_MODE) return { tokenId: `demo-nft-${invoiceId}`, status: 'DEMO' };
    
    const client = getHederaClient();
    const operatorId = operatorAccount!;
    
    const transaction = new TokenCreateTransaction()
      .setTokenName(`CashHash Invoice ${invoiceId}`)
      .setTokenSymbol('CASH-INV')
      .setTokenType(TokenType.NonFungibleUnique)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(1)
      .setTreasuryAccountId(operatorId)
      .setAdminKey(operatorPublicKey!)
      .setSupplyKey(operatorPublicKey!)
      .setAutoRenewAccountId(operatorId)
      .setAutoRenewPeriod(7776000); // 90 days
    
    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    
    return {
      tokenId: receipt.tokenId?.toString(),
      status: receipt.status.toString(),
      transactionId: response.transactionId.toString()
    };
  }
  
  static async createInvoiceFT(invoiceId: string, supply: number) {
    if (env.DEMO_MODE) return { tokenId: `demo-ft-${invoiceId}`, status: 'DEMO' };
    
    const client = getHederaClient();
    const operatorId = operatorAccount!;
    
    const transaction = new TokenCreateTransaction()
      .setTokenName(`CashHash Units ${invoiceId}`)
      .setTokenSymbol('CASH-UNIT')
      .setTokenType(TokenType.FungibleCommon)
      .setInitialSupply(supply)
      .setDecimals(6) // 6 decimal places for fractional investment
      .setTreasuryAccountId(operatorId)
      .setAdminKey(operatorPublicKey!)
      .setSupplyKey(operatorPublicKey!)
      .setAutoRenewAccountId(operatorId)
      .setAutoRenewPeriod(7776000);
    
    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    
    return {
      tokenId: receipt.tokenId?.toString(),
      status: receipt.status.toString(),
      transactionId: response.transactionId.toString()
    };
  }
  
  static async transferTokens(tokenId: string, toAccount: string, amount: number) {
    if (env.DEMO_MODE) return { status: 'DEMO', txId: `demo-transfer-${Date.now()}` };
    
    const client = getHederaClient();
    
    const transaction = new TransferTransaction()
      .addTokenTransfer(TokenId.fromString(tokenId), operatorAccount!, -amount)
      .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(toAccount), amount);
    
    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    
    return {
      status: receipt.status.toString(),
      txId: response.transactionId.toString()
    };
  }
}

// HCS Operations for Event Publishing
export class HederaConsensusService {
  private static topicId: TopicId | null = null;
  
  static async initializeTopic() {
    if (env.DEMO_MODE) return 'demo-topic-id';
    
    const client = getHederaClient();
    
    const transaction = new TopicCreateTransaction()
      .setTopicMemo('CashHash Event Stream')
      .setAdminKey(operatorPublicKey!)
      .setSubmitKey(operatorPublicKey!);
    
    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    this.topicId = receipt.topicId!;
    
    return this.topicId.toString();
  }
  
  static async publishEvent(eventType: string, payload: Record<string, any>) {
    if (env.DEMO_MODE) {
      console.log(`[HCS Demo] ${eventType}:`, payload);
      return { status: 'DEMO', consensusAt: new Date().toISOString() };
    }
    
    if (!this.topicId) {
      await this.initializeTopic();
    }
    
    const client = getHederaClient();
    const message = JSON.stringify({
      eventType,
      payload,
      timestamp: new Date().toISOString(),
      version: '1.0'
    });
    
    const transaction = new TopicMessageSubmitTransaction()
      .setTopicId(this.topicId!)
      .setMessage(message);
    
    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    
    return {
      status: receipt.status.toString(),
      consensusAt: new Date().toISOString(),
      txId: response.transactionId.toString()
    };
  }
}

// File Service Operations for Invoice Storage
export class HederaFileService {
  static async uploadInvoiceFile(content: Buffer, metadata: Record<string, any>) {
    if (env.DEMO_MODE) return { fileId: `demo-file-${Date.now()}`, status: 'DEMO' };
    
    const client = getHederaClient();
    
    // Create file with metadata header + content
    const header = Buffer.from(JSON.stringify(metadata) + '\n---\n');
    const fullContent = Buffer.concat([header, content]);
    
    const transaction = new FileCreateTransaction()
      .setKeys(new KeyList([operatorPublicKey!]))
      .setContents(fullContent)
      .setAutoRenewAccountId(operatorAccount!)
      .setAutoRenewPeriod(31536000); // 1 year
    
    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    
    return {
      fileId: receipt.fileId?.toString(),
      status: receipt.status.toString(),
      txId: response.transactionId.toString()
    };
  }
}

// Integrated CashHash Hedera Operations
export const HederaOps = {
  // Invoice lifecycle with full Hedera integration
  async createInvoice(invoiceData: any, fileBuffer?: Buffer) {
    const results: any = {};
    
    try {
      // 1. Create NFT for invoice ownership
      results.nft = await HederaTokenService.createInvoiceNFT(
        invoiceData.id,
        { 
          invoiceId: invoiceData.id,
          amount: invoiceData.amount,
          currency: invoiceData.currency,
          sellerId: invoiceData.sellerId
        }
      );
      
      // 2. Create FT for investment units
      const totalUnits = Math.floor((invoiceData.amount || 0) * 1_000_000); // 6 decimals
      results.ft = await HederaTokenService.createInvoiceFT(invoiceData.id, totalUnits);
      
      // 3. Upload file to Hedera File Service if provided
      if (fileBuffer) {
        results.file = await HederaFileService.uploadInvoiceFile(fileBuffer, {
          invoiceId: invoiceData.id,
          filename: invoiceData.filename || 'invoice.pdf',
          uploadedAt: new Date().toISOString()
        });
      }
      
      // 4. Publish creation event to HCS
      results.event = await HederaConsensusService.publishEvent('INVOICE_CREATED', {
        invoiceId: invoiceData.id,
        nftId: results.nft.tokenId,
        ftId: results.ft.tokenId,
        fileId: results.file?.fileId,
        amount: invoiceData.amount,
        currency: invoiceData.currency
      });
      
      return results;
    } catch (error) {
      console.error('[HederaOps] Create invoice failed:', error);
      throw error;
    }
  },
  
  async investInInvoice(invoiceId: string, investorId: string, amount: number, tokenId: string) {
    try {
      // Transfer investment tokens to investor (from operator/treasury)
      const transfer = await HederaTokenService.transferTokens(
        tokenId,
        investorId,
        Math.floor((amount || 0) * 1_000_000) // Convert to token units
      );
      
      // Publish investment event
      const event = await HederaConsensusService.publishEvent('INVESTMENT_MADE', {
        invoiceId,
        investorId,
        amount,
        tokenId,
        transferTxId: transfer.txId
      });
      
      return { transfer, event };
    } catch (error) {
      console.error('[HederaOps] Investment failed:', error);
      throw error;
    }
  },
  
  async publishLifecycleEvent(eventType: string, invoiceId: string, payload: Record<string, any>) {
    return await HederaConsensusService.publishEvent(eventType, {
      invoiceId,
      ...payload,
      timestamp: new Date().toISOString()
    });
  }
};