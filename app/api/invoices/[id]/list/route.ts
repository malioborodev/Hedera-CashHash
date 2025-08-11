import { NextRequest, NextResponse } from 'next/server';
import { HCSService } from '@/lib/hcs';
import { HTSService } from '@/lib/hts';

const hcsService = new HCSService();
const htsService = new HTSService();

// POST /invoices/:id/list
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: invoiceId } = params;
    const body = await request.json();
    const { exporterAddress } = body;

    if (!exporterAddress) {
      return NextResponse.json(
        { success: false, error: 'Exporter address required' },
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

    // Check if bond has been posted
    const bondEvents = await hcsService.getEventsByInvoice(invoiceId, 'BOND_POSTED');
    if (bondEvents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Bond must be posted before listing' },
        { status: 400 }
      );
    }

    // Check if already listed
    const listEvents = await hcsService.getEventsByInvoice(invoiceId, 'LISTED');
    if (listEvents.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Invoice already listed' },
        { status: 400 }
      );
    }

    try {
      // Create NFT for invoice ownership
      const nftResult = await htsService.createNFT({
        name: `Invoice ${invoiceId}`,
        symbol: 'CINV',
        description: `Invoice NFT for ${invoiceId}`,
        metadata: {
          invoiceId,
          amount: invoice.amount,
          exporter: exporterAddress,
          maturity: invoice.maturity
        }
      });

      // Create FT for investment tokens
      const ftResult = await htsService.createFungibleToken({
        name: `${invoiceId} Investment Token`,
        symbol: `${invoiceId.replace('-', '')}`,
        decimals: 2,
        initialSupply: invoice.amount * 100, // 2 decimal places
        treasuryAccount: process.env.PLATFORM_ACCOUNT_ID!,
        metadata: {
          invoiceId,
          yieldBPS: invoice.yieldBPS,
          maturity: invoice.maturity
        }
      });

      // Publish LISTED event
      const listedEvent = await hcsService.publishEvent({
        type: 'LISTED',
        invoiceId,
        data: {
          nftId: nftResult.tokenId,
          ftId: ftResult.tokenId,
          exporter: exporterAddress,
          amount: invoice.amount,
          yieldBPS: invoice.yieldBPS,
          maturity: invoice.maturity,
          timestamp: new Date().toISOString()
        }
      });

      return NextResponse.json({
        success: true,
        listing: {
          invoiceId,
          nftId: nftResult.tokenId,
          ftId: ftResult.tokenId,
          status: 'LISTED',
          listedAt: new Date().toISOString()
        },
        eventId: listedEvent.id,
        links: {
          docs: `/api/invoices/${invoiceId}/documents`,
          events: `/api/events?invoiceId=${invoiceId}`
        }
      });
    } catch (error: any) {
      console.error('Error creating tokens:', error);
      
      // Handle specific HTS errors
      if (error.message.includes('insufficient HBAR')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Insufficient HBAR balance for token creation fees'
          },
          { status: 400 }
        );
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error listing invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list invoice' },
      { status: 500 }
    );
  }
}