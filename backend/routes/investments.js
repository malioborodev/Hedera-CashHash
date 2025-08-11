const express = require('express');
const router = express.Router();
const { body, validationResult, param } = require('express-validator');
const Investment = require('../models/Investment');
const Invoice = require('../models/Invoice');
const auth = require('../middleware/auth');
const { contractService } = require('../services/contractService');
const { htsService } = require('../services/htsService');
const { payoutService } = require('../services/payoutService');
const { notificationService } = require('../services/notificationService');
const { riskEngine } = require('../services/riskEngine');

// Create new investment
router.post('/',
  auth,
  [
    body('invoiceId').isMongoId().withMessage('Invalid invoice ID'),
    body('amountUSD').isFloat({ min: 1 }).withMessage('Investment amount must be greater than 0'),
    body('acceptRisk').isBoolean().withMessage('Risk acceptance is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (req.user.role !== 'INVESTOR') {
        return res.status(403).json({
          success: false,
          message: 'Only investors can create investments'
        });
      }

      const { invoiceId, amountUSD, acceptRisk } = req.body;

      // Validate invoice
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      if (!['LISTED', 'FUNDING'].includes(invoice.status)) {
        return res.status(400).json({
          success: false,
          message: 'Invoice is not available for investment'
        });
      }

      // Check if invoice is expired
      if (new Date() > invoice.maturityDate) {
        return res.status(400).json({
          success: false,
          message: 'Invoice has expired'
        });
      }

      // Check minimum investment
      const minInvestment = Math.max(100, invoice.amountUSD * 0.01); // Min $100 or 1% of invoice
      if (amountUSD < minInvestment) {
        return res.status(400).json({
          success: false,
          message: `Minimum investment is $${minInvestment}`
        });
      }

      // Check total investment limit
      const currentInvestments = await Investment.aggregate([
        { $match: { invoiceId: invoice._id, status: 'ACTIVE' } },
        { $group: { _id: null, total: { $sum: '$amountUSD' } } }
      ]);
      
      const totalInvested = currentInvestments[0]?.total || 0;
      const remainingAmount = invoice.amountUSD - totalInvested;
      
      if (amountUSD > remainingAmount) {
        return res.status(400).json({
          success: false,
          message: `Only $${remainingAmount} remaining for investment`
        });
      }

      // Check investor's existing investment in this invoice
      const existingInvestment = await Investment.findOne({
        invoiceId,
        investorId: req.user.id,
        status: 'ACTIVE'
      });

      if (existingInvestment) {
        return res.status(400).json({
          success: false,
          message: 'You already have an active investment in this invoice'
        });
      }

      // Risk validation
      if (!acceptRisk && invoice.riskGrade === 'HIGH') {
        return res.status(400).json({
          success: false,
          message: 'Risk acceptance required for high-risk investments'
        });
      }

      // Calculate expected return
      const expectedReturn = amountUSD + (amountUSD * invoice.yieldBps * invoice.tenorDays) / (10000 * 365);
      const tokenAmount = Math.floor(amountUSD * 100); // 100 tokens per USD

      // Create investment record
      const investment = new Investment({
        investorId: req.user.id,
        invoiceId,
        amountUSD,
        tokenAmount,
        expectedReturn,
        investmentDate: new Date(),
        status: 'PENDING'
      });

      await investment.save();

      // Record investment in smart contract
      const contractResult = await contractService.recordInvestment({
        invoiceId,
        investorId: req.user.id,
        amount: amountUSD
      });

      // Mint fractional tokens to investor
      const tokenResult = await htsService.mintTokensToInvestor({
        invoiceId,
        investorAddress: req.user.walletAddress,
        amount: tokenAmount
      });

      // Update investment with blockchain data
      investment.blockchainTxHash = contractResult.txHash;
      investment.tokenTxHash = tokenResult.txHash;
      investment.status = 'ACTIVE';
      await investment.save();

      // Update invoice status if fully funded
      const newTotalInvested = totalInvested + amountUSD;
      if (newTotalInvested >= invoice.amountUSD) {
        invoice.status = 'FUNDED';
        invoice.fundedAt = new Date();
      } else {
        invoice.status = 'FUNDING';
      }
      await invoice.save();

      // Send notifications
      await notificationService.sendInvestmentCreated(req.user.id, investment._id);
      await notificationService.sendInvestmentReceived(invoice.sellerId, investment._id);

      res.status(201).json({
        success: true,
        data: investment,
        blockchain: {
          contractTx: contractResult.txHash,
          tokenTx: tokenResult.txHash
        }
      });
    } catch (error) {
      console.error('Create investment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create investment',
        error: error.message
      });
    }
  }
);

// Get investor's investments
router.get('/my-investments',
  auth,
  async (req, res) => {
    try {
      if (req.user.role !== 'INVESTOR') {
        return res.status(403).json({
          success: false,
          message: 'Only investors can view investments'
        });
      }

      const {
        page = 1,
        limit = 10,
        status,
        sortBy = 'investmentDate',
        sortOrder = 'desc'
      } = req.query;

      const filter = { investorId: req.user.id };
      if (status) filter.status = status;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
        populate: [
          {
            path: 'invoiceId',
            select: 'buyerName amountUSD currency tenorDays yieldBps maturityDate status riskGrade',
            populate: {
              path: 'sellerId',
              select: 'name company'
            }
          }
        ]
      };

      const result = await Investment.paginate(filter, options);

      // Calculate portfolio metrics
      const portfolioMetrics = await Investment.aggregate([
        { $match: { investorId: req.user.id, status: 'ACTIVE' } },
        {
          $group: {
            _id: null,
            totalInvested: { $sum: '$amountUSD' },
            totalExpectedReturn: { $sum: '$expectedReturn' },
            totalInvestments: { $sum: 1 },
            avgYield: { $avg: '$expectedYield' }
          }
        }
      ]);

      res.json({
        success: true,
        data: result.docs,
        pagination: {
          currentPage: result.page,
          totalPages: result.totalPages,
          totalItems: result.totalDocs,
          hasNext: result.hasNextPage,
          hasPrev: result.hasPrevPage
        },
        portfolio: portfolioMetrics[0] || {
          totalInvested: 0,
          totalExpectedReturn: 0,
          totalInvestments: 0,
          avgYield: 0
        }
      });
    } catch (error) {
      console.error('Get investments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch investments',
        error: error.message
      });
    }
  }
);

// Get investments for a specific invoice
router.get('/invoice/:invoiceId',
  auth,
  param('invoiceId').isMongoId().withMessage('Invalid invoice ID'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const invoice = await Invoice.findById(req.params.invoiceId);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      // Check access permissions
      if (req.user.role === 'SELLER' && invoice.sellerId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const investments = await Investment.find({
        invoiceId: req.params.invoiceId,
        status: 'ACTIVE'
      }).populate('investorId', 'name email');

      // Calculate funding metrics
      const totalInvested = investments.reduce((sum, inv) => sum + inv.amountUSD, 0);
      const fundingPercentage = (totalInvested / invoice.amountUSD) * 100;
      const remainingAmount = invoice.amountUSD - totalInvested;

      res.json({
        success: true,
        data: investments,
        metrics: {
          totalInvested,
          targetAmount: invoice.amountUSD,
          fundingPercentage: Math.round(fundingPercentage * 100) / 100,
          remainingAmount,
          investorCount: investments.length
        }
      });
    } catch (error) {
      console.error('Get invoice investments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch invoice investments',
        error: error.message
      });
    }
  }
);

// Get single investment details
router.get('/:id',
  auth,
  param('id').isMongoId().withMessage('Invalid investment ID'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const investment = await Investment.findById(req.params.id)
        .populate('investorId', 'name email')
        .populate({
          path: 'invoiceId',
          populate: {
            path: 'sellerId',
            select: 'name company'
          }
        });

      if (!investment) {
        return res.status(404).json({
          success: false,
          message: 'Investment not found'
        });
      }

      // Check access permissions
      if (req.user.role === 'INVESTOR' && investment.investorId._id.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (req.user.role === 'SELLER' && investment.invoiceId.sellerId._id.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Get blockchain data
      const blockchainData = await contractService.getInvestmentDetails(investment._id);
      
      res.json({
        success: true,
        data: {
          ...investment.toObject(),
          blockchain: blockchainData
        }
      });
    } catch (error) {
      console.error('Get investment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch investment',
        error: error.message
      });
    }
  }
);

// Cancel investment (only if invoice not yet funded)
router.post('/:id/cancel',
  auth,
  param('id').isMongoId().withMessage('Invalid investment ID'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const investment = await Investment.findById(req.params.id).populate('invoiceId');
      
      if (!investment) {
        return res.status(404).json({
          success: false,
          message: 'Investment not found'
        });
      }

      if (investment.investorId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (investment.status !== 'ACTIVE') {
        return res.status(400).json({
          success: false,
          message: 'Investment cannot be cancelled'
        });
      }

      if (investment.invoiceId.status === 'FUNDED') {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel investment after invoice is funded'
        });
      }

      // Check cancellation window (e.g., 24 hours)
      const cancellationDeadline = new Date(investment.investmentDate);
      cancellationDeadline.setHours(cancellationDeadline.getHours() + 24);
      
      if (new Date() > cancellationDeadline) {
        return res.status(400).json({
          success: false,
          message: 'Cancellation period has expired'
        });
      }

      // Burn tokens
      await htsService.burnTokens({
        invoiceId: investment.invoiceId._id,
        amount: investment.tokenAmount
      });

      // Update investment status
      investment.status = 'CANCELLED';
      investment.cancelledAt = new Date();
      await investment.save();

      // Update invoice status if needed
      const remainingInvestments = await Investment.find({
        invoiceId: investment.invoiceId._id,
        status: 'ACTIVE'
      });
      
      if (remainingInvestments.length === 0) {
        investment.invoiceId.status = 'LISTED';
      } else {
        investment.invoiceId.status = 'FUNDING';
      }
      await investment.invoiceId.save();

      // Send notification
      await notificationService.sendInvestmentCancelled(req.user.id, investment._id);

      res.json({
        success: true,
        data: investment
      });
    } catch (error) {
      console.error('Cancel investment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel investment',
        error: error.message
      });
    }
  }
);

// Claim payout (after invoice payment)
router.post('/:id/claim',
  auth,
  param('id').isMongoId().withMessage('Invalid investment ID'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const investment = await Investment.findById(req.params.id).populate('invoiceId');
      
      if (!investment) {
        return res.status(404).json({
          success: false,
          message: 'Investment not found'
        });
      }

      if (investment.investorId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (investment.status !== 'ACTIVE') {
        return res.status(400).json({
          success: false,
          message: 'Investment is not active'
        });
      }

      if (investment.invoiceId.status !== 'PAID') {
        return res.status(400).json({
          success: false,
          message: 'Invoice has not been paid yet'
        });
      }

      if (investment.payoutClaimed) {
        return res.status(400).json({
          success: false,
          message: 'Payout already claimed'
        });
      }

      // Claim payout from smart contract
      const payoutResult = await payoutService.claimPayout({
        invoiceId: investment.invoiceId._id,
        investorAddress: req.user.walletAddress
      });

      // Update investment record
      investment.payoutClaimed = true;
      investment.payoutClaimedAt = new Date();
      investment.actualReturn = payoutResult.amount;
      investment.payoutTxHash = payoutResult.txHash;
      investment.status = 'COMPLETED';
      await investment.save();

      // Send notification
      await notificationService.sendPayoutClaimed(req.user.id, investment._id, payoutResult.amount);

      res.json({
        success: true,
        data: {
          investment,
          payout: {
            amount: payoutResult.amount,
            txHash: payoutResult.txHash
          }
        }
      });
    } catch (error) {
      console.error('Claim payout error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to claim payout',
        error: error.message
      });
    }
  }
);

// Get investment analytics
router.get('/analytics/portfolio',
  auth,
  async (req, res) => {
    try {
      if (req.user.role !== 'INVESTOR') {
        return res.status(403).json({
          success: false,
          message: 'Only investors can view portfolio analytics'
        });
      }

      const { timeframe = '30d' } = req.query;
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }

      // Portfolio overview
      const portfolioOverview = await Investment.aggregate([
        {
          $match: {
            investorId: req.user.id,
            investmentDate: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amountUSD' },
            totalExpectedReturn: { $sum: '$expectedReturn' },
            totalActualReturn: { $sum: '$actualReturn' }
          }
        }
      ]);

      // Performance by risk grade
      const riskPerformance = await Investment.aggregate([
        {
          $match: {
            investorId: req.user.id,
            status: { $in: ['ACTIVE', 'COMPLETED'] }
          }
        },
        {
          $lookup: {
            from: 'invoices',
            localField: 'invoiceId',
            foreignField: '_id',
            as: 'invoice'
          }
        },
        { $unwind: '$invoice' },
        {
          $group: {
            _id: '$invoice.riskGrade',
            count: { $sum: 1 },
            totalInvested: { $sum: '$amountUSD' },
            avgYield: { $avg: '$expectedYield' }
          }
        }
      ]);

      // Monthly investment trend
      const monthlyTrend = await Investment.aggregate([
        {
          $match: {
            investorId: req.user.id,
            investmentDate: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$investmentDate' },
              month: { $month: '$investmentDate' }
            },
            totalInvested: { $sum: '$amountUSD' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      res.json({
        success: true,
        data: {
          portfolioOverview,
          riskPerformance,
          monthlyTrend,
          timeframe
        }
      });
    } catch (error) {
      console.error('Get investment analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch investment analytics',
        error: error.message
      });
    }
  }
);

module.exports = router;