import { NextRequest, NextResponse } from 'next/server';
import { HCSService } from '@/lib/hcs';
import { HTSService } from '@/lib/hts';

const hcsService = new HCSService();
const htsService = new HTSService();

// POST /bond/exporter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      invoiceId, 
      exporterAddress, 
      amountUSD, 
      bondAmount 
    } = body;

    if (!invoiceId || !exporterAddress || !amountUSD || !bondAmount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate bond amount calculation: clamp(300, 1% x amountUSD, 5000)
    const expectedBondAmount = Math.max(300, Math.min(amountUSD * 0.01, 5000));
    if (Math.abs(bondAmount - expectedBondAmount) > 0.01) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid bond amount. Expected: ${expectedBondAmount} HBAR`,
          expectedBondAmount
        },
        { status: 400 }
      );
    }

    // Check if bond already posted for this invoice
    const existingBonds = await hcsService.getEventsByInvoice(invoiceId, 'BOND_POSTED');
    if (existingBonds.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Bond already posted for this invoice' },
        { status: 400 }
      );
    }

    try {
      // Lock HBAR bond (transfer from exporter to platform escrow)
      const bondTransfer = await htsService.transferHBAR({
        from: exporterAddress,
        to: process.env.PLATFORM_ESCROW_ACCOUNT_ID!,
        amount: bondAmount
      });

      // Publish BOND_POSTED event
      const bondEvent = await hcsService.publishEvent({
        type: 'BOND_POSTED',
        invoiceId,
        data: {
          exporter: exporterAddress,
          bondAmount,
          amountUSD,
          txHash: bondTransfer.txHash,
          postedAt: new Date().toISOString(),
          status: 'LOCKED'
        }
      });

      return NextResponse.json({
        success: true,
        bond: {
          invoiceId,
          exporter: exporterAddress,
          bondAmount,
          status: 'LOCKED',
          txHash: bondTransfer.txHash,
          postedAt: new Date().toISOString()
        },
        eventId: bondEvent.id,
        nextStep: {
          action: 'LIST_INVOICE',
          endpoint: `/api/invoices/${invoiceId}/list`,
          description: 'Now you can list the invoice for investment'
        }
      });
    } catch (error: any) {
      console.error('Error posting bond:', error);
      
      // Handle specific errors
      if (error.message.includes('insufficient HBAR')) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Insufficient HBAR balance. Required: ${bondAmount} HBAR`,
            requiredAmount: bondAmount
          },
          { status: 400 }
        );
      }
      
      if (error.message.includes('invalid account')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid exporter account address'
          },
          { status: 400 }
        );
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error processing exporter bond:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process exporter bond' },
      { status: 500 }
    );
  }
}