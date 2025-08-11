import { NextRequest, NextResponse } from 'next/server';
import { HCSService } from '@/lib/hcs';

const hcsService = new HCSService();

// GET /events?invoiceId=&type=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoiceId');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get events from HCS via Mirror API
    let events;
    
    if (invoiceId) {
      // Get events for specific invoice
      if (type) {
        events = await hcsService.getEventsByInvoice(invoiceId, type);
      } else {
        events = await hcsService.getAllEventsByInvoice(invoiceId);
      }
    } else {
      // Get all events with optional type filter
      events = await hcsService.getAllEvents({ type, limit, offset });
    }

    // Sort by consensus timestamp (newest first)
    events.sort((a, b) => {
      const timestampA = new Date(a.consensusTimestamp).getTime();
      const timestampB = new Date(b.consensusTimestamp).getTime();
      return timestampB - timestampA;
    });

    // Format events for frontend
    const formattedEvents = events.map(event => ({
      id: event.id,
      type: event.type,
      invoiceId: event.invoiceId,
      consensusTimestamp: event.consensusTimestamp,
      transactionId: event.transactionId,
      data: event.data,
      actor: event.data.exporter || event.data.investorAddress || event.data.markedBy || 'system',
      payload: {
        summary: generateEventSummary(event),
        details: event.data
      },
      links: {
        mirrorExplorer: `https://hashscan.io/${process.env.NEXT_PUBLIC_HEDERA_NETWORK}/transaction/${event.transactionId}`,
        copyTxHash: event.transactionId
      }
    }));

    return NextResponse.json({
      success: true,
      events: formattedEvents,
      pagination: {
        total: formattedEvents.length,
        limit,
        offset,
        hasMore: formattedEvents.length === limit
      },
      filters: {
        invoiceId,
        type
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

function generateEventSummary(event: any): string {
  switch (event.type) {
    case 'DOC_UPLOADED':
      return `Document uploaded: ${event.data.documentType}`;
    case 'BOND_POSTED':
      return `Bond posted: ${event.data.bondAmount} HBAR`;
    case 'LISTED':
      return `Invoice listed for $${event.data.amount?.toLocaleString()}`;
    case 'INVESTED':
      return `Investment: $${event.data.amount?.toLocaleString()} (${event.data.fundedPercent?.toFixed(1)}% funded)`;
    case 'PAYMENT_RECORDED':
      return `Payment recorded: $${event.data.paidAmountUSD?.toLocaleString()}`;
    case 'PAID':
      return `Invoice settled: ${event.data.payouts?.length} payouts processed`;
    case 'DEFAULTED':
      return `Invoice defaulted: Bond slashed (${event.data.bondAmount} HBAR)`;
    default:
      return `${event.type} event`;
  }
}