import { NextRequest, NextResponse } from 'next/server';
import { HCSService } from '@/lib/hcs';
import { HTSService } from '@/lib/hts';
import { HFSService } from '@/lib/hfs';
import { Contract } from 'ethers';

const hcsService = new HCSService();
const htsService = new HTSService();
const hfsService = new HFSService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const exporter = searchParams.get('exporter');
    const investor = searchParams.get('investor');

    const bonds = await hcsService.getBondEvents({
      status: status as any,
      exporter,
      investor
    });

    return NextResponse.json({ bonds });
  } catch (error) {
    console.error('Error fetching bonds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bonds' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      invoiceId,
      amount,
      yieldBPS,
      tenorDays,
      exporter,
      investor,
      invoiceHash,
      documents
    } = body;

    // Validate required fields
    if (!invoiceId || !amount || !yieldBPS || !tenorDays || !exporter || !investor) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create invoice token
    const invoiceTokenId = await htsService.createInvoiceToken({
      invoiceId,
      amount,
      exporter,
      metadata: {
        invoiceHash,
        yield: yieldBPS,
        tenor: tenorDays
      }
    });

    // Upload documents to HFS
    const documentHashes = [];
    if (documents && documents.length > 0) {
      for (const doc of documents) {
        const docHash = await hfsService.uploadDocument({
          file: doc.file,
          invoiceId,
          type: doc.type,
          metadata: doc.metadata
        });
        documentHashes.push(docHash);
      }
    }

    // Create bond on HCS
    const bondEvent = await hcsService.publishBondEvent({
      type: 'BOND_POSTED',
      invoiceId,
      invoiceTokenId,
      amount,
      yieldBPS,
      tenorDays,
      exporter,
      investor,
      documentHashes
    });

    return NextResponse.json({
      bondEvent,
      invoiceTokenId,
      documentHashes
    });
  } catch (error) {
    console.error('Error creating bond:', error);
    return NextResponse.json(
      { error: 'Failed to create bond' },
      { status: 500 }
    );
  }
}