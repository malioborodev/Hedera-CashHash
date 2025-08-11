import { NextRequest, NextResponse } from 'next/server';
import { HCSService } from '@/lib/hcs';
import { HTSService } from '@/lib/hts';

const hcsService = new HCSService();
const htsService = new HTSService();

// POST /invoices/:id/invest
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: invoiceId } = params;
    const body = await request.json();
    const { amountUnits, investorAddress } = body;

    // Validate minimum investment ($10)
    if (!amountUnits || amountUnits < 10) {
      return NextResponse.json(
        { success: false, error: 'Minimum investment is $10' },
        { status: 400 }
      );
    }

    if (!investorAddress) {
      return NextResponse.json(
        { success: false, error: 'Investor address required' },
        { status: 400 }
      );
    }

    // Get invoice details
    const invoice = await hcsService.getInvoice(invoiceId);
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Check if invoice is available for investment
    if (invoice.status !== 'LISTED') {
      return NextResponse.json(
        { success: false, error: 'Invoice not available for investment' },
        { status: 400 }
      );
    }

    // Calculate investment breakdown
    const principal = amountUnits;
    const yieldPercent = invoice.yieldBPS / 100;
    const tenorDays = invoice.tenorDays;
    const estimatedReturn = principal * (yieldPercent / 100) * (tenorDays / 365);
    const htsFeePlatform = 0.1; // Platform fee in HBAR
    const htsFeeHBAR = 0.05; // HTS transaction fee
    
    // Check for over-funding (clamp)
    const currentFunding = invoice.fundedAmount || 0;
    const maxInvestment = invoice.amount - currentFunding;
    const actualInvestment = Math.min(amountUnits, maxInvestment);
    
    if (actualInvestment <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invoice is fully funded' },
        { status: 400 }
      );
    }

    try {
      // Auto-associate FT if needed
      if (invoice.ftId) {
        await htsService.associateToken(investorAddress, invoice.ftId);
      }

      // Transfer FT tokens
      const transferTxHash = await htsService.transferTokens({
        tokenId: invoice.ftId,
        from: process.env.PLATFORM_ACCOUNT_ID!,
        to: investorAddress,
        amount: actualInvestment
      });

      // Update funding progress
      const newFundedAmount = currentFunding + actualInvestment;
      const fundedPercent = Math.min(100, (newFundedAmount / invoice.amount) * 100);

      // Publish INVESTED event
      const investedEvent = await hcsService.publishEvent({
        type: 'INVESTED',
        invoiceId,
        data: {
          investorAddress,
          amount: actualInvestment,
          fundedPercent,
          txHash: transferTxHash,
          timestamp: new Date().toISOString()
        }
      });

      return NextResponse.json({
        success: true,
        investment: {
          invoiceId,
          investorAddress,
          principal: actualInvestment,
          estimatedReturn: (actualInvestment * yieldPercent / 100) * (tenorDays / 365),
          htsFeePlatform,
          htsFeeHBAR,
          txHash: transferTxHash,
          fundedPercent
        },
        eventId: investedEvent.id
      });
    } catch (error: any) {
      // Handle specific errors
      if (error.message.includes('insufficient HBAR')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Insufficient HBAR balance for transaction fees',
            retryable: true
          },
          { status: 400 }
        );
      }
      
      if (error.message.includes('association failed')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Token association failed. Please try again.',
            retryable: true
          },
          { status: 400 }
        );
      }

      throw error;
    }
  } catch (error) {
    console.error('Error processing investment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process investment' },
      { status: 500 }
    );
  }
}