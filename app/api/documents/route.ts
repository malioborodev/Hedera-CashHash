import { NextRequest, NextResponse } from 'next/server';
import { HFSService } from '@/lib/hfs';
import { HCSService } from '@/lib/hcs';

const hfsService = new HFSService();
const hcsService = new HCSService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoiceId');
    const type = searchParams.get('type');

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID required' },
        { status: 400 }
      );
    }

    const documents = await hfsService.getDocuments({
      invoiceId: parseInt(invoiceId),
      type: type as any
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const invoiceId = formData.get('invoiceId') as string;
    const type = formData.get('type') as string;
    const metadata = formData.get('metadata') as string;

    if (!file || !invoiceId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Parse metadata if provided
    let parsedMetadata = {};
    if (metadata) {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (e) {
        console.warn('Invalid metadata format, ignoring');
      }
    }

    // Upload to HFS
    const documentHash = await hfsService.uploadDocument({
      file,
      invoiceId: parseInt(invoiceId),
      type,
      metadata: parsedMetadata
    });

    // Record document upload on HCS
    const documentEvent = await hcsService.publishDocumentEvent({
      type: 'DOC_UPLOADED',
      invoiceId: parseInt(invoiceId),
      documentHash,
      documentType: type,
      uploadedBy: 'system' // This should be the actual user address
    });

    return NextResponse.json({
      documentHash,
      documentEvent
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentHash = searchParams.get('hash');
    const invoiceId = searchParams.get('invoiceId');

    if (!documentHash || !invoiceId) {
      return NextResponse.json(
        { error: 'Document hash and invoice ID required' },
        { status: 400 }
      );
    }

    await hfsService.deleteDocument(documentHash);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}