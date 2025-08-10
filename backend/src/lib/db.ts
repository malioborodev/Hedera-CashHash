import { Event, EventType, FileRecord, Investment, Invoice, InvoiceStatus } from '../types/index.js';
import { nanoid } from 'nanoid';

const invoices = new Map<string, Invoice>();
const investments = new Map<string, Investment>();
const events: Event[] = [];
const files = new Map<string, FileRecord>();

export const db = {
  invoice: {
    create: (data: Omit<Invoice, 'createdAt' | 'updatedAt'>): Invoice => {
      const now = new Date().toISOString();
      const inv: Invoice = { ...data, createdAt: now, updatedAt: now };
      invoices.set(inv.id, inv);
      return inv;
    },
    update: (id: string, patch: Partial<Invoice>): Invoice | undefined => {
      const curr = invoices.get(id);
      if (!curr) return undefined;
      const next = { ...curr, ...patch, updatedAt: new Date().toISOString() } as Invoice;
      invoices.set(id, next);
      return next;
    },
    get: (id: string): Invoice | undefined => invoices.get(id),
    list: (): Invoice[] => Array.from(invoices.values()).sort((a,b)=>a.createdAt.localeCompare(b.createdAt)),
  },
  investment: {
    create: (data: Omit<Investment, 'id' | 'createdAt'>): Investment => {
      const inv: Investment = { id: nanoid(), createdAt: new Date().toISOString(), ...data };
      investments.set(inv.id, inv);
      return inv;
    },
    byInvoice: (invoiceId: string): Investment[] => Array.from(investments.values()).filter(i=>i.invoiceId===invoiceId),
  },
  event: {
    publish: (type: EventType, payload: Record<string, any>, invoiceId?: string): Event => {
      const ev: Event = { id: nanoid(), type, payload, invoiceId, timestamp: new Date().toISOString() };
      events.push(ev);
      return ev;
    },
    list: (after?: string, invoiceId?: string, type?: EventType): Event[] => {
      let res = events;
      if (after) {
        res = res.filter(e => e.timestamp > after);
      }
      if (invoiceId) res = res.filter(e => e.invoiceId === invoiceId);
      if (type) res = res.filter(e => e.type === type);
      return res;
    }
  },
  file: {
    save: (file: Omit<FileRecord, 'uploadedAt'>): FileRecord => {
      const rec: FileRecord = { ...file, uploadedAt: new Date().toISOString() };
      files.set(file.id, rec);
      return rec;
    },
    get: (id: string): FileRecord | undefined => files.get(id)
  }
};