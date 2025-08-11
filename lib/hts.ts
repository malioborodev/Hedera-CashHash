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
import { env } from "./config/env";
import { hcsService } from "./hcs";

const client = Client.forTestnet();
client.setOperator(env.HEDERA_ACCOUNT_ID, env.HEDERA_PRIVATE_KEY);

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
  async createInvoiceToken(
    invoiceId: string,
    amount: number,
    dueDate: Date,
    debtor: string
  ): Promise<string> {
    const tokenName = `Invoice-${invoiceId}`;
    const tokenSymbol = `INV-${invoiceId.slice(0, 8)}`;

    const transaction = new TokenCreateTransaction()
      .setTokenName(tokenName)
      .setTokenSymbol(tokenSymbol)
      .setTokenType(TokenType.FungibleCommon)
      .setDecimals(0)
      .setInitialSupply(amount)
      .setTreasuryAccountId(AccountId.fromString(env.HEDERA_ACCOUNT_ID))
      .setAdminKey(PrivateKey.fromString(env.HEDERA_PRIVATE_KEY))
      .setSupplyKey(PrivateKey.fromString(env.HEDERA_PRIVATE_KEY))
      .setWipeKey(PrivateKey.fromString(env.HEDERA_PRIVATE_KEY))
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(amount);

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    
    const tokenId = receipt.tokenId?.toString();
    
    if (!tokenId) {
      throw new Error('Failed to create invoice token');
    }

    await hcsService.publishListedEvent(invoiceId, {
      tokenId,
      amount,
      dueDate: dueDate.toISOString(),
      debtor
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
      .setTreasuryAccountId(AccountId.fromString(env.HEDERA_ACCOUNT_ID))
      .setAdminKey(PrivateKey.fromString(env.HEDERA_PRIVATE_KEY))
      .setSupplyKey(PrivateKey.fromString(env.HEDERA_PRIVATE_KEY))
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(1000000);

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    
    return receipt.tokenId?.toString() || '';
  }

  async associateToken(accountId: string, tokenId: string): Promise<void> {
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
    const transaction = new TransferTransaction()
      .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(fromAccount), -amount)
      .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(toAccount), amount);

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    
    return receipt.transactionId.toString();
  }

  async getTokenBalance(accountId: string, tokenId: string): Promise<number> {
    const balance = await new AccountBalanceQuery()
      .setAccountId(AccountId.fromString(accountId))
      .execute(client);
    
    return balance.tokens?.get(TokenId.fromString(tokenId))?.toNumber() || 0;
  }

  async getTokenInfo(tokenId: string): Promise<any> {
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