import { NextRequest, NextResponse } from 'next/server';
import { HCSService } from '@/lib/hcs';
import { HTSService } from '@/lib/hts';

const hcsService = new HCSService();
const htsService = new HTSService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const investor = searchParams.get('investor');
    const status = searchParams.get('status');

    if (!investor) {
      return NextResponse.json(
        { error: 'Investor address required' },
        { status: 400 }
      );
    }

    const investments = await hcsService.getInvestmentEvents({
      investor,
      status: status as any
    });

    return NextResponse.json({ investments });
  } catch (error) {
    console.error('Error fetching investments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch investments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      invoiceId,
      invoiceTokenId,
      investor,
      amount,
      investorAddress
    } = body;

    if (!invoiceId || !invoiceTokenId || !investor || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Associate investor with token
    await htsService.associateToken(investorAddress, invoiceTokenId);

    // Transfer tokens to investor
    await htsService.transferTokens({
      tokenId: invoiceTokenId,
      from: process.env.PLATFORM_ACCOUNT_ID!,
      to: investorAddress,
      amount
    });

    // Record investment on HCS
    const investmentEvent = await hcsService.publishInvestmentEvent({
      type: 'INVESTED',
      invoiceId,
      invoiceTokenId,
      investor,
      amount
    });

    return NextResponse.json({ investmentEvent });
  } catch (error) {
    console.error('Error recording investment:', error);
    return NextResponse.json(
      { error: 'Failed to record investment' },
      { status: 500 }
    );
  }
}