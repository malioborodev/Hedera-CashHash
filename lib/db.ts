import { nanoid } from 'nanoid';
import { 
  Invoice, 
  Investment, 
  Event, 
  FileRecord, 
  InvoiceStatus, 
  EventType 
} from '../types/index.ts';
import { HederaOps } from './hedera.ts';
import { hcsService } from './hcs.ts';

function formatDate() {
  return new Date().toISOString();
}

// Hedera-native Invoice operations via HCS/HTS/HFS
const invoiceDb = {
  async list(status?: InvoiceStatus): Promise<Invoice[]> {
    // Retrieve all INVOICE_CREATED events from HCS
    const events = await hcsService.getEvents();
    const invoices: Invoice[] = [];
    
    for (const event of events) {
      if (event.type === 'LISTED') {
        const invoice: Invoice = {
          id: event.invoiceId,
          ...event.data,
          createdAt: new Date(event.timestamp).toISOString(),
          updatedAt: new Date(event.timestamp).toISOString(),
        };
        
        // Filter by status if provided
        if (!status || invoice.status === status) {
          invoices.push(invoice);
        }
      }
    }
    
    return invoices;
  },
  
  async get(id: string): Promise<Invoice | undefined> {
    const events = await hcsService.getEvents(id);
    let invoice: Invoice | undefined;
    
    // Reconstruct invoice from events
    for (const event of events) {
      if (event.type === 'LISTED' && event.invoiceId === id) {
        invoice = {
          id: event.invoiceId,
          ...event.data,
          createdAt: new Date(event.timestamp).toISOString(),
          updatedAt: new Date(event.timestamp).toISOString(),
        };
        break;
      }
    }
    
    return invoice;
  },
  
  async create(data: Partial<Invoice>): Promise<Invoice> {
    const id = nanoid();
    const now = formatDate();
    const invoice: Invoice = {
      id,
      sellerId: data.sellerId || '',
      buyerId: data.buyerId,
      amount: data.amount || 0,
      currency: data.currency || 'USD',
      yieldBps: data.yieldBps,
      maturityDate: data.maturityDate,
      tenorDays: data.tenorDays,
      riskScore: data.riskScore,
      status: data.status || InvoiceStatus.DRAFT,
      fundedPct: data.fundedPct || 0,
      nftId: data.nftId,
      ftId: data.ftId,
      fileId: data.fileId,
      dueDate: data.dueDate,
      createdAt: now,
      updatedAt: now,
    };
    
    // Create invoice on Hedera (HTS tokenization + HCS event)
    const hederaResult = await HederaOps.createInvoice(invoice);
    
    // Update invoice with Hedera IDs
    invoice.nftId = hederaResult.nft.tokenId;
    invoice.ftId = hederaResult.ft.tokenId;
    if (hederaResult.file) {
      invoice.fileId = hederaResult.file.fileId;
    }
    
    return invoice;
  },
  
  async update(id: string, data: Partial<Invoice>): Promise<Invoice | undefined> {
    const existing = await this.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...data, updatedAt: formatDate() };
    
    // Publish update event to HCS
    await hcsService.publishEvent({
      type: 'LISTED',
      invoiceId: id,
      data: updated,
      timestamp: Date.now()
    });
    
    return updated;
  },
  
  async delete(id: string): Promise<boolean> {
    // Publish deletion event to HCS
    await hcsService.publishEvent({
      type: 'LISTED',
      invoiceId: id,
      data: { deleted: true },
      timestamp: Date.now()
    });
    
    return true;
  }
};

// Hedera-native Investment operations
const investmentDb = {
  async create(data: Partial<Investment>): Promise<Investment> {
    const id = nanoid();
    const investment: Investment = {
      id,
      invoiceId: data.invoiceId || '',
      investorId: data.investorId || '',
      amount: data.amount || 0,
      txRef: data.txRef,
      createdAt: formatDate(),
    };
    
    // Execute investment on Hedera
    const invoice = await invoiceDb.get(investment.invoiceId);
    if (invoice?.ftId) {
      const hederaResult = await HederaOps.investInInvoice(
        investment.invoiceId,
        investment.investorId,
        investment.amount,
        invoice.ftId
      );
      
      investment.txRef = hederaResult.transfer.txId;
    }
    
    return investment;
  },
  
  async list(invoiceId?: string): Promise<Investment[]> {
    // Get investment events from HCS
    const events = await hcsService.getEvents(invoiceId);
    const investments: Investment[] = [];
    
    for (const event of events) {
      if (event.type === 'INVESTED') {
        const investment: Investment = {
          id: nanoid(),
          invoiceId: event.invoiceId,
          investorId: event.data.investorId,
          amount: event.data.amount,
          txRef: event.txHash,
          createdAt: new Date(event.timestamp).toISOString(),
        };
        investments.push(investment);
      }
    }
    
    return investments;
  },
  
  async get(id: string): Promise<Investment | undefined> {
    const investments = await this.list();
    return investments.find(i => i.id === id);
  }
};

// Hedera-native Event operations via HCS
const eventDb = {
  async publish(type: EventType, payload: Record<string, any>, invoiceId?: string): Promise<Event> {
    const id = nanoid();
    const event: Event = {
      id,
      type,
      invoiceId,
      payload,
      timestamp: formatDate(),
    };
    
    // Publish to HCS
    await hcsService.publishEvent({
      type,
      invoiceId: invoiceId || payload.invoiceId,
      data: payload,
      timestamp: Date.now()
    });
    
    return event;
  },
  
  async list(after?: string, invoiceId?: string, type?: EventType): Promise<Event[]> {
    const messages = await hcsService.getEvents(invoiceId);
    let items: Event[] = messages.map(m => ({
      id: m.txHash || nanoid(),
      type: m.type as EventType,
      invoiceId: m.invoiceId,
      payload: m.data,
      timestamp: new Date(m.timestamp).toISOString(),
    }));
    
    if (after) {
      const afterTime = new Date(after);
      items = items.filter(e => new Date(e.timestamp) > afterTime);
    }
    
    if (type) {
      items = items.filter(e => e.type === type);
    }
    
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
};

// File CRUD -> use Hedera File Service in HederaOps
const fileDb = {
  async create(data: Partial<FileRecord>): Promise<FileRecord> {
    const id = nanoid();
    const buffer = data.buffer || Buffer.alloc(0);
    const hedera = await HederaOps.createInvoice({ id: data.invoiceId || id }, buffer);
    const fileId = hedera.file?.fileId;
    
    const file: FileRecord = {
      id,
      invoiceId: data.invoiceId || '',
      filename: data.filename || '',
      mimetype: data.mimetype || '',
      size: data.size || buffer.length,
      sha256: data.sha256 || '',
      uploadedAt: formatDate(),
      buffer,
      fileId,
    } as any;
    
    return file;
  },
  
  async get(id: string): Promise<FileRecord | undefined> {
    // Not directly retrievable without mirror/HIP reader; placeholder
    return undefined;
  },
  
  async getByInvoice(invoiceId: string): Promise<FileRecord | undefined> {
    // Not directly retrievable; should query mirror or store fileId via HCS events
    return undefined;
  }
};

export const db = {
  invoice: invoiceDb,
  investment: investmentDb,
  event: eventDb,
  file: fileDb,
};