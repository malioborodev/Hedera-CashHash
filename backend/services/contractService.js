const { ethers } = require('ethers');
const { Client, PrivateKey, AccountId, ContractExecuteTransaction, ContractCallQuery, Hbar } = require('@hashgraph/sdk');
const config = require('../config/config');

// Contract ABIs (simplified - would be imported from compiled contracts)
const INVOICE_ABI = [
  'function createInvoice(uint256 invoiceId, address seller, string buyerName, uint256 amountUSD, uint256 tenorDays, uint256 yieldBps, uint256 maturityDate) external',
  'function getInvoiceTerms(uint256 invoiceId) external view returns (tuple(address seller, string buyerName, uint256 amountUSD, string currency, uint256 tenorDays, uint256 yieldBps, uint256 maturityDate, bool isActive))',
  'function enableListing(uint256 invoiceId) external',
  'function addDocument(uint256 invoiceId, string docType, bytes32 docHash, string ipfsHash) external',
  'function mintFractionalTokens(uint256 invoiceId, address investor, uint256 amount) external',
  'event InvoiceCreated(uint256 indexed invoiceId, address indexed seller, uint256 amountUSD, uint256 maturityDate)',
  'event ListingEnabled(uint256 indexed invoiceId, uint256 timestamp)',
  'event DocumentAdded(uint256 indexed invoiceId, string docType, bytes32 docHash)'
];

const PAYOUT_ABI = [
  'function recordInvestment(uint256 invoiceId, address investor, uint256 amount) external',
  'function recordBuyerPayment(uint256 invoiceId, uint256 paidAmountUSD, string paymentReference) external',
  'function settle(uint256 invoiceId) external payable',
  'function claimPayout(uint256 invoiceId) external',
  'function markDefault(uint256 invoiceId) external',
  'function getPayment(uint256 invoiceId) external view returns (tuple(uint256 totalAmountUSD, uint256 paidAmountUSD, uint8 status, uint256 recordedAt, string paymentReference, bool isSettled))',
  'function getInvestorShare(uint256 invoiceId, address investor) external view returns (tuple(address investor, uint256 investedAmount, uint256 sharePercentage, bool hasClaimed, uint256 claimableAmount))',
  'function getTotalInvested(uint256 invoiceId) external view returns (uint256)',
  'function isInvoiceDefaulted(uint256 invoiceId) external view returns (bool)',
  'event PaymentRecorded(uint256 indexed invoiceId, uint256 paidAmount, uint256 totalAmount, string paymentReference, uint256 timestamp)',
  'event InvestmentRecorded(uint256 indexed invoiceId, address indexed investor, uint256 amount, uint256 sharePercentage)',
  'event PayoutSettled(uint256 indexed invoiceId, uint256 totalPayout, uint256 platformFee, uint256 investorCount, uint256 timestamp)',
  'event InvestorClaimed(uint256 indexed invoiceId, address indexed investor, uint256 amount, uint256 timestamp)'
];

const BOND_ABI = [
  'function postBond(uint256 invoiceId) external payable',
  'function refundBond(uint256 invoiceId) external',
  'function slashBond(uint256 invoiceId) external',
  'function getBondInfo(uint256 invoiceId) external view returns (tuple(address seller, uint256 amount, uint256 postedAt, bool isActive, bool isSlashed))',
  'function calculateBondAmount(uint256 invoiceAmountUSD) external view returns (uint256)',
  'event BondPosted(uint256 indexed invoiceId, address indexed seller, uint256 amount, uint256 timestamp)',
  'event BondRefunded(uint256 indexed invoiceId, address indexed seller, uint256 amount, uint256 timestamp)',
  'event BondSlashed(uint256 indexed invoiceId, address indexed seller, uint256 amount, uint256 timestamp)'
];

class ContractService {
  constructor() {
    this.client = null;
    this.provider = null;
    this.signer = null;
    this.contracts = {
      invoice: null,
      payout: null,
      bond: null,
      hts: null,
      hfs: null
    };
    this.initialized = false;
  }

  async initialize() {
    try {
      if (this.initialized) return;

      // Initialize Hedera client
      this.client = Client.forTestnet(); // or Client.forMainnet() for production
      this.client.setOperator(
        AccountId.fromString(config.hedera.accountId),
        PrivateKey.fromString(config.hedera.privateKey)
      );

      // Initialize ethers provider for contract interactions
      this.provider = new ethers.providers.JsonRpcProvider(config.hedera.jsonRpcUrl);
      this.signer = new ethers.Wallet(config.hedera.privateKey, this.provider);

      // Initialize contract instances
      this.contracts.invoice = new ethers.Contract(
        config.contracts.invoiceAddress,
        INVOICE_ABI,
        this.signer
      );

      this.contracts.payout = new ethers.Contract(
        config.contracts.payoutAddress,
        PAYOUT_ABI,
        this.signer
      );

      this.contracts.bond = new ethers.Contract(
        config.contracts.bondAddress,
        BOND_ABI,
        this.signer
      );

      this.initialized = true;
      console.log('Contract service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize contract service:', error);
      throw error;
    }
  }

  async createInvoice(invoiceData) {
    try {
      await this.ensureInitialized();

      const {
        invoiceId,
        sellerId,
        buyerName,
        amountUSD,
        tenorDays,
        yieldBps,
        maturityDate
      } = invoiceData;

      // Convert amounts to proper units
      const amountInWei = ethers.utils.parseEther(amountUSD.toString());
      const maturityTimestamp = Math.floor(maturityDate / 1000);

      // Execute contract transaction
      const tx = await this.contracts.invoice.createInvoice(
        invoiceId,
        sellerId,
        buyerName,
        amountInWei,
        tenorDays,
        yieldBps,
        maturityTimestamp,
        {
          gasLimit: 500000
        }
      );

      const receipt = await tx.wait();

      // Parse events
      const invoiceCreatedEvent = receipt.events?.find(
        event => event.event === 'InvoiceCreated'
      );

      return {
        success: true,
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        contractAddress: this.contracts.invoice.address,
        gasUsed: receipt.gasUsed.toString(),
        event: invoiceCreatedEvent?.args
      };
    } catch (error) {
      console.error('Create invoice contract error:', error);
      throw new Error(`Contract transaction failed: ${error.message}`);
    }
  }

  async getInvoiceDetails(invoiceId) {
    try {
      await this.ensureInitialized();

      const terms = await this.contracts.invoice.getInvoiceTerms(invoiceId);
      const payment = await this.contracts.payout.getPayment(invoiceId);
      const totalInvested = await this.contracts.payout.getTotalInvested(invoiceId);
      const isDefaulted = await this.contracts.payout.isInvoiceDefaulted(invoiceId);

      return {
        terms: {
          seller: terms.seller,
          buyerName: terms.buyerName,
          amountUSD: ethers.utils.formatEther(terms.amountUSD),
          currency: terms.currency,
          tenorDays: terms.tenorDays.toNumber(),
          yieldBps: terms.yieldBps.toNumber(),
          maturityDate: new Date(terms.maturityDate.toNumber() * 1000),
          isActive: terms.isActive
        },
        payment: {
          totalAmountUSD: ethers.utils.formatEther(payment.totalAmountUSD),
          paidAmountUSD: ethers.utils.formatEther(payment.paidAmountUSD),
          status: payment.status,
          recordedAt: new Date(payment.recordedAt.toNumber() * 1000),
          paymentReference: payment.paymentReference,
          isSettled: payment.isSettled
        },
        totalInvested: ethers.utils.formatEther(totalInvested),
        isDefaulted
      };
    } catch (error) {
      console.error('Get invoice details error:', error);
      throw new Error(`Failed to fetch invoice details: ${error.message}`);
    }
  }

  async enableListing(invoiceId) {
    try {
      await this.ensureInitialized();

      const tx = await this.contracts.invoice.enableListing(invoiceId, {
        gasLimit: 200000
      });

      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Enable listing error:', error);
      throw new Error(`Failed to enable listing: ${error.message}`);
    }
  }

  async recordInvestment(investmentData) {
    try {
      await this.ensureInitialized();

      const { invoiceId, investorId, amount } = investmentData;
      const amountInWei = ethers.utils.parseEther(amount.toString());

      const tx = await this.contracts.payout.recordInvestment(
        invoiceId,
        investorId,
        amountInWei,
        {
          gasLimit: 300000
        }
      );

      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Record investment error:', error);
      throw new Error(`Failed to record investment: ${error.message}`);
    }
  }

  async recordBuyerPayment(paymentData) {
    try {
      await this.ensureInitialized();

      const { invoiceId, paidAmountUSD, paymentReference } = paymentData;
      const amountInWei = ethers.utils.parseEther(paidAmountUSD.toString());

      const tx = await this.contracts.payout.recordBuyerPayment(
        invoiceId,
        amountInWei,
        paymentReference,
        {
          gasLimit: 300000
        }
      );

      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Record buyer payment error:', error);
      throw new Error(`Failed to record payment: ${error.message}`);
    }
  }

  async settlePayout(settleData) {
    try {
      await this.ensureInitialized();

      const { invoiceId, payoutAmount } = settleData;
      const payoutInWei = ethers.utils.parseEther(payoutAmount.toString());

      const tx = await this.contracts.payout.settle(invoiceId, {
        value: payoutInWei,
        gasLimit: 500000
      });

      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Settle payout error:', error);
      throw new Error(`Failed to settle payout: ${error.message}`);
    }
  }

  async claimPayout(claimData) {
    try {
      await this.ensureInitialized();

      const { invoiceId } = claimData;

      const tx = await this.contracts.payout.claimPayout(invoiceId, {
        gasLimit: 300000
      });

      const receipt = await tx.wait();

      // Parse claim event to get amount
      const claimEvent = receipt.events?.find(
        event => event.event === 'InvestorClaimed'
      );

      const claimedAmount = claimEvent?.args?.amount
        ? ethers.utils.formatEther(claimEvent.args.amount)
        : '0';

      return {
        success: true,
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        amount: claimedAmount
      };
    } catch (error) {
      console.error('Claim payout error:', error);
      throw new Error(`Failed to claim payout: ${error.message}`);
    }
  }

  async postBond(bondData) {
    try {
      await this.ensureInitialized();

      const { invoiceId, bondAmount } = bondData;
      const bondInWei = ethers.utils.parseEther(bondAmount.toString());

      const tx = await this.contracts.bond.postBond(invoiceId, {
        value: bondInWei,
        gasLimit: 300000
      });

      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Post bond error:', error);
      throw new Error(`Failed to post bond: ${error.message}`);
    }
  }

  async getBondInfo(invoiceId) {
    try {
      await this.ensureInitialized();

      const bondInfo = await this.contracts.bond.getBondInfo(invoiceId);

      return {
        seller: bondInfo.seller,
        amount: ethers.utils.formatEther(bondInfo.amount),
        postedAt: new Date(bondInfo.postedAt.toNumber() * 1000),
        isActive: bondInfo.isActive,
        isSlashed: bondInfo.isSlashed
      };
    } catch (error) {
      console.error('Get bond info error:', error);
      throw new Error(`Failed to get bond info: ${error.message}`);
    }
  }

  async calculateBondAmount(invoiceAmountUSD) {
    try {
      await this.ensureInitialized();

      const amountInWei = ethers.utils.parseEther(invoiceAmountUSD.toString());
      const bondAmount = await this.contracts.bond.calculateBondAmount(amountInWei);

      return ethers.utils.formatEther(bondAmount);
    } catch (error) {
      console.error('Calculate bond amount error:', error);
      throw new Error(`Failed to calculate bond amount: ${error.message}`);
    }
  }

  async markDefault(invoiceId) {
    try {
      await this.ensureInitialized();

      const tx = await this.contracts.payout.markDefault(invoiceId, {
        gasLimit: 300000
      });

      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Mark default error:', error);
      throw new Error(`Failed to mark default: ${error.message}`);
    }
  }

  async getInvestorShare(invoiceId, investorAddress) {
    try {
      await this.ensureInitialized();

      const share = await this.contracts.payout.getInvestorShare(invoiceId, investorAddress);

      return {
        investor: share.investor,
        investedAmount: ethers.utils.formatEther(share.investedAmount),
        sharePercentage: share.sharePercentage.toNumber() / 100, // Convert from basis points
        hasClaimed: share.hasClaimed,
        claimableAmount: ethers.utils.formatEther(share.claimableAmount)
      };
    } catch (error) {
      console.error('Get investor share error:', error);
      throw new Error(`Failed to get investor share: ${error.message}`);
    }
  }

  async addDocument(documentData) {
    try {
      await this.ensureInitialized();

      const { invoiceId, docType, docHash, ipfsHash } = documentData;

      const tx = await this.contracts.invoice.addDocument(
        invoiceId,
        docType,
        docHash,
        ipfsHash,
        {
          gasLimit: 200000
        }
      );

      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Add document error:', error);
      throw new Error(`Failed to add document: ${error.message}`);
    }
  }

  async getContractEvents(contractName, eventName, fromBlock = 0, toBlock = 'latest') {
    try {
      await this.ensureInitialized();

      const contract = this.contracts[contractName];
      if (!contract) {
        throw new Error(`Contract ${contractName} not found`);
      }

      const filter = contract.filters[eventName]();
      const events = await contract.queryFilter(filter, fromBlock, toBlock);

      return events.map(event => ({
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        args: event.args,
        timestamp: event.blockTimestamp
      }));
    } catch (error) {
      console.error('Get contract events error:', error);
      throw new Error(`Failed to get events: ${error.message}`);
    }
  }

  async getTransactionStatus(txHash) {
    try {
      await this.ensureInitialized();

      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return { status: 'pending' };
      }

      return {
        status: receipt.status === 1 ? 'success' : 'failed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        confirmations: receipt.confirmations
      };
    } catch (error) {
      console.error('Get transaction status error:', error);
      throw new Error(`Failed to get transaction status: ${error.message}`);
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  // Utility methods
  formatAmount(amount) {
    return ethers.utils.formatEther(amount);
  }

  parseAmount(amount) {
    return ethers.utils.parseEther(amount.toString());
  }

  isValidAddress(address) {
    return ethers.utils.isAddress(address);
  }

  async getGasPrice() {
    try {
      await this.ensureInitialized();
      const gasPrice = await this.provider.getGasPrice();
      return ethers.utils.formatUnits(gasPrice, 'gwei');
    } catch (error) {
      console.error('Get gas price error:', error);
      return '20'; // Default gas price in gwei
    }
  }

  async estimateGas(contractName, methodName, params = []) {
    try {
      await this.ensureInitialized();
      
      const contract = this.contracts[contractName];
      if (!contract) {
        throw new Error(`Contract ${contractName} not found`);
      }

      const gasEstimate = await contract.estimateGas[methodName](...params);
      return gasEstimate.toString();
    } catch (error) {
      console.error('Estimate gas error:', error);
      return '500000'; // Default gas limit
    }
  }
}

module.exports = new ContractService();