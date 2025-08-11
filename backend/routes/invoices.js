const express = require('express');
const router = express.Router();
const { body, validationResult, param } = require('express-validator');
const Invoice = require('../models/Invoice');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { contractService } = require('../services/contractService');
const { htsService } = require('../services/htsService');
const { hfsService } = require('../services/hfsService');
const { riskEngine } = require('../services/riskEngine');
const { notificationService } = require('../services/notificationService');

// Create new invoice
router.post('/',
  auth,
  [
    body('buyerName').notEmpty().withMessage('Buyer name is required'),
    body('buyerAddress').notEmpty().withMessage('Buyer address is required'),
    body('amountUSD').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
    body('currency').isIn(['USD', 'EUR', 'GBP']).withMessage('Invalid currency'),
    body('tenorDays').isInt({ min: 1, max: 365 }).withMessage('Tenor must be between 1-365 days'),
    body('yieldBps').isInt({ min: 100, max: 5000 }).withMessage('Yield must be between 1-50%'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description too long')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        buyerName,
        buyerAddress,
        amountUSD,
        currency,
        tenorDays,
        yieldBps,
        description,
        documents
      } = req.body;

      // Calculate maturity date
      const maturityDate = new Date();
      maturityDate.setDate(maturityDate.getDate() + tenorDays);

      // Risk assessment
      const riskScore = await riskEngine.assessInvoice({
        buyerName,
        amountUSD,
        tenorDays,
        currency
      });

      // Create invoice in database
      const invoice = new Invoice({
        sellerId: req.user.id,
        buyerName,
        buyerAddress,
        amountUSD,
        currency,
        tenorDays,
        yieldBps,
        description,
        maturityDate,
        riskScore: riskScore.score,
        riskGrade: riskScore.grade,
        status: 'DRAFT'
      });

      await invoice.save();

      // Create smart contract invoice
      const contractResult = await contractService.createInvoice({
        invoiceId: invoice._id,
        sellerId: req.user.id,
        buyerName,
        amountUSD,
        tenorDays,
        yieldBps,
        maturityDate: Math.floor(maturityDate.getTime() / 1000)
      });

      // Update invoice with contract address
      invoice.contractAddress = contractResult.contractAddress;
      invoice.blockchainTxHash = contractResult.txHash;
      await invoice.save();

      // Send notification
      await notificationService.sendInvoiceCreated(req.user.id, invoice._id);

      res.status(201).json({
        success: true,
        data: invoice,
        riskAssessment: riskScore
      });
    } catch (error) {
      console.error('Create invoice error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create invoice',
        error: error.message
      });
    }
  }
);

// Get all invoices with filtering and pagination
router.get('/',
  auth,
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        currency,
        minAmount,
        maxAmount,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search
      } = req.query;

      const filter = {};
      
      // Add filters
      if (status) filter.status = status;
      if (currency) filter.currency = currency;
      if (minAmount) filter.amountUSD = { ...filter.amountUSD, $gte: parseFloat(minAmount) };
      if (maxAmount) filter.amountUSD = { ...filter.amountUSD, $lte: parseFloat(maxAmount) };
      
      // Search functionality
      if (search) {
        filter.$or = [
          { buyerName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Role-based filtering
      if (req.user.role === 'SELLER') {
        filter.sellerId = req.user.id;
      } else if (req.user.role === 'INVESTOR') {
        filter.status = { $in: ['LISTED', 'FUNDING', 'FUNDED'] };
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
        populate: [
          { path: 'sellerId', select: 'name email company' },
          { path: 'investments', select: 'investorId amount createdAt' }
        ]
      };

      const result = await Invoice.paginate(filter, options);

      res.json({
        success: true,
        data: result.docs,
        pagination: {
          currentPage: result.page,
          totalPages: result.totalPages,
          totalItems: result.totalDocs,
          hasNext: result.hasNextPage,
          hasPrev: result.hasPrevPage
        }
      });
    } catch (error) {
      console.error('Get invoices error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch invoices',
        error: error.message
      });
    }
  }
);

// Get single invoice by ID
router.get('/:id',
  auth,
  param('id').isMongoId().withMessage('Invalid invoice ID'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const invoice = await Invoice.findById(req.params.id)
        .populate('sellerId', 'name email company')
        .populate('investments', 'investorId amount createdAt')
        .populate('documents');

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      // Check access permissions
      if (req.user.role === 'SELLER' && invoice.sellerId._id.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Get blockchain data
      const blockchainData = await contractService.getInvoiceDetails(invoice._id);
      
      res.json({
        success: true,
        data: {
          ...invoice.toObject(),
          blockchain: blockchainData
        }
      });
    } catch (error) {
      console.error('Get invoice error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch invoice',
        error: error.message
      });
    }
  }
);

// Update invoice
router.put('/:id',
  auth,
  param('id').isMongoId().withMessage('Invalid invoice ID'),
  [
    body('buyerName').optional().notEmpty().withMessage('Buyer name cannot be empty'),
    body('amountUSD').optional().isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
    body('tenorDays').optional().isInt({ min: 1, max: 365 }).withMessage('Tenor must be between 1-365 days'),
    body('yieldBps').optional().isInt({ min: 100, max: 5000 }).withMessage('Yield must be between 1-50%')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const invoice = await Invoice.findById(req.params.id);
      
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      // Check permissions
      if (invoice.sellerId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check if invoice can be updated
      if (!['DRAFT', 'PENDING_APPROVAL'].includes(invoice.status)) {
        return res.status(400).json({
          success: false,
          message: 'Invoice cannot be updated in current status'
        });
      }

      // Update allowed fields
      const allowedUpdates = ['buyerName', 'buyerAddress', 'amountUSD', 'tenorDays', 'yieldBps', 'description'];
      const updates = {};
      
      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      // Recalculate maturity date if tenor changed
      if (updates.tenorDays) {
        const maturityDate = new Date();
        maturityDate.setDate(maturityDate.getDate() + updates.tenorDays);
        updates.maturityDate = maturityDate;
      }

      // Re-assess risk if significant changes
      if (updates.amountUSD || updates.tenorDays || updates.buyerName) {
        const riskScore = await riskEngine.assessInvoice({
          buyerName: updates.buyerName || invoice.buyerName,
          amountUSD: updates.amountUSD || invoice.amountUSD,
          tenorDays: updates.tenorDays || invoice.tenorDays,
          currency: invoice.currency
        });
        
        updates.riskScore = riskScore.score;
        updates.riskGrade = riskScore.grade;
      }

      const updatedInvoice = await Invoice.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true }
      ).populate('sellerId', 'name email company');

      res.json({
        success: true,
        data: updatedInvoice
      });
    } catch (error) {
      console.error('Update invoice error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update invoice',
        error: error.message
      });
    }
  }
);

// Submit invoice for approval
router.post('/:id/submit',
  auth,
  param('id').isMongoId().withMessage('Invalid invoice ID'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const invoice = await Invoice.findById(req.params.id);
      
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      if (invoice.sellerId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (invoice.status !== 'DRAFT') {
        return res.status(400).json({
          success: false,
          message: 'Invoice must be in DRAFT status to submit'
        });
      }

      // Validate required documents
      const requiredDocs = ['INVOICE', 'CONTRACT'];
      const uploadedDocs = invoice.documents.map(doc => doc.type);
      const missingDocs = requiredDocs.filter(doc => !uploadedDocs.includes(doc));
      
      if (missingDocs.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required documents: ${missingDocs.join(', ')}`
        });
      }

      // Update status
      invoice.status = 'PENDING_APPROVAL';
      invoice.submittedAt = new Date();
      await invoice.save();

      // Send notification to admin
      await notificationService.sendInvoiceSubmitted(invoice._id);

      res.json({
        success: true,
        data: invoice
      });
    } catch (error) {
      console.error('Submit invoice error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit invoice',
        error: error.message
      });
    }
  }
);

// Approve/Reject invoice (Admin only)
router.post('/:id/review',
  auth,
  param('id').isMongoId().withMessage('Invalid invoice ID'),
  [
    body('action').isIn(['APPROVE', 'REJECT']).withMessage('Action must be APPROVE or REJECT'),
    body('comments').optional().isLength({ max: 500 }).withMessage('Comments too long')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const { action, comments } = req.body;
      const invoice = await Invoice.findById(req.params.id);
      
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      if (invoice.status !== 'PENDING_APPROVAL') {
        return res.status(400).json({
          success: false,
          message: 'Invoice must be pending approval'
        });
      }

      if (action === 'APPROVE') {
        invoice.status = 'APPROVED';
        invoice.approvedAt = new Date();
        invoice.approvedBy = req.user.id;
        
        // Create fractional tokens
        const tokenResult = await htsService.createFractionalToken({
          invoiceId: invoice._id,
          totalSupply: invoice.amountUSD * 100, // 100 tokens per USD
          name: `CashHash Invoice #${invoice._id}`,
          symbol: `CHI${invoice._id.toString().slice(-6).toUpperCase()}`
        });
        
        invoice.tokenAddress = tokenResult.tokenAddress;
        
      } else {
        invoice.status = 'REJECTED';
        invoice.rejectedAt = new Date();
        invoice.rejectedBy = req.user.id;
      }

      if (comments) {
        invoice.reviewComments = comments;
      }

      await invoice.save();

      // Send notification
      await notificationService.sendInvoiceReviewed(invoice._id, action);

      res.json({
        success: true,
        data: invoice
      });
    } catch (error) {
      console.error('Review invoice error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to review invoice',
        error: error.message
      });
    }
  }
);

// List invoice for investment
router.post('/:id/list',
  auth,
  param('id').isMongoId().withMessage('Invalid invoice ID'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const invoice = await Invoice.findById(req.params.id);
      
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      if (invoice.sellerId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (invoice.status !== 'APPROVED') {
        return res.status(400).json({
          success: false,
          message: 'Invoice must be approved to list'
        });
      }

      // Enable listing on smart contract
      await contractService.enableListing(invoice._id);

      invoice.status = 'LISTED';
      invoice.listedAt = new Date();
      await invoice.save();

      // Send notification
      await notificationService.sendInvoiceListed(invoice._id);

      res.json({
        success: true,
        data: invoice
      });
    } catch (error) {
      console.error('List invoice error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list invoice',
        error: error.message
      });
    }
  }
);

// Upload document
router.post('/:id/documents',
  auth,
  upload.single('document'),
  param('id').isMongoId().withMessage('Invalid invoice ID'),
  [
    body('type').isIn(['INVOICE', 'CONTRACT', 'PAYMENT_PROOF', 'LEGAL_DOCUMENT', 'OTHER']).withMessage('Invalid document type'),
    body('description').optional().isLength({ max: 200 }).withMessage('Description too long')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const invoice = await Invoice.findById(req.params.id);
      
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      if (invoice.sellerId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const { type, description } = req.body;

      // Upload to HFS
      const hfsResult = await hfsService.uploadDocument({
        invoiceId: invoice._id,
        file: req.file,
        type,
        description,
        uploadedBy: req.user.id
      });

      // Add document to invoice
      invoice.documents.push({
        type,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        description,
        hfsFileId: hfsResult.fileId,
        uploadedAt: new Date(),
        uploadedBy: req.user.id
      });

      await invoice.save();

      res.json({
        success: true,
        data: {
          document: invoice.documents[invoice.documents.length - 1],
          hfsFileId: hfsResult.fileId
        }
      });
    } catch (error) {
      console.error('Upload document error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload document',
        error: error.message
      });
    }
  }
);

// Delete invoice
router.delete('/:id',
  auth,
  param('id').isMongoId().withMessage('Invalid invoice ID'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const invoice = await Invoice.findById(req.params.id);
      
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      if (invoice.sellerId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (!['DRAFT', 'REJECTED'].includes(invoice.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete invoice in current status'
        });
      }

      await Invoice.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: 'Invoice deleted successfully'
      });
    } catch (error) {
      console.error('Delete invoice error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete invoice',
        error: error.message
      });
    }
  }
);

module.exports = router;