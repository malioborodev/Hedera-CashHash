import { NextRequest, NextResponse } from 'next/server';
import { HCSService } from '@/lib/hcs';

const hcsService = new HCSService();

// GET /relay/last - Get last relayed event status
export async function GET(request: NextRequest) {
  try {
    // Get the most recent relayed event
    const lastRelayedEvent = await getLastRelayedEvent();
    
    if (!lastRelayedEvent) {
      return NextResponse.json({
        success: true,
        status: 'NO_EVENTS',
        message: 'No events have been relayed yet'
      });
    }

    // Get EVM state for the last relayed event
    const evmState = await getEVMState(lastRelayedEvent.invoiceId);
    
    // Generate digest for verification
    const digest = generateDigest(lastRelayedEvent);
    
    return NextResponse.json({
      success: true,
      lastRelayedEvent: {
        type: lastRelayedEvent.type,
        invoiceId: lastRelayedEvent.invoiceId,
        consensusTimestamp: lastRelayedEvent.consensusTimestamp,
        transactionId: lastRelayedEvent.transactionId,
        relayedAt: lastRelayedEvent.relayedAt
      },
      digest,
      signatures: {
        required: 3, // N-of-M signatures
        collected: 2, // Mock data - in real implementation, get from relayer service
        status: 'PENDING' // PENDING | COMPLETE
      },
      evmState: {
        network: process.env.NEXT_PUBLIC_EVM_NETWORK || 'polygon',
        contractAddress: process.env.NEXT_PUBLIC_EVM_CONTRACT_ADDRESS,
        status: evmState.status,
        lastUpdated: evmState.lastUpdated,
        txHash: evmState.txHash
      },
      links: {
        hederaMirror: `https://hashscan.io/${process.env.NEXT_PUBLIC_HEDERA_NETWORK}/transaction/${lastRelayedEvent.transactionId}`,
        evmExplorer: evmState.txHash ? `https://polygonscan.com/tx/${evmState.txHash}` : null
      },
      health: {
        relayerStatus: 'ONLINE',
        lastHealthCheck: new Date().toISOString(),
        avgRelayTime: '8.5s'
      }
    });
  } catch (error) {
    console.error('Error fetching relay status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch relay status' },
      { status: 500 }
    );
  }
}

// POST /relay/last - Trigger manual relay
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceId, eventType } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID required for manual relay' },
        { status: 400 }
      );
    }

    // Get the latest event for the invoice
    const events = await hcsService.getAllEventsByInvoice(invoiceId);
    if (events.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No events found for invoice' },
        { status: 404 }
      );
    }

    // Filter by event type if specified
    const targetEvents = eventType 
      ? events.filter(e => e.type === eventType)
      : events;
    
    if (targetEvents.length === 0) {
      return NextResponse.json(
        { success: false, error: `No ${eventType} events found for invoice` },
        { status: 404 }
      );
    }

    // Get the most recent event
    const latestEvent = targetEvents.sort((a, b) => 
      new Date(b.consensusTimestamp).getTime() - new Date(a.consensusTimestamp).getTime()
    )[0];

    // Trigger relay (in real implementation, this would call the relayer service)
    const relayResult = await triggerRelay(latestEvent);

    return NextResponse.json({
      success: true,
      relay: {
        eventId: latestEvent.id,
        invoiceId,
        eventType: latestEvent.type,
        relayTriggered: true,
        estimatedTime: '10s',
        digest: generateDigest(latestEvent)
      },
      message: 'Manual relay triggered successfully'
    });
  } catch (error) {
    console.error('Error triggering manual relay:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to trigger relay' },
      { status: 500 }
    );
  }
}

// Helper functions
async function getLastRelayedEvent() {
  // In real implementation, this would query a relayer database or service
  // For now, return mock data
  const allEvents = await hcsService.getAllEvents({ limit: 1 });
  if (allEvents.length === 0) return null;
  
  return {
    ...allEvents[0],
    relayedAt: new Date(Date.now() - 30000).toISOString() // 30 seconds ago
  };
}

async function getEVMState(invoiceId: string) {
  // In real implementation, this would query the EVM contract
  // For now, return mock data
  return {
    status: 'LISTED', // LISTED | INVESTED | PAID | DEFAULTED
    lastUpdated: new Date(Date.now() - 45000).toISOString(),
    txHash: '0x1234567890abcdef1234567890abcdef12345678'
  };
}

function generateDigest(event: any): string {
  // Generate digest: hash(invoiceId|type|consensusTs|ftId|fundedPctAfter)
  const data = [
    event.invoiceId,
    event.type,
    event.consensusTimestamp,
    event.data.ftId || '',
    event.data.fundedPercent || '0'
  ].join('|');
  
  // In real implementation, use proper cryptographic hash
  return `0x${Buffer.from(data).toString('hex').slice(0, 64)}`;
}

async function triggerRelay(event: any) {
  // In real implementation, this would call the relayer service
  // For now, simulate the relay process
  return {
    success: true,
    relayId: `relay_${Date.now()}`,
    estimatedTime: 10000 // 10 seconds
  };
}