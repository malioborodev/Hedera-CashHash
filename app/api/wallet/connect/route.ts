import { NextRequest, NextResponse } from 'next/server';
import { Client, Wallet as HederaWallet, AccountId, PrivateKey, AccountBalanceQuery } from '@hashgraph/sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { privateKey, accountId } = body;

    if (!privateKey || !accountId) {
      return NextResponse.json(
        { error: 'Private key and account ID are required' },
        { status: 400 }
      );
    }

    // Validate the private key
    const key = PrivateKey.fromString(privateKey);
    const account = AccountId.fromString(accountId);

    // Create wallet instance
    const wallet = new HederaWallet(account, key);

    // Test connection by getting account balance
    const client = Client.forTestnet();
    client.setOperator(account, key);

    const balanceQuery = await new AccountBalanceQuery()
      .setAccountId(account)
      .execute(client);

    const balance = balanceQuery.hbars.toTinybars().toString();

    // Store wallet info in session (in production, use proper session management)
    const walletInfo = {
      accountId: account.toString(),
      publicKey: key.publicKey.toString(),
      balance: (Number(balance) / 100000000).toFixed(2), // Convert to HBAR
    };

    return NextResponse.json({ wallet: walletInfo });
  } catch (error) {
    console.error('Wallet connection error:', error);
    return NextResponse.json(
      { error: 'Failed to connect wallet' },
      { status: 500 }
    );
  }
}