import { NextRequest, NextResponse } from 'next/server';
import { HCSService } from '@/lib/hcs';

const hcsService = new HCSService();

// POST /invoices/:id/record-payment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: invoiceId } = params;
    const body = await request.json();
    const { paidAmountUSD, reference, exporterAddress } = body;

    if (!paidAmountUSD || !exporterAddress) {
      return NextResponse.json(
        { success: false, error: 'Paid amount and exporter address required' },
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

    // Check if invoice is funded
    if (invoice.status !== 'FUNDED') {
      return NextResponse.json(
        { success: false, error: 'Invoice must be funded to record payment' },
        { status: 400 }
      );
    }

    // Validate exporter permission
    if (invoice.exporter !== exporterAddress) {
      return NextResponse.json(
        { success: false, error: 'Only exporter can record payment' },
        { status: 403 }
      );
    }

    // Record payment event
    const paymentEvent = await hcsService.publishEvent({
      type: 'PAYMENT_RECORDED',
      invoiceId,
      data: {
        paidAmountUSD,
        reference: reference || '',
        exporter: exporterAddress,
        timestamp: new Date().toISOString(),
        dueAmount: invoice.amount
      }
    });

    return NextResponse.json({
      success: true,
      payment: {
        invoiceId,
        paidAmountUSD,
        reference,
        recordedAt: new Date().toISOString(),
        canSettle: paidAmountUSD >= invoice.amount
      },
      eventId: paymentEvent.id
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record payment' },
      { status: 500 }
    );
  }
}