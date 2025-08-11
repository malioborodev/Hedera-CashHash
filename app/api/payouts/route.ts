import { NextRequest, NextResponse } from 'next/server';
import { HCSService } from '@/lib/hcs';
import { HTSService } from '@/lib/hts';

const hcsService = new HCSService();
const htsService = new HTSService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const exporter = searchParams.get('exporter');
    const investor = searchParams.get('investor');
    const status = searchParams.get('status');

    const payouts = await hcsService.getPayoutEvents({
      exporter,
      investor,
      status: status as any
    });

    return NextResponse.json({ payouts });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      payoutId,
      invoiceId,
      exporter,
      investor,
      amount,
      dueDate,
      action
    } = body;

    if (!payoutId || !invoiceId || !exporter || !investor || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let eventType: string;
    let txHash: string | undefined;

    if (action === 'distribute') {
      // Trigger payout distribution
      eventType = 'PAID';
      
      // Calculate platform fee and transfer
      const platformFee = (amount * parseInt(process.env.PLATFORM_FEE_BPS || '75')) / 10000;
      const investorAmount = amount - platformFee;
      
      txHash = await htsService.transferTokens({
        tokenId: process.env.INVOICE_TOKEN_ID!,
        from: exporter,
        to: investor,
        amount: investorAmount
      });

    } else if (action === 'default') {
      eventType = 'DEFAULTED';
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    const payoutEvent = await hcsService.publishPayoutEvent({
      type: eventType as any,
      payoutId,
      invoiceId,
      exporter,
      investor,
      amount,
      txHash
    });

    return NextResponse.json({ payoutEvent });
  } catch (error) {
    console.error('Error processing payout:', error);
    return NextResponse.json(
      { error: 'Failed to process payout' },
      { status: 500 }
    );
  }
}