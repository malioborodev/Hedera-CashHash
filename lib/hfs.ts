import { 
  Client, 
  FileCreateTransaction, 
  FileAppendTransaction, 
  FileContentsQuery,
  FileId,
  Hbar,
  PrivateKey,
  AccountId
} from "@hashgraph/sdk";
import { env } from "../config/env.ts";
import { hcsService } from "./hcs";

const client = Client.forTestnet();

if (!env.DEMO_MODE && env.HEDERA_OPERATOR_ID && env.HEDERA_OPERATOR_KEY) {
  client.setOperator(env.HEDERA_OPERATOR_ID, env.HEDERA_OPERATOR_KEY);
}

export interface DocumentMetadata {
  invoiceId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: Date;
  fileId: string;
  checksum: string;
}

export class HFSService {
  async uploadDocument(
    invoiceId: string,
    fileBuffer: Buffer,
    fileName: string,
    fileType: string
  ): Promise<DocumentMetadata> {
    const checksum = this.calculateChecksum(fileBuffer);
    
    const fileCreateTx = new FileCreateTransaction()
      .setKeys([PrivateKey.fromString(env.HEDERA_OPERATOR_KEY)])
      .setContents(fileBuffer.slice(0, 4096))
      .setMaxTransactionFee(new Hbar(2));

    const response = await fileCreateTx.execute(client);
    const receipt = await response.getReceipt(client);
    const fileId = receipt.fileId;

    if (!fileId) {
      throw new Error('Failed to create file');
    }

    if (fileBuffer.length > 4096) {
      const appendTx = new FileAppendTransaction()
        .setFileId(fileId)
        .setContents(fileBuffer.slice(4096))
        .setMaxTransactionFee(new Hbar(2));

      await appendTx.execute(client);
    }

    const metadata: DocumentMetadata = {
      invoiceId,
      fileName,
      fileType,
      fileSize: fileBuffer.length,
      uploadDate: new Date(),
      fileId: fileId.toString(),
      checksum
    };

    await hcsService.publishDocUploadedEvent(invoiceId, metadata);

    return metadata;
  }

  async downloadDocument(fileId: string): Promise<Buffer> {
    const query = new FileContentsQuery()
      .setFileId(FileId.fromString(fileId));

    const contents = await query.execute(client);
    return Buffer.from(contents);
  }

  async getDocumentMetadata(fileId: string): Promise<DocumentMetadata | null> {
    try {
      const contents = await this.downloadDocument(fileId);
      const checksum = this.calculateChecksum(contents);
      
      return {
        invoiceId: '',
        fileName: '',
        fileType: 'application/octet-stream',
        fileSize: contents.length,
        uploadDate: new Date(),
        fileId,
        checksum
      };
    } catch (error) {
      console.error('Error getting document metadata:', error);
      return null;
    }
  }

  async verifyDocument(fileId: string, expectedChecksum: string): Promise<boolean> {
    try {
      const contents = await this.downloadDocument(fileId);
      const actualChecksum = this.calculateChecksum(contents);
      return actualChecksum === expectedChecksum;
    } catch (error) {
      console.error('Error verifying document:', error);
      return false;
    }
  }

  private calculateChecksum(buffer: Buffer): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  async listDocuments(invoiceId: string): Promise<DocumentMetadata[]> {
    const events = await hcsService.getEvents(invoiceId);
    const docEvents = events.filter(e => e.type === 'DOC_UPLOADED');
    
    const documents: DocumentMetadata[] = [];
    
    for (const event of docEvents) {
      if (event.data && event.data.fileId) {
        const metadata = await this.getDocumentMetadata(event.data.fileId);
        if (metadata) {
          documents.push({
            ...metadata,
            ...event.data
          });
        }
      }
    }
    
    return documents;
  }

  async deleteDocument(fileId: string): Promise<void> {
    // Note: Files on Hedera are immutable once created
    // This would typically involve marking as deleted in metadata
    console.warn('Files on Hedera are immutable. Consider marking as deleted in metadata.');
  }

  async uploadInvoiceDocument(
    invoiceId: string,
    fileBuffer: Buffer,
    fileName: string,
    documentType: 'invoice' | 'receipt' | 'contract' | 'other'
  ): Promise<DocumentMetadata> {
    const metadata = await this.uploadDocument(
      invoiceId,
      fileBuffer,
      fileName,
      this.getMimeType(fileName)
    );

    const enrichedMetadata = {
      ...metadata,
      documentType,
      invoiceId
    };

    return enrichedMetadata;
  }

  private getMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}

export const hfsService = new HFSService();