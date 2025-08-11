import { NextRequest, NextResponse } from 'next/server';
import { HCSService } from '@/lib/hcs';
import { HTSService } from '@/lib/hts';

const hcsService = new HCSService();
const htsService = new HTSService();

// POST /invoices/:id/mark-default
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: invoiceId } = params;
    const body = await request.json();
    const { callerAddress } = body;

    // Get invoice details
    const invoice = await hcsService.getInvoice(invoiceId);
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Check if invoice is funded
    if (invoice.status !== 'FUNDED') {
      return NextResponse.json(
        { success: false, error: 'Invoice must be funded to mark as default' },
        { status: 400 }
      );
    }

    // Check if maturity + grace period has passed
    const maturityDate = new Date(invoice.maturity);
    const gracePeriodDays = 7; // 7 days grace period
    const graceEndDate = new Date(maturityDate.getTime() + (gracePeriodDays * 24 * 60 * 60 * 1000));
    const now = new Date();

    if (now < graceEndDate) {
      const daysRemaining = Math.ceil((graceEndDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot mark as default. Grace period ends in ${daysRemaining} days`,
          graceEndDate: graceEndDate.toISOString()
        },
        { status: 400 }
      );
    }

    // Check if already defaulted
    const defaultEvents = await hcsService.getEventsByInvoice(invoiceId, 'DEFAULTED');
    if (defaultEvents.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Invoice already marked as defaulted' },
        { status: 400 }
      );
    }

    // Check if already paid
    const paidEvents = await hcsService.getEventsByInvoice(invoiceId, 'PAID');
    if (paidEvents.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Invoice already settled' },
        { status: 400 }
      );
    }

    try {
      // Get bond information
      const bondEvents = await hcsService.getEventsByInvoice(invoiceId, 'BOND_POSTED');
      let bondSlashTxHash = null;
      let bondAmount = 0;
      
      if (bondEvents.length > 0) {
        bondAmount = bondEvents[0].data.bondAmount;
        
        // Slash bond (transfer to platform or distribute to investors)
        const bondSlash = await htsService.transferHBAR({
          from: process.env.PLATFORM_ACCOUNT_ID!,
          to: process.env.PLATFORM_TREASURY_ACCOUNT_ID!, // Platform treasury
          amount: bondAmount
        });
        bondSlashTxHash = bondSlash.txHash;
      }

      // Get investment information for compensation calculation
      const investmentEvents = await hcsService.getEventsByInvoice(invoiceId, 'INVESTED');
      const totalInvested = investmentEvents.reduce((sum, event) => {
        return sum + (event.data.amount || 0);
      }, 0);

      // Calculate compensation from slashed bond (if any)
      const compensations = [];
      if (bondAmount > 0 && totalInvested > 0) {
        for (const investment of investmentEvents) {
          const investorShare = investment.data.amount / totalInvested;
          const compensation = bondAmount * investorShare;
          
          if (compensation > 0) {
            const compensationTx = await htsService.transferHBAR({
              from: process.env.PLATFORM_TREASURY_ACCOUNT_ID!,
              to: investment.data.investorAddress,
              amount: compensation
            });
            
            compensations.push({
              investorAddress: investment.data.investorAddress,
              amount: compensation,
              txHash: compensationTx.txHash
            });
          }
        }
      }

      // Publish DEFAULTED event
      const defaultedEvent = await hcsService.publishEvent({
        type: 'DEFAULTED',
        invoiceId,
        data: {
          defaultedAt: new Date().toISOString(),
          maturityDate: invoice.maturity,
          graceEndDate: graceEndDate.toISOString(),
          bondAmount,
          bondSlashed: !!bondSlashTxHash,
          bondSlashTxHash,
          compensations,
          totalInvested,
          markedBy: callerAddress
        }
      });

      return NextResponse.json({
        success: true,
        default: {
          invoiceId,
          status: 'DEFAULTED',
          defaultedAt: new Date().toISOString(),
          bondSlashed: !!bondSlashTxHash,
          bondAmount,
          compensationsCount: compensations.length,
          totalCompensation: compensations.reduce((sum, comp) => sum + comp.amount, 0)
        },
        compensations,
        bondSlashTxHash,
        eventId: defaultedEvent.id
      });
    } catch (error: any) {
      console.error('Error processing default:', error);
      
      if (error.message.includes('insufficient HBAR')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Insufficient HBAR balance for bond slashing'
          },
          { status: 400 }
        );
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error marking invoice as default:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark invoice as default' },
      { status: 500 }
    );
  }
}