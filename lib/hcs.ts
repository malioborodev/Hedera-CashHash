import { Client, TopicMessageSubmitTransaction, TopicId } from "@hashgraph/sdk";
import { env } from "../config/env.ts";

const client = Client.forTestnet();

// Determine if we should run in demo mode for HCS (no operator keys)
const HCS_DEMO_MODE = !!(env.DEMO_MODE || !env.HEDERA_OPERATOR_ID || !env.HEDERA_OPERATOR_KEY);

if (!HCS_DEMO_MODE) {
  client.setOperator(env.HEDERA_OPERATOR_ID!, env.HEDERA_OPERATOR_KEY!);
} else {
  console.warn("[HCS] Running in demo mode: missing Hedera operator credentials or DEMO_MODE enabled. HCS events will be stored in-memory.");
}

export interface HCSMessage {
  type:
    | 'LISTED'
    | 'INVESTED'
    | 'PAID'
    | 'DEFAULTED'
    | 'DOC_UPLOADED'
    | 'BOND_POSTED'
    | 'BRIDGE_TO_HEDERA'
    | 'BRIDGE_FROM_HEDERA'
    | 'BRIDGE_CONFIRMED'
    | 'BRIDGE_FAILED';
  invoiceId: string;
  data: any;
  timestamp: number;
  txHash?: string;
}

// In-memory event store for demo mode
const inMemoryEvents: HCSMessage[] = [];

export class HCSService {
  private topicId: TopicId | null;

  constructor() {
    if (!HCS_DEMO_MODE) {
      this.topicId = TopicId.fromString(env.HCS_TOPIC_ID);
    } else {
      this.topicId = null;
    }
  }

  async publishEvent(message: HCSMessage): Promise<string> {
    const messageWithTs: HCSMessage = { ...message, timestamp: message.timestamp || Date.now() };

    if (HCS_DEMO_MODE) {
      inMemoryEvents.push(messageWithTs);
      return String(inMemoryEvents.length);
    }

    const messageJson = JSON.stringify(messageWithTs);
    
    const transaction = new TopicMessageSubmitTransaction()
      .setTopicId(this.topicId!)
      .setMessage(messageJson);

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    
    return receipt.topicSequenceNumber.toString();
  }

  async getEvents(invoiceId?: string): Promise<HCSMessage[]> {
    if (HCS_DEMO_MODE) {
      const filtered = invoiceId ? inMemoryEvents.filter(e => e.invoiceId === invoiceId) : [...inMemoryEvents];
      return filtered.sort((a, b) => b.timestamp - a.timestamp);
    }

    const mirrorUrl = `${env.MIRROR_BASE}/api/v1/topics/${env.HCS_TOPIC_ID}/messages`;
    
    const response = await fetch(mirrorUrl);
    const data = await response.json();
    
    const events: HCSMessage[] = [];
    
    for (const message of data.messages) {
      try {
        const decoded = Buffer.from(message.message, 'base64').toString('utf-8');
        const event = JSON.parse(decoded) as HCSMessage;
        
        if (!invoiceId || event.invoiceId === invoiceId) {
          events.push({
            ...event,
            txHash: message.transaction_id
          });
        }
      } catch (error) {
        console.error('Error decoding HCS message:', error);
      }
    }
    
    return events.sort((a, b) => b.timestamp - a.timestamp);
  }

  async publishListedEvent(invoiceId: string, invoiceData: any): Promise<string> {
    return this.publishEvent({
      type: 'LISTED',
      invoiceId,
      data: invoiceData,
      timestamp: Date.now()
    });
  }

  async publishInvestedEvent(invoiceId: string, investmentData: any): Promise<string> {
    return this.publishEvent({
      type: 'INVESTED',
      invoiceId,
      data: investmentData,
      timestamp: Date.now()
    });
  }

  async publishPaidEvent(invoiceId: string, paymentData: any): Promise<string> {
    return this.publishEvent({
      type: 'PAID',
      invoiceId,
      data: paymentData,
      timestamp: Date.now()
    });
  }

  async publishDefaultedEvent(invoiceId: string, defaultData: any): Promise<string> {
    return this.publishEvent({
      type: 'DEFAULTED',
      invoiceId,
      data: defaultData,
      timestamp: Date.now()
    });
  }

  async publishBondPostedEvent(invoiceId: string, bondData: any): Promise<string> {
    return this.publishEvent({
      type: 'BOND_POSTED',
      invoiceId,
      data: bondData,
      timestamp: Date.now()
    });
  }

  async publishDocUploadedEvent(invoiceId: string, docData: any): Promise<string> {
    return this.publishEvent({
      type: 'DOC_UPLOADED',
      invoiceId,
      data: docData,
      timestamp: Date.now()
    });
  }

  // Helper methods for API routes
  async getInvoice(invoiceId: string): Promise<any | null> {
    const events = await this.getEvents(invoiceId);
    const invoiceEvent = events.find(e => e.type === 'LISTED' && e.invoiceId === invoiceId);
    
    if (!invoiceEvent) return null;
    
    // Rebuild invoice state from events
    const invoice = {
      id: invoiceId,
      ...invoiceEvent.data,
      status: 'LISTED' as any
    };

    // Check for status changes
    const paidEvents = events.filter(e => e.type === 'PAID' && e.invoiceId === invoiceId);
    const defaultedEvents = events.filter(e => e.type === 'DEFAULTED' && e.invoiceId === invoiceId);
    const investmentEvents = events.filter(e => e.type === 'INVESTED' && e.invoiceId === invoiceId);
    
    if (paidEvents.length > 0) {
      invoice.status = 'PAID';
    } else if (defaultedEvents.length > 0) {
      invoice.status = 'DEFAULTED';
    } else if (investmentEvents.length > 0) {
      invoice.status = 'FUNDED';
    }

    return invoice;
  }

  async getEventsByInvoice(invoiceId: string, eventType: string): Promise<HCSMessage[]> {
    const events = await this.getEvents(invoiceId);
    return events.filter(e => e.type === eventType);
  }

  async getAllEventsByInvoice(invoiceId: string): Promise<HCSMessage[]> {
    return this.getEvents(invoiceId);
  }

  async getAllEvents(options?: { type?: string; limit?: number; offset?: number }): Promise<HCSMessage[]> {
    const allEvents = await this.getEvents();
    let filtered = allEvents;

    if (options?.type) {
      filtered = filtered.filter(e => e.type === options.type);
    }

    // Apply pagination
    const start = options?.offset || 0;
    const end = start + (options?.limit || filtered.length);
    
    return filtered.slice(start, end);
  }

  async getInvoices(filters?: any): Promise<any[]> {
    const events = await this.getEvents();
    const listedEvents = events.filter(e => e.type === 'LISTED');
    
    const invoices = listedEvents.map(event => ({
      id: event.invoiceId,
      ...event.data,
      status: 'LISTED'
    }));

    // Apply filters
    if (filters?.status) {
      return invoices.filter(inv => inv.status === filters.status);
    }
    if (filters?.country) {
      return invoices.filter(inv => inv.country === filters.country);
    }

    return invoices;
  }

  async getBondEvents(filters?: any): Promise<any[]> {
    const events = await this.getEvents();
    const bondEvents = events.filter(e => e.type === 'BOND_POSTED');
    
    return bondEvents.map(event => ({
      id: event.invoiceId,
      ...event.data,
      eventId: event.invoiceId
    }));
  }

  async getInvestmentEvents(filters?: any): Promise<any[]> {
    const events = await this.getEvents();
    const investmentEvents = events.filter(e => e.type === 'INVESTED');
    
    let filtered = investmentEvents;
    if (filters?.investor) {
      filtered = filtered.filter(e => e.data.investorAddress === filters.investor);
    }

    return filtered.map(event => ({
      id: event.invoiceId,
      ...event.data,
      eventId: event.invoiceId
    }));
  }

  async getPayoutEvents(filters?: any): Promise<any[]> {
    const events = await this.getEvents();
    const payoutEvents = events.filter(e => e.type === 'PAID' || e.type === 'DEFAULTED');
    
    return payoutEvents.map(event => ({
      id: event.invoiceId,
      ...event.data,
      eventId: event.invoiceId
    }));
  }

  async publishBondEvent(data: any): Promise<{ id: string }> {
    const eventId = await this.publishEvent({
      type: 'BOND_POSTED',
      invoiceId: data.invoiceId,
      data,
      timestamp: Date.now()
    });
    return { id: eventId };
  }

  async publishInvestmentEvent(data: any): Promise<{ id: string }> {
    const eventId = await this.publishEvent({
      type: 'INVESTED',
      invoiceId: data.invoiceId,
      data,
      timestamp: Date.now()
    });
    return { id: eventId };
  }

  async publishPayoutEvent(data: any): Promise<{ id: string }> {
    const eventId = await this.publishEvent({
      type: data.type,
      invoiceId: data.invoiceId,
      data,
      timestamp: Date.now()
    });
    return { id: eventId };
  }

  async publishDocumentEvent(data: any): Promise<{ id: string }> {
    const eventId = await this.publishEvent({
      type: 'DOC_UPLOADED',
      invoiceId: data.invoiceId,
      data,
      timestamp: Date.now()
    });
    return { id: eventId };
  }
}

export const hcsService = new HCSService();