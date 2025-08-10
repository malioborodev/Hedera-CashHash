export interface Invoice {
  id: string;
  issuerId: string;
  buyerId?: string;
  attesterId?: string;
  amount: number;
  currency: string;
  yieldBps?: number;
  maturityDate?: string;
  tenorDays?: number;
  riskScore?: number;
  status: InvoiceStatus;
  fundedPct?: number;
  nftId?: string;
  ftId?: string;
  fileIds?: string[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  LISTED = 'LISTED',
  INVESTING = 'INVESTING',
  FUNDED = 'FUNDED',
  PAID = 'PAID',
  DEFAULTED = 'DEFAULTED',
  CANCELLED = 'CANCELLED'
}

export interface Investment {
  id: string;
  invoiceId: string;
  investorId: string;
  amount: number;
  txRef?: string;
  createdAt: string;
}

export interface Event {
  id: string;
  type: EventType;
  invoiceId?: string;
  payload: Record<string, any>;
  timestamp: string;
  consensusAt?: string;
}

export enum EventType {
  INVOICE_CREATED = 'INVOICE_CREATED',
  INVOICE_LISTED = 'INVOICE_LISTED',
  INVOICE_CANCELLED = 'INVOICE_CANCELLED',
  INVESTMENT_MADE = 'INVESTMENT_MADE',
  INVOICE_FUNDED = 'INVOICE_FUNDED',
  BUYER_ACK = 'BUYER_ACK',
  ATTESTER_SIGN = 'ATTESTER_SIGN',
  INVOICE_PAID = 'INVOICE_PAID',
  INVOICE_DEFAULTED = 'INVOICE_DEFAULTED'
}

export interface FileRecord {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
  sha256: string;
  data: Buffer;
  uploadedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}