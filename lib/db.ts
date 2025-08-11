import { nanoid } from 'nanoid';
import { 
  Invoice, 
  Investment, 
  Event, 
  FileRecord, 
  InvoiceStatus, 
  EventType 
} from '../types/index.ts';

// In-memory storage (for demo purposes)
const invoices = new Map<string, Invoice>();
const investments = new Map<string, Investment>();
const events: Event[] = [];
const files = new Map<string, FileRecord>();

function formatDate() {
  return new Date().toISOString();
}

// Invoice CRUD
const invoiceDb = {
  list: (status?: InvoiceStatus): Invoice[] => {
    const items = Array.from(invoices.values());
    return status ? items.filter(i => i.status === status) : items;
  },
  
  get: (id: string): Invoice | undefined => {
    return invoices.get(id);
  },
  
  create: (data: Partial<Invoice>): Invoice => {
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
    invoices.set(id, invoice);
    return invoice;
  },
  
  update: (id: string, data: Partial<Invoice>): Invoice | undefined => {
    const existing = invoices.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data, updatedAt: formatDate() };
    invoices.set(id, updated);
    return updated;
  },
  
  delete: (id: string): boolean => {
    return invoices.delete(id);
  }
};

// Investment CRUD
const investmentDb = {
  create: (data: Partial<Investment>): Investment => {
    const id = nanoid();
    const investment: Investment = {
      id,
      invoiceId: data.invoiceId || '',
      investorId: data.investorId || '',
      amount: data.amount || 0,
      txRef: data.txRef,
      createdAt: formatDate(),
    };
    investments.set(id, investment);
    return investment;
  },
  
  list: (invoiceId?: string): Investment[] => {
    const items = Array.from(investments.values());
    return invoiceId ? items.filter(i => i.invoiceId === invoiceId) : items;
  },
  
  get: (id: string): Investment | undefined => {
    return investments.get(id);
  }
};

// Event CRUD
const eventDb = {
  publish: (type: EventType, payload: Record<string, any>, invoiceId?: string): Event => {
    const id = nanoid();
    const event: Event = {
      id,
      type,
      invoiceId,
      payload,
      timestamp: formatDate(),
    };
    events.push(event);
    return event;
  },
  
  list: (after?: string, invoiceId?: string, type?: EventType): Event[] => {
    let items = [...events];
    
    if (after) {
      const afterTime = new Date(after);
      items = items.filter(e => new Date(e.timestamp) > afterTime);
    }
    
    if (invoiceId) {
      items = items.filter(e => e.invoiceId === invoiceId);
    }
    
    if (type) {
      items = items.filter(e => e.type === type);
    }
    
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
};

// File CRUD
const fileDb = {
  create: (data: Partial<FileRecord>): FileRecord => {
    const id = nanoid();
    const file: FileRecord = {
      id,
      invoiceId: data.invoiceId || '',
      filename: data.filename || '',
      mimetype: data.mimetype || '',
      size: data.size || 0,
      sha256: data.sha256 || '',
      buffer: data.buffer || Buffer.alloc(0),
      uploadedAt: formatDate(),
    };
    files.set(id, file);
    return file;
  },
  
  get: (id: string): FileRecord | undefined => {
    return files.get(id);
  },
  
  getByInvoice: (invoiceId: string): FileRecord | undefined => {
    return Array.from(files.values()).find(f => f.invoiceId === invoiceId);
  }
};

export const db = {
  invoice: invoiceDb,
  investment: investmentDb,
  event: eventDb,
  file: fileDb,
};