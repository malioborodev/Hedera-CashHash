const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Investment = sequelize.define('Investment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  // Related entities
  invoiceId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Invoices',
      key: 'id'
    }
  },
  
  investorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  
  // Investment details
  amount: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    validate: {
      min: 0.01,
      isDecimal: true
    }
  },
  
  currency: {
    type: DataTypes.ENUM('USD', 'EUR', 'GBP', 'HBAR', 'USDC', 'BTC', 'ETH'),
    allowNull: false,
    defaultValue: 'USD'
  },
  
  // Blockchain details
  investorAccountId: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      is: /^\d+\.\d+\.\d+$/
    }
  },
  
  transactionHash: {
    type: DataTypes.STRING(66),
    allowNull: true,
    validate: {
      is: /^0x[a-fA-F0-9]{64}$/
    }
  },
  
  tokenAmount: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  
  tokenId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  
  // Investment status
  status: {
    type: DataTypes.ENUM(
      'pending',
      'confirmed',
      'active',
      'matured',
      'cancelled',
      'defaulted'
    ),
    allowNull: false,
    defaultValue: 'pending'
  },
  
  // Returns and payments
  expectedReturn: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  
  actualReturn: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  
  returnRate: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: true,
    validate: {
      min: 0,
      max: 1
    }
  },
  
  // Dates
  investmentDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  
  maturityDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  payoutDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Risk assessment
  riskScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  
  riskCategory: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    allowNull: true
  },
  
  // Performance tracking
  performanceScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  
  // Fees
  platformFee: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  
  gasFee: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  
  // Cancellation details
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 500]
    }
  },
  
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  cancelledBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  
  // Metadata
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  },
  
  // Soft delete
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'investments',
  timestamps: true,
  paranoid: true, // Enable soft delete
  indexes: [
    {
      fields: ['invoiceId']
    },
    {
      fields: ['investorId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['investmentDate']
    },
    {
      fields: ['maturityDate']
    },
    {
      fields: ['amount']
    },
    {
      fields: ['riskScore']
    },
    {
      fields: ['returnRate']
    },
    {
      fields: ['investorAccountId']
    },
    {
      unique: true,
      fields: ['transactionHash'],
      where: {
        transactionHash: {
          [sequelize.Sequelize.Op.ne]: null
        }
      }
    }
  ],
  
  // Model options
  defaultScope: {
    attributes: {
      exclude: ['deletedAt']
    }
  },
  
  scopes: {
    withDeleted: {
      paranoid: false
    },
    
    active: {
      where: {
        status: ['confirmed', 'active']
      }
    },
    
    pending: {
      where: {
        status: 'pending'
      }
    },
    
    matured: {
      where: {
        status: 'matured'
      }
    },
    
    cancelled: {
      where: {
        status: 'cancelled'
      }
    },
    
    defaulted: {
      where: {
        status: 'defaulted'
      }
    },
    
    highRisk: {
      where: {
        riskScore: {
          [sequelize.Sequelize.Op.gte]: 70
        }
      }
    },
    
    lowRisk: {
      where: {
        riskScore: {
          [sequelize.Sequelize.Op.lt]: 30
        }
      }
    },
    
    profitable: {
      where: {
        actualReturn: {
          [sequelize.Sequelize.Op.gt]: sequelize.col('amount')
        }
      }
    }
  }
});

// Instance methods
Investment.prototype.calculateExpectedReturn = function(annualRate = 0.08) {
  if (!this.maturityDate) {
    return this.amount;
  }
  
  const investmentDays = Math.ceil(
    (new Date(this.maturityDate) - new Date(this.investmentDate)) / (1000 * 60 * 60 * 24)
  );
  
  const dailyRate = annualRate / 365;
  const expectedReturn = this.amount * (1 + (dailyRate * investmentDays));
  
  return Math.round(expectedReturn * 100) / 100;
};

Investment.prototype.calculateActualReturn = function() {
  return this.actualReturn - this.amount - this.platformFee - this.gasFee;
};

Investment.prototype.getReturnPercentage = function() {
  if (this.amount === 0) return 0;
  const netReturn = this.calculateActualReturn();
  return (netReturn / this.amount) * 100;
};

Investment.prototype.getDaysToMaturity = function() {
  if (!this.maturityDate) return null;
  
  const now = new Date();
  const maturity = new Date(this.maturityDate);
  const diffTime = maturity - now;
  
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

Investment.prototype.isMatured = function() {
  if (!this.maturityDate) return false;
  return new Date() >= new Date(this.maturityDate);
};

Investment.prototype.canBeCancelled = function() {
  return this.status === 'pending' || this.status === 'confirmed';
};

Investment.prototype.getInvestmentDuration = function() {
  const start = new Date(this.investmentDate);
  const end = this.payoutDate ? new Date(this.payoutDate) : new Date();
  
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
};

Investment.prototype.updatePerformanceScore = function() {
  if (this.status !== 'matured' && this.status !== 'defaulted') {
    return;
  }
  
  let score = 0;
  
  // Base score for completion
  if (this.status === 'matured') {
    score += 50;
  }
  
  // Return performance (0-30 points)
  const returnPercentage = this.getReturnPercentage();
  if (returnPercentage > 0) {
    score += Math.min(returnPercentage * 3, 30);
  }
  
  // Time performance (0-20 points)
  if (this.payoutDate && this.maturityDate) {
    const expectedDays = Math.ceil(
      (new Date(this.maturityDate) - new Date(this.investmentDate)) / (1000 * 60 * 60 * 24)
    );
    const actualDays = this.getInvestmentDuration();
    
    if (actualDays <= expectedDays) {
      score += 20;
    } else {
      const delay = actualDays - expectedDays;
      score += Math.max(20 - delay, 0);
    }
  }
  
  this.performanceScore = Math.min(score, 100);
};

// Class methods
Investment.findByInvestor = function(investorId, options = {}) {
  return this.findAll({
    where: { investorId },
    ...options
  });
};

Investment.findByInvoice = function(invoiceId, options = {}) {
  return this.findAll({
    where: { invoiceId },
    ...options
  });
};

Investment.findByAccountId = function(accountId, options = {}) {
  return this.findAll({
    where: { investorAccountId: accountId },
    ...options
  });
};

Investment.findMaturing = function(days = 7, options = {}) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.findAll({
    where: {
      maturityDate: {
        [sequelize.Sequelize.Op.lte]: futureDate
      },
      status: 'active'
    },
    ...options
  });
};

Investment.getPortfolioSummary = async function(investorId) {
  const investments = await this.findAll({
    where: { investorId },
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalInvestments'],
      [sequelize.fn('SUM', sequelize.col('amount')), 'totalInvested'],
      [sequelize.fn('SUM', sequelize.col('actualReturn')), 'totalReturns'],
      [sequelize.fn('AVG', sequelize.col('returnRate')), 'averageReturnRate'],
      [sequelize.fn('AVG', sequelize.col('riskScore')), 'averageRiskScore'],
      [sequelize.fn('AVG', sequelize.col('performanceScore')), 'averagePerformanceScore']
    ],
    raw: true
  });
  
  const statusBreakdown = await this.findAll({
    where: { investorId },
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
    ],
    group: ['status'],
    raw: true
  });
  
  return {
    ...investments[0],
    statusBreakdown
  };
};

Investment.getStatistics = async function() {
  const stats = await this.findAll({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalCount'],
      [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
      [sequelize.fn('AVG', sequelize.col('amount')), 'averageAmount'],
      [sequelize.fn('SUM', sequelize.col('actualReturn')), 'totalReturns'],
      [sequelize.fn('AVG', sequelize.col('returnRate')), 'averageReturnRate'],
      [sequelize.fn('AVG', sequelize.col('riskScore')), 'averageRiskScore']
    ],
    raw: true
  });
  
  const statusStats = await this.findAll({
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['status'],
    raw: true
  });
  
  return {
    ...stats[0],
    statusBreakdown: statusStats
  };
};

// Hooks
Investment.beforeCreate(async (investment) => {
  // Calculate expected return if not provided
  if (!investment.expectedReturn && investment.maturityDate) {
    investment.expectedReturn = investment.calculateExpectedReturn();
  }
  
  // Set maturity date if not provided (default to invoice due date)
  if (!investment.maturityDate) {
    const Invoice = require('./Invoice');
    const invoice = await Invoice.findByPk(investment.invoiceId);
    if (invoice) {
      investment.maturityDate = invoice.dueDate;
    }
  }
});

Investment.beforeUpdate(async (investment) => {
  // Update performance score when status changes to matured or defaulted
  if (investment.changed('status') && 
      (investment.status === 'matured' || investment.status === 'defaulted')) {
    investment.updatePerformanceScore();
  }
});

Investment.afterCreate(async (investment) => {
  // Update invoice investment totals
  const Invoice = require('./Invoice');
  const invoice = await Invoice.findByPk(investment.invoiceId);
  if (invoice) {
    await invoice.increment({
      totalInvestment: investment.amount,
      investmentCount: 1
    });
  }
  
  console.log(`Investment ${investment.id} created for amount ${investment.amount}`);
});

Investment.afterUpdate(async (investment) => {
  // Log status changes
  if (investment.changed('status')) {
    console.log(`Investment ${investment.id} status changed to ${investment.status}`);
  }
});

Investment.afterDestroy(async (investment) => {
  // Update invoice investment totals when investment is cancelled
  if (investment.status !== 'cancelled') {
    const Invoice = require('./Invoice');
    const invoice = await Invoice.findByPk(investment.invoiceId);
    if (invoice) {
      await invoice.decrement({
        totalInvestment: investment.amount,
        investmentCount: 1
      });
    }
  }
});

module.exports = Investment;