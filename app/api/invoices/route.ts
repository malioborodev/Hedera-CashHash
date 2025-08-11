import { NextRequest, NextResponse } from 'next/server';
import { HCSService } from '@/lib/hcs';
import { HTSService } from '@/lib/hts';
import { HFSService } from '@/lib/hfs';

const hcsService = new HCSService();
const htsService = new HTSService();
const hfsService = new HFSService();

// GET /invoices - List invoices with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const tenor = searchParams.get('tenor');
    const risk = searchParams.get('risk');
    const sort = searchParams.get('sort') || 'newest';
    const status = searchParams.get('status');

    // Filter parameters
    const filters = {
      country,
      tenor: tenor ? parseInt(tenor) : undefined,
      risk,
      status,
      sort
    };

    // Get invoices from HCS events
    const invoices = await hcsService.getInvoices(filters);

    return NextResponse.json({ 
      success: true, 
      invoices 
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

// POST /invoices - Create new invoice (multipart HFS)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract form fields
    const amountUSD = parseFloat(formData.get('amountUSD') as string);
    const buyerId = formData.get('buyerId') as string;
    const maturity = formData.get('maturity') as string;
    const country = formData.get('country') as string;
    const description = formData.get('description') as string;
    const yieldBPS = parseInt(formData.get('yieldBPS') as string);
    const exporter = formData.get('exporter') as string;
    
    // Extract files
    const poFile = formData.get('poFile') as File;
    const invoiceFile = formData.get('invoiceFile') as File;
    const bolFile = formData.get('bolFile') as File | null;
    const grFile = formData.get('grFile') as File | null;

    // Validate required fields
    if (!amountUSD || !buyerId || !maturity || !country || !description || !yieldBPS || !exporter) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!poFile || !invoiceFile) {
      return NextResponse.json(
        { success: false, error: 'PO and Invoice files are required' },
        { status: 400 }
      );
    }

    // Generate invoice ID
    const invoiceId = `INV-${Date.now()}`;
    
    // Upload documents to HFS
    const fileIds: string[] = [];
    const sha256Hashes: string[] = [];
    
    // Upload required documents
    const poUpload = await hfsService.uploadDocument({
      file: poFile,
      invoiceId,
      type: 'PO',
      metadata: { required: true }
    });
    fileIds.push(poUpload.fileId);
    sha256Hashes.push(poUpload.sha256);
    
    const invoiceUpload = await hfsService.uploadDocument({
      file: invoiceFile,
      invoiceId,
      type: 'INVOICE',
      metadata: { required: true }
    });
    fileIds.push(invoiceUpload.fileId);
    sha256Hashes.push(invoiceUpload.sha256);
    
    // Upload optional documents
    if (bolFile) {
      const bolUpload = await hfsService.uploadDocument({
        file: bolFile,
        invoiceId,
        type: 'BOL',
        metadata: { required: false }
      });
      fileIds.push(bolUpload.fileId);
      sha256Hashes.push(bolUpload.sha256);
    }
    
    if (grFile) {
      const grUpload = await hfsService.uploadDocument({
        file: grFile,
        invoiceId,
        type: 'GR',
        metadata: { required: false }
      });
      fileIds.push(grUpload.fileId);
      sha256Hashes.push(grUpload.sha256);
    }

    // Calculate advance percentage (80% default, 90% if BOL exists)
    const advancePercent = bolFile ? 90 : 80;
    
    // Calculate HBAR bond amount: clamp(300, 1% x amountUSD, 5000)
    const bondAmount = Math.max(300, Math.min(amountUSD * 0.01, 5000));

    // Publish DOC_UPLOADED events
    for (let i = 0; i < fileIds.length; i++) {
      await hcsService.publishEvent({
        type: 'DOC_UPLOADED',
        invoiceId,
        data: {
          fileId: fileIds[i],
          sha256: sha256Hashes[i],
          documentType: i === 0 ? 'PO' : i === 1 ? 'INVOICE' : i === 2 ? 'BOL' : 'GR'
        }
      });
    }

    return NextResponse.json({
      success: true,
      invoiceId,
      fileIds,
      sha256Hashes,
      bondAmount,
      advancePercent
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}