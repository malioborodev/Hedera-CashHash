import { Client, TopicMessageSubmitTransaction, TopicId } from "@hashgraph/sdk";
import { env } from "./config/env";

const client = Client.forTestnet();

// Determine if we should run in demo mode for HCS (no operator keys)
const HCS_DEMO_MODE = !!(env.DEMO_MODE || !env.HEDERA_ACCOUNT_ID || !env.HEDERA_PRIVATE_KEY);

if (!HCS_DEMO_MODE) {
  client.setOperator(env.HEDERA_ACCOUNT_ID!, env.HEDERA_PRIVATE_KEY!);
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
  private topicId: TopicId;

  constructor() {
    this.topicId = TopicId.fromString(env.HCS_TOPIC_ID);
  }

  async publishEvent(message: HCSMessage): Promise<string> {
    const messageWithTs: HCSMessage = { ...message, timestamp: message.timestamp || Date.now() };

    if (HCS_DEMO_MODE) {
      inMemoryEvents.push(messageWithTs);
      return String(inMemoryEvents.length);
    }

    const messageJson = JSON.stringify(messageWithTs);
    
    const transaction = new TopicMessageSubmitTransaction()
      .setTopicId(this.topicId)
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
}

export const hcsService = new HCSService();