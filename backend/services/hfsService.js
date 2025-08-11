const {
  Client,
  PrivateKey,
  AccountId,
  FileCreateTransaction,
  FileUpdateTransaction,
  FileDeleteTransaction,
  FileContentsQuery,
  FileInfoQuery,
  Hbar
} = require('@hashgraph/sdk');
const crypto = require('crypto');
const config = require('../config/config');

class HFSService {
  constructor() {
    this.client = null;
    this.operatorId = null;
    this.operatorKey = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      if (this.initialized) return;

      // Initialize Hedera client
      this.client = Client.forTestnet(); // or Client.forMainnet() for production
      
      this.operatorId = AccountId.fromString(config.hedera.accountId);
      this.operatorKey = PrivateKey.fromString(config.hedera.privateKey);
      
      this.client.setOperator(this.operatorId, this.operatorKey);

      this.initialized = true;
      console.log('HFS service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize HFS service:', error);
      throw error;
    }
  }

  async uploadDocument(documentData) {
    try {
      await this.ensureInitialized();

      const {
        invoiceId,
        documentType,
        fileName,
        fileContent,
        metadata = {},
        memo = ''
      } = documentData;

      // Convert file content to bytes if it's a string
      let contentBytes;
      if (typeof fileContent === 'string') {
        contentBytes = Buffer.from(fileContent, 'utf8');
      } else if (Buffer.isBuffer(fileContent)) {
        contentBytes = fileContent;
      } else {
        throw new Error('File content must be a string or Buffer');
      }

      // Calculate file hash
      const fileHash = crypto.createHash('sha256').update(contentBytes).digest('hex');

      // Create metadata object
      const fileMetadata = {
        invoiceId,
        documentType,
        fileName,
        fileSize: contentBytes.length,
        fileHash,
        uploadedAt: new Date().toISOString(),
        uploadedBy: this.operatorId.toString(),
        ...metadata
      };

      // Create metadata content
      const metadataContent = JSON.stringify(fileMetadata);
      const metadataBytes = Buffer.from(metadataContent, 'utf8');

      // Upload the actual file
      const fileCreateTx = new FileCreateTransaction()
        .setContents(contentBytes)
        .setKeys([this.operatorKey])
        .setFileMemo(memo || `Document for invoice ${invoiceId}: ${fileName}`)
        .setMaxTransactionFee(new Hbar(2))
        .freezeWith(this.client);

      const fileCreateSign = await fileCreateTx.sign(this.operatorKey);
      const fileCreateSubmit = await fileCreateSign.execute(this.client);
      const fileCreateRx = await fileCreateSubmit.getReceipt(this.client);
      
      const fileId = fileCreateRx.fileId;

      // Upload metadata file
      const metadataCreateTx = new FileCreateTransaction()
        .setContents(metadataBytes)
        .setKeys([this.operatorKey])
        .setFileMemo(`Metadata for file ${fileId}`)
        .setMaxTransactionFee(new Hbar(2))
        .freezeWith(this.client);

      const metadataCreateSign = await metadataCreateTx.sign(this.operatorKey);
      const metadataCreateSubmit = await metadataCreateSign.execute(this.client);
      const metadataCreateRx = await metadataCreateSubmit.getReceipt(this.client);
      
      const metadataFileId = metadataCreateRx.fileId;

      console.log(`Uploaded document ${fileName} with file ID ${fileId}`);

      return {
        success: true,
        fileId: fileId.toString(),
        metadataFileId: metadataFileId.toString(),
        fileName,
        fileSize: contentBytes.length,
        fileHash,
        documentType,
        invoiceId,
        transactionId: fileCreateSubmit.transactionId.toString(),
        metadataTransactionId: metadataCreateSubmit.transactionId.toString(),
        uploadedAt: fileMetadata.uploadedAt,
        metadata: fileMetadata
      };
    } catch (error) {
      console.error('Upload document error:', error);
      throw new Error(`Failed to upload document: ${error.message}`);
    }
  }

  async updateDocument(updateData) {
    try {
      await this.ensureInitialized();

      const {
        fileId,
        newContent,
        updateMetadata = {},
        memo = ''
      } = updateData;

      // Convert new content to bytes
      let contentBytes;
      if (typeof newContent === 'string') {
        contentBytes = Buffer.from(newContent, 'utf8');
      } else if (Buffer.isBuffer(newContent)) {
        contentBytes = newContent;
      } else {
        throw new Error('New content must be a string or Buffer');
      }

      // Calculate new file hash
      const newFileHash = crypto.createHash('sha256').update(contentBytes).digest('hex');

      // Update the file
      const fileUpdateTx = new FileUpdateTransaction()
        .setFileId(fileId)
        .setContents(contentBytes)
        .setFileMemo(memo || `Updated document ${fileId}`)
        .setMaxTransactionFee(new Hbar(2))
        .freezeWith(this.client);

      const fileUpdateSign = await fileUpdateTx.sign(this.operatorKey);
      const fileUpdateSubmit = await fileUpdateSign.execute(this.client);
      const fileUpdateRx = await fileUpdateSubmit.getReceipt(this.client);

      console.log(`Updated document with file ID ${fileId}`);

      return {
        success: true,
        fileId,
        newFileSize: contentBytes.length,
        newFileHash,
        transactionId: fileUpdateSubmit.transactionId.toString(),
        updatedAt: new Date().toISOString(),
        updateMetadata
      };
    } catch (error) {
      console.error('Update document error:', error);
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }

  async deleteDocument(deleteData) {
    try {
      await this.ensureInitialized();

      const { fileId, metadataFileId } = deleteData;

      // Delete the main file
      const fileDeleteTx = new FileDeleteTransaction()
        .setFileId(fileId)
        .setMaxTransactionFee(new Hbar(1))
        .freezeWith(this.client);

      const fileDeleteSign = await fileDeleteTx.sign(this.operatorKey);
      const fileDeleteSubmit = await fileDeleteSign.execute(this.client);
      const fileDeleteRx = await fileDeleteSubmit.getReceipt(this.client);

      let metadataDeleteResult = null;
      
      // Delete metadata file if provided
      if (metadataFileId) {
        try {
          const metadataDeleteTx = new FileDeleteTransaction()
            .setFileId(metadataFileId)
            .setMaxTransactionFee(new Hbar(1))
            .freezeWith(this.client);

          const metadataDeleteSign = await metadataDeleteTx.sign(this.operatorKey);
          const metadataDeleteSubmit = await metadataDeleteSign.execute(this.client);
          const metadataDeleteRx = await metadataDeleteSubmit.getReceipt(this.client);

          metadataDeleteResult = {
            transactionId: metadataDeleteSubmit.transactionId.toString()
          };
        } catch (metadataError) {
          console.warn(`Failed to delete metadata file ${metadataFileId}:`, metadataError.message);
        }
      }

      console.log(`Deleted document with file ID ${fileId}`);

      return {
        success: true,
        fileId,
        metadataFileId,
        transactionId: fileDeleteSubmit.transactionId.toString(),
        metadataDeleteResult,
        deletedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Delete document error:', error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  async getDocument(fileId) {
    try {
      await this.ensureInitialized();

      // Get file contents
      const fileContents = await new FileContentsQuery()
        .setFileId(fileId)
        .setMaxQueryPayment(new Hbar(1))
        .execute(this.client);

      // Get file info
      const fileInfo = await new FileInfoQuery()
        .setFileId(fileId)
        .setMaxQueryPayment(new Hbar(1))
        .execute(this.client);

      // Calculate file hash
      const fileHash = crypto.createHash('sha256').update(fileContents).digest('hex');

      return {
        success: true,
        fileId: fileId.toString(),
        content: fileContents,
        contentString: fileContents.toString('utf8'),
        fileSize: fileContents.length,
        fileHash,
        info: {
          size: fileInfo.size.toString(),
          expirationTime: fileInfo.expirationTime?.toString(),
          isDeleted: fileInfo.isDeleted,
          keys: fileInfo.keys?.map(key => key.toString()),
          fileMemo: fileInfo.fileMemo
        }
      };
    } catch (error) {
      console.error('Get document error:', error);
      throw new Error(`Failed to get document: ${error.message}`);
    }
  }

  async getDocumentMetadata(metadataFileId) {
    try {
      await this.ensureInitialized();

      // Get metadata file contents
      const metadataContents = await new FileContentsQuery()
        .setFileId(metadataFileId)
        .setMaxQueryPayment(new Hbar(1))
        .execute(this.client);

      const metadataString = metadataContents.toString('utf8');
      const metadata = JSON.parse(metadataString);

      return {
        success: true,
        metadataFileId: metadataFileId.toString(),
        metadata
      };
    } catch (error) {
      console.error('Get document metadata error:', error);
      throw new Error(`Failed to get document metadata: ${error.message}`);
    }
  }

  async getFileInfo(fileId) {
    try {
      await this.ensureInitialized();

      const fileInfo = await new FileInfoQuery()
        .setFileId(fileId)
        .setMaxQueryPayment(new Hbar(1))
        .execute(this.client);

      return {
        fileId: fileId.toString(),
        size: fileInfo.size.toString(),
        expirationTime: fileInfo.expirationTime?.toString(),
        isDeleted: fileInfo.isDeleted,
        keys: fileInfo.keys?.map(key => key.toString()),
        fileMemo: fileInfo.fileMemo,
        ledgerId: fileInfo.ledgerId?.toString()
      };
    } catch (error) {
      console.error('Get file info error:', error);
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }

  async uploadMultipleDocuments(documentsData) {
    try {
      await this.ensureInitialized();

      const { invoiceId, documents } = documentsData;
      const uploadResults = [];

      for (const document of documents) {
        try {
          const result = await this.uploadDocument({
            invoiceId,
            ...document
          });
          uploadResults.push(result);
        } catch (error) {
          console.error(`Failed to upload document ${document.fileName}:`, error.message);
          uploadResults.push({
            success: false,
            fileName: document.fileName,
            error: error.message
          });
        }
      }

      const successCount = uploadResults.filter(result => result.success).length;
      const failureCount = uploadResults.length - successCount;

      return {
        success: failureCount === 0,
        invoiceId,
        totalDocuments: documents.length,
        successCount,
        failureCount,
        results: uploadResults
      };
    } catch (error) {
      console.error('Upload multiple documents error:', error);
      throw new Error(`Failed to upload multiple documents: ${error.message}`);
    }
  }

  async createDocumentIndex(indexData) {
    try {
      await this.ensureInitialized();

      const { invoiceId, documents } = indexData;

      // Create index document
      const indexContent = {
        invoiceId,
        documentCount: documents.length,
        documents: documents.map(doc => ({
          fileId: doc.fileId,
          metadataFileId: doc.metadataFileId,
          fileName: doc.fileName,
          documentType: doc.documentType,
          fileHash: doc.fileHash,
          uploadedAt: doc.uploadedAt
        })),
        indexCreatedAt: new Date().toISOString(),
        indexVersion: '1.0'
      };

      const indexBytes = Buffer.from(JSON.stringify(indexContent, null, 2), 'utf8');

      // Upload index file
      const indexCreateTx = new FileCreateTransaction()
        .setContents(indexBytes)
        .setKeys([this.operatorKey])
        .setFileMemo(`Document index for invoice ${invoiceId}`)
        .setMaxTransactionFee(new Hbar(2))
        .freezeWith(this.client);

      const indexCreateSign = await indexCreateTx.sign(this.operatorKey);
      const indexCreateSubmit = await indexCreateSign.execute(this.client);
      const indexCreateRx = await indexCreateSubmit.getReceipt(this.client);
      
      const indexFileId = indexCreateRx.fileId;

      console.log(`Created document index for invoice ${invoiceId} with file ID ${indexFileId}`);

      return {
        success: true,
        indexFileId: indexFileId.toString(),
        invoiceId,
        documentCount: documents.length,
        transactionId: indexCreateSubmit.transactionId.toString(),
        indexContent
      };
    } catch (error) {
      console.error('Create document index error:', error);
      throw new Error(`Failed to create document index: ${error.message}`);
    }
  }

  async getDocumentIndex(indexFileId) {
    try {
      await this.ensureInitialized();

      const indexContents = await new FileContentsQuery()
        .setFileId(indexFileId)
        .setMaxQueryPayment(new Hbar(1))
        .execute(this.client);

      const indexString = indexContents.toString('utf8');
      const indexData = JSON.parse(indexString);

      return {
        success: true,
        indexFileId: indexFileId.toString(),
        indexData
      };
    } catch (error) {
      console.error('Get document index error:', error);
      throw new Error(`Failed to get document index: ${error.message}`);
    }
  }

  async verifyDocumentIntegrity(verifyData) {
    try {
      await this.ensureInitialized();

      const { fileId, expectedHash } = verifyData;

      // Get file contents
      const fileContents = await new FileContentsQuery()
        .setFileId(fileId)
        .setMaxQueryPayment(new Hbar(1))
        .execute(this.client);

      // Calculate current hash
      const currentHash = crypto.createHash('sha256').update(fileContents).digest('hex');

      const isValid = currentHash === expectedHash;

      return {
        success: true,
        fileId: fileId.toString(),
        isValid,
        expectedHash,
        currentHash,
        fileSize: fileContents.length,
        verifiedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Verify document integrity error:', error);
      throw new Error(`Failed to verify document integrity: ${error.message}`);
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  // Utility methods
  generateFileHash(content) {
    let contentBytes;
    if (typeof content === 'string') {
      contentBytes = Buffer.from(content, 'utf8');
    } else if (Buffer.isBuffer(content)) {
      contentBytes = content;
    } else {
      throw new Error('Content must be a string or Buffer');
    }
    
    return crypto.createHash('sha256').update(contentBytes).digest('hex');
  }

  validateFileSize(content, maxSizeBytes = 1024 * 1024) { // Default 1MB
    let contentBytes;
    if (typeof content === 'string') {
      contentBytes = Buffer.from(content, 'utf8');
    } else if (Buffer.isBuffer(content)) {
      contentBytes = content;
    } else {
      throw new Error('Content must be a string or Buffer');
    }

    if (contentBytes.length > maxSizeBytes) {
      throw new Error(`File size ${contentBytes.length} bytes exceeds maximum allowed size ${maxSizeBytes} bytes`);
    }

    return true;
  }

  formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  generateFileName(originalName, invoiceId, documentType) {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    const baseName = originalName.replace(/\.[^/.]+$/, "");
    return `${invoiceId}_${documentType}_${baseName}_${timestamp}.${extension}`;
  }

  async getTransactionStatus(transactionId) {
    try {
      await this.ensureInitialized();
      
      const receipt = await this.client.getTransactionReceipt(transactionId);
      
      return {
        status: receipt.status.toString(),
        transactionId: transactionId,
        consensusTimestamp: receipt.consensusTimestamp?.toString()
      };
    } catch (error) {
      console.error('Get transaction status error:', error);
      return {
        status: 'UNKNOWN',
        error: error.message
      };
    }
  }

  // Document type validation
  validateDocumentType(documentType) {
    const allowedTypes = [
      'invoice',
      'purchase_order',
      'delivery_receipt',
      'payment_proof',
      'contract',
      'kyc_document',
      'financial_statement',
      'tax_document',
      'insurance_document',
      'other'
    ];

    if (!allowedTypes.includes(documentType)) {
      throw new Error(`Invalid document type: ${documentType}. Allowed types: ${allowedTypes.join(', ')}`);
    }

    return true;
  }

  // MIME type detection
  detectMimeType(fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'txt': 'text/plain',
      'csv': 'text/csv',
      'json': 'application/json',
      'xml': 'application/xml'
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }
}

module.exports = new HFSService();