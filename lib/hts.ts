import { 
  Client, 
  TokenCreateTransaction, 
  TokenAssociateTransaction, 
  TransferTransaction, 
  AccountId, 
  PrivateKey, 
  TokenId,
  TokenType,
  TokenSupplyType,
  Hbar,
  AccountBalanceQuery,
  TokenInfoQuery
} from "@hashgraph/sdk";
import { env } from "../config/env.ts";
import { hcsService } from "./hcs";

const client = Client.forTestnet();

// Only set operator in production mode
if (!env.DEMO_MODE && env.HEDERA_OPERATOR_ID && env.HEDERA_OPERATOR_KEY) {
  client.setOperator(env.HEDERA_OPERATOR_ID, env.HEDERA_OPERATOR_KEY);
}

export interface InvoiceToken {
  tokenId: string;
  invoiceId: string;
  amount: number;
  dueDate: Date;
  debtor: string;
  status: 'ACTIVE' | 'PAID' | 'DEFAULTED';
}

export interface PlatformFeeToken {
  tokenId: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
}

export class HTSService {
  // Demo mode storage for non-Hedera simulation
  private static demoTokens = new Map<string, any>();
  private static demoNFTs = new Map<string, any>();

  async createNFT(params: {
    name: string;
    symbol: string;
    description: string;
    metadata: any;
  }): Promise<{ tokenId: string }> {
    if (env.DEMO_MODE) {
      const tokenId = `NFT-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
      HTSService.demoNFTs.set(tokenId, {
        ...params,
        tokenId,
        createdAt: new Date().toISOString()
      });
      return { tokenId };
    }

    const transaction = new TokenCreateTransaction()
      .setTokenName(params.name)
      .setTokenSymbol(params.symbol)
      .setTokenType(TokenType.NonFungibleUnique)
      .setTreasuryAccountId(AccountId.fromString(env.HEDERA_OPERATOR_ID))
      .setAdminKey(PrivateKey.fromString(env.HEDERA_OPERATOR_KEY))
      .setSupplyKey(PrivateKey.fromString(env.HEDERA_OPERATOR_KEY))
      .setTokenMemo(params.description)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(1);

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    
    const tokenId = receipt.tokenId?.toString();
    if (!tokenId) {
      throw new Error('Failed to create NFT');
    }

    return { tokenId };
  }

  async createFungibleToken(params: {
    name: string;
    symbol: string;
    decimals: number;
    initialSupply: number;
    treasuryAccount: string;
    metadata: any;
  }): Promise<{ tokenId: string }> {
    if (env.DEMO_MODE) {
      const tokenId = `FT-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
      HTSService.demoTokens.set(tokenId, {
        ...params,
        tokenId,
        createdAt: new Date().toISOString()
      });
      return { tokenId };
    }

    const transaction = new TokenCreateTransaction()
      .setTokenName(params.name)
      .setTokenSymbol(params.symbol)
      .setTokenType(TokenType.FungibleCommon)
      .setDecimals(params.decimals)
      .setInitialSupply(params.initialSupply)
      .setTreasuryAccountId(AccountId.fromString(params.treasuryAccount))
      .setAdminKey(PrivateKey.fromString(env.HEDERA_OPERATOR_KEY))
      .setSupplyKey(PrivateKey.fromString(env.HEDERA_OPERATOR_KEY))
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(params.initialSupply * 10);

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    
    const tokenId = receipt.tokenId?.toString();
    if (!tokenId) {
      throw new Error('Failed to create fungible token');
    }

    return { tokenId };
  }

  async transferHBAR(params: {
    from: string;
    to: string;
    amount: number;
  }): Promise<{ txHash: string }> {
    if (env.DEMO_MODE) {
      const txHash = `demo-hbar-tx-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
      return { txHash };
    }

    const transaction = new TransferTransaction()
      .addHbarTransfer(AccountId.fromString(params.from), new Hbar(-params.amount))
      .addHbarTransfer(AccountId.fromString(params.to), new Hbar(params.amount));

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    
    return { txHash: receipt.transactionId.toString() };
  }

  async transferTokens(params: {
    tokenId: string;
    from: string;
    to: string;
    amount: number;
  }): Promise<string> {
    if (env.DEMO_MODE) {
      return `demo-token-tx-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
    }

    const transaction = new TransferTransaction()
      .addTokenTransfer(TokenId.fromString(params.tokenId), AccountId.fromString(params.from), -params.amount)
      .addTokenTransfer(TokenId.fromString(params.tokenId), AccountId.fromString(params.to), params.amount);

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    
    return receipt.transactionId.toString();
  }

  async createInvoiceToken(params: {
    invoiceId: string;
    amount: number;
    exporter: string;
    metadata: any;
  }): Promise<string> {
    if (env.DEMO_MODE) {
      const tokenId = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
      HTSService.demoTokens.set(tokenId, {
        ...params,
        tokenId,
        createdAt: new Date().toISOString()
      });
      return tokenId;
    }

    const tokenName = `Invoice-${params.invoiceId}`;
    const tokenSymbol = `INV-${params.invoiceId.slice(0, 8)}`;

    const transaction = new TokenCreateTransaction()
      .setTokenName(tokenName)
      .setTokenSymbol(tokenSymbol)
      .setTokenType(TokenType.FungibleCommon)
      .setDecimals(0)
      .setInitialSupply(params.amount)
      .setTreasuryAccountId(AccountId.fromString(params.exporter))
      .setAdminKey(PrivateKey.fromString(env.HEDERA_OPERATOR_KEY))
      .setSupplyKey(PrivateKey.fromString(env.HEDERA_OPERATOR_KEY))
      .setWipeKey(PrivateKey.fromString(env.HEDERA_OPERATOR_KEY))
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(params.amount);

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    
    const tokenId = receipt.tokenId?.toString();
    
    if (!tokenId) {
      throw new Error('Failed to create invoice token');
    }

    await hcsService.publishListedEvent(params.invoiceId, {
      tokenId,
      amount: params.amount,
      exporter: params.exporter,
      metadata: params.metadata
    });

    return tokenId;
  }

  async createPlatformFeeToken(): Promise<string> {
    const transaction = new TokenCreateTransaction()
      .setTokenName("CashHash Platform Fee")
      .setTokenSymbol("CHPF")
      .setTokenType(TokenType.FungibleCommon)
      .setDecimals(2)
      .setInitialSupply(1000000)
      .setTreasuryAccountId(AccountId.fromString(env.HEDERA_OPERATOR_ID))
      .setAdminKey(PrivateKey.fromString(env.HEDERA_OPERATOR_KEY))
      .setSupplyKey(PrivateKey.fromString(env.HEDERA_OPERATOR_KEY))
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(1000000);

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    
    return receipt.tokenId?.toString() || '';
  }

  async associateToken(accountId: string, tokenId: string): Promise<void> {
    if (env.DEMO_MODE) {
      // No-op in demo mode
      return;
    }
    const transaction = new TokenAssociateTransaction()
      .setAccountId(AccountId.fromString(accountId))
      .setTokenIds([TokenId.fromString(tokenId)]);

    await transaction.execute(client);
  }

  async transferToken(
    tokenId: string,
    fromAccount: string,
    toAccount: string,
    amount: number
  ): Promise<string> {
    if (env.DEMO_MODE) {
      return `demo-transfer-tx-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
    }
    const transaction = new TransferTransaction()
      .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(fromAccount), -amount)
      .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(toAccount), amount);

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    
    return receipt.transactionId.toString();
  }

  async getTokenBalance(accountId: string, tokenId: string): Promise<number> {
    if (env.DEMO_MODE) {
      // Return demo balance
      return 1000;
    }
    const balance = await new AccountBalanceQuery()
      .setAccountId(AccountId.fromString(accountId))
      .execute(client);
    
    return balance.tokens?.get(TokenId.fromString(tokenId))?.toNumber() || 0;
  }

  async getTokenInfo(tokenId: string): Promise<any> {
    if (env.DEMO_MODE) {
      // Return demo token info
      return {
        name: 'Demo Token',
        symbol: 'DEMO',
        decimals: 2,
        totalSupply: 1000000,
        treasuryAccountId: '0.0.123456'
      };
    }
    const info = await new TokenInfoQuery()
      .setTokenId(TokenId.fromString(tokenId))
      .execute(client);
    
    return {
      name: info.name,
      symbol: info.symbol,
      decimals: info.decimals,
      totalSupply: info.totalSupply,
      treasuryAccountId: info.treasuryAccountId.toString()
    };
  }

  async calculatePlatformFee(amount: number): Promise<number> {
    return Math.floor((amount * env.PLATFORM_FEE_BPS) / 10000);
  }

  async distributeFees(
    invoiceTokenId: string,
    investorAccount: string,
    platformAccount: string,
    totalAmount: number
  ): Promise<string> {
    if (env.DEMO_MODE) {
      return `demo-fee-distribution-tx-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
    }
    const platformFee = await this.calculatePlatformFee(totalAmount);
    const investorAmount = totalAmount - platformFee;

    const transaction = new TransferTransaction()
      .addTokenTransfer(TokenId.fromString(invoiceTokenId), AccountId.fromString(investorAccount), -totalAmount)
      .addTokenTransfer(TokenId.fromString(invoiceTokenId), AccountId.fromString(investorAccount), investorAmount)
      .addTokenTransfer(TokenId.fromString(invoiceTokenId), AccountId.fromString(platformAccount), platformFee);

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    
    return receipt.transactionId.toString();
  }
}

export const htsService = new HTSService();