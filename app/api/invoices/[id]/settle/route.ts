import { NextRequest, NextResponse } from 'next/server';
import { HCSService } from '@/lib/hcs';
import { HTSService } from '@/lib/hts';

const hcsService = new HCSService();
const htsService = new HTSService();

// POST /invoices/:id/settle
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
        { success: false, error: 'Invoice must be funded to settle' },
        { status: 400 }
      );
    }

    // Get payment records
    const paymentEvents = await hcsService.getEventsByInvoice(invoiceId, 'PAYMENT_RECORDED');
    if (paymentEvents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No payment recorded for this invoice' },
        { status: 400 }
      );
    }

    // Calculate total paid amount
    const totalPaid = paymentEvents.reduce((sum, event) => {
      return sum + (event.data.paidAmountUSD || 0);
    }, 0);

    // Check if payment is sufficient
    if (totalPaid < invoice.amount) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Insufficient payment. Paid: $${totalPaid}, Due: $${invoice.amount}` 
        },
        { status: 400 }
      );
    }

    // Get all investments for pro-rata calculation
    const investmentEvents = await hcsService.getEventsByInvoice(invoiceId, 'INVESTED');
    const totalInvested = investmentEvents.reduce((sum, event) => {
      return sum + (event.data.amount || 0);
    }, 0);

    if (totalInvested === 0) {
      return NextResponse.json(
        { success: false, error: 'No investments found for this invoice' },
        { status: 400 }
      );
    }

    // Calculate payouts pro-rata
    const yieldAmount = (invoice.amount * invoice.yieldBPS) / 10000;
    const totalPayout = invoice.amount + yieldAmount;
    
    const payouts = investmentEvents.map(investment => {
      const investorShare = investment.data.amount / totalInvested;
      const principalReturn = invoice.amount * investorShare;
      const yieldReturn = yieldAmount * investorShare;
      const totalReturn = principalReturn + yieldReturn;
      
      return {
        investorAddress: investment.data.investorAddress,
        principal: principalReturn,
        yield: yieldReturn,
        total: totalReturn,
        share: investorShare
      };
    });

    try {
      // Process payouts via HTS
      const payoutTxHashes = [];
      for (const payout of payouts) {
        const transferResult = await htsService.transferHBAR({
          from: process.env.PLATFORM_ACCOUNT_ID!,
          to: payout.investorAddress,
          amount: payout.total
        });
        payoutTxHashes.push({
          investor: payout.investorAddress,
          txHash: transferResult.txHash,
          amount: payout.total
        });
      }

      // Refund bond to exporter
      const bondEvents = await hcsService.getEventsByInvoice(invoiceId, 'BOND_POSTED');
      let bondRefundTxHash = null;
      if (bondEvents.length > 0) {
        const bondAmount = bondEvents[0].data.bondAmount;
        const bondRefund = await htsService.transferHBAR({
          from: process.env.PLATFORM_ACCOUNT_ID!,
          to: invoice.exporter,
          amount: bondAmount
        });
        bondRefundTxHash = bondRefund.txHash;
      }

      // Publish PAID event
      const paidEvent = await hcsService.publishEvent({
        type: 'PAID',
        invoiceId,
        data: {
          totalPaid,
          totalPayout,
          payouts,
          payoutTxHashes,
          bondRefundTxHash,
          settledBy: callerAddress,
          settledAt: new Date().toISOString()
        }
      });

      return NextResponse.json({
        success: true,
        settlement: {
          invoiceId,
          status: 'PAID',
          totalPaid,
          totalPayout,
          payoutsCount: payouts.length,
          bondRefunded: !!bondRefundTxHash,
          settledAt: new Date().toISOString()
        },
        payouts,
        txHashes: payoutTxHashes,
        bondRefundTxHash,
        eventId: paidEvent.id
      });
    } catch (error: any) {
      console.error('Error processing settlement:', error);
      
      if (error.message.includes('insufficient HBAR')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Insufficient HBAR balance for settlement payouts'
          },
          { status: 400 }
        );
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error settling invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to settle invoice' },
      { status: 500 }
    );
  }
}