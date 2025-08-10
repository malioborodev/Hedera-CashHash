import {
  AccountId,
  Client,
  Hbar,
  PrivateKey,
  TokenAssociateTransaction,
  TokenCreateTransaction,
  TokenId,
  TokenSupplyType,
  TokenType,
  TransferTransaction,
  TokenMintTransaction,
} from '@hashgraph/sdk';
import { env } from '../config/env.js';

let client: Client | null = null;

export function getClient(): Client {
  if (client) return client;
  const network = env.HEDERA_NETWORK;
  client = Client.forName(network);
  if (!env.HEDERA_OPERATOR_ID || !env.HEDERA_OPERATOR_KEY) {
    throw new Error('Hedera operator credentials missing');
  }
  client.setOperator(AccountId.fromString(env.HEDERA_OPERATOR_ID), PrivateKey.fromStringECDSA(env.HEDERA_OPERATOR_KEY));
  return client;
}

export async function createFungibleToken(params: {
  name: string;
  symbol: string;
  decimals?: number;
  initialSupply?: number; // in smallest unit
  treasuryAccountId?: string; // default operator
}): Promise<TokenId> {
  const c = getClient();
  const treasury = AccountId.fromString(params.treasuryAccountId || env.HEDERA_OPERATOR_ID!);

  const tx = await new TokenCreateTransaction()
    .setTokenName(params.name)
    .setTokenSymbol(params.symbol)
    .setTokenType(TokenType.FungibleCommon)
    .setTreasuryAccountId(treasury)
    .setDecimals(params.decimals ?? 6)
    .setSupplyType(TokenSupplyType.Infinite)
    .freezeWith(c);

  const resp = await tx.execute(c);
  const rec = await resp.getReceipt(c);
  const tokenId = rec.tokenId!;

  // Mint initial supply if requested (fungible supply minted to treasury)
  if (params.initialSupply && params.initialSupply > 0) {
    const mintTx = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .setAmount(params.initialSupply)
      .freezeWith(c);
    const mintResp = await mintTx.execute(c);
    await mintResp.getReceipt(c);
  }

  return tokenId;
}

export async function createNonFungibleToken(params: {
  name: string;
  symbol: string;
  treasuryAccountId?: string; // default operator
  metadataList?: Uint8Array[]; // optional initial mints
}): Promise<TokenId> {
  const c = getClient();
  const treasury = AccountId.fromString(params.treasuryAccountId || env.HEDERA_OPERATOR_ID!);

  const tx = await new TokenCreateTransaction()
    .setTokenName(params.name)
    .setTokenSymbol(params.symbol)
    .setTokenType(TokenType.NonFungibleUnique)
    .setTreasuryAccountId(treasury)
    .setSupplyType(TokenSupplyType.Infinite)
    .freezeWith(c);

  const resp = await tx.execute(c);
  const rec = await resp.getReceipt(c);
  const tokenId = rec.tokenId!;

  // Optional initial NFT mints (e.g., a single serial representing the invoice)
  if (params.metadataList && params.metadataList.length > 0) {
    const mintTx = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata(params.metadataList)
      .freezeWith(c);
    const mintResp = await mintTx.execute(c);
    await mintResp.getReceipt(c);
  }

  return tokenId;
}

export async function transferFungible(params: {
  tokenId: string;
  fromAccountId: string; // must be treasury or an account the operator can sign for
  toAccountId: string;
  amount: number; // smallest unit
}): Promise<void> {
  const c = getClient();
  const token = TokenId.fromString(params.tokenId);
  const tx = await new TransferTransaction()
    .addTokenTransfer(token, AccountId.fromString(params.fromAccountId), -params.amount)
    .addTokenTransfer(token, AccountId.fromString(params.toAccountId), params.amount)
    .freezeWith(c);
  const resp = await tx.execute(c);
  await resp.getReceipt(c);
}

export async function transferNft(params: {
  tokenId: string;
  serial: number;
  fromAccountId: string;
  toAccountId: string;
}): Promise<void> {
  const c = getClient();
  const token = TokenId.fromString(params.tokenId);
  const tx = await new TransferTransaction()
    .addNftTransfer(token, params.serial, AccountId.fromString(params.fromAccountId), AccountId.fromString(params.toAccountId))
    .freezeWith(c);
  const resp = await tx.execute(c);
  await resp.getReceipt(c);
}

export async function associateToken(params: { tokenId: string; accountId: string }): Promise<void> {
  const c = getClient();
  // IMPORTANT: association requires the target account signature. This method will only work if client has that key loaded.
  const tx = await new TokenAssociateTransaction()
    .setAccountId(AccountId.fromString(params.accountId))
    .setTokenIds([TokenId.fromString(params.tokenId)])
    .freezeWith(c);
  const resp = await tx.execute(c);
  await resp.getReceipt(c);
}

export async function transferHbar(params: { toAccountId: string; amountHbar: number }): Promise<void> {
  const c = getClient();
  const tx = await new TransferTransaction()
    .addHbarTransfer(env.HEDERA_OPERATOR_ID!, new Hbar(-params.amountHbar))
    .addHbarTransfer(params.toAccountId, new Hbar(params.amountHbar))
    .freezeWith(c);
  const resp = await tx.execute(c);
  await resp.getReceipt(c);
}