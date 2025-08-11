const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  // Basic invoice information
  invoiceNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      is: /^[A-Za-z0-9-_]+$/
    }
  },
  
  // Parties involved
  sellerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  
  buyerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  
  // Financial details
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
  
  // Dates
  issueDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true,
      isAfter: new Date().toISOString()
    }
  },
  
  // Invoice content
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [10, 1000]
    }
  },
  
  terms: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 2000]
    }
  },
  
  // Status tracking
  status: {
    type: DataTypes.ENUM(
      'draft',
      'pending_review',
      'approved',
      'rejected',
      'listed',
      'funded',
      'paid',
      'defaulted',
      'cancelled'
    ),
    allowNull: false,
    defaultValue: 'draft'
  },
  
  // Review information
  reviewedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  reviewNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 500]
    }
  },
  
  // Blockchain integration
  contractAddress: {
    type: DataTypes.STRING(42),
    allowNull: true,
    validate: {
      is: /^0x[a-fA-F0-9]{40}$/
    }
  },
  
  tokenId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  
  transactionHash: {
    type: DataTypes.STRING(66),
    allowNull: true,
    validate: {
      is: /^0x[a-fA-F0-9]{64}$/
    }
  },
  
  // Investment tracking
  totalInvestment: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  
  investmentCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  
  fundingGoal: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: true,
    validate: {
      min: 0
    }
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
  
  riskFactors: {
    type: DataTypes.JSON,
    allowNull: true
  },
  
  // Payment tracking
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'partial', 'paid', 'overdue', 'defaulted'),
    allowNull: false,
    defaultValue: 'pending'
  },
  
  paidAmount: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true
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
  tableName: 'invoices',
  timestamps: true,
  paranoid: true, // Enable soft delete
  indexes: [
    {
      fields: ['sellerId']
    },
    {
      fields: ['buyerId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['dueDate']
    },
    {
      fields: ['amount']
    },
    {
      fields: ['currency']
    },
    {
      fields: ['riskScore']
    },
    {
      fields: ['createdAt']
    },
    {
      unique: true,
      fields: ['invoiceNumber']
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
        status: ['approved', 'listed', 'funded']
      }
    },
    
    pending: {
      where: {
        status: 'pending_review'
      }
    },
    
    funded: {
      where: {
        status: 'funded'
      }
    },
    
    overdue: {
      where: {
        dueDate: {
          [sequelize.Sequelize.Op.lt]: new Date()
        },
        paymentStatus: ['pending', 'partial']
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
    }
  }
});

// Instance methods
Invoice.prototype.isOverdue = function() {
  return new Date() > this.dueDate && this.paymentStatus !== 'paid';
};

Invoice.prototype.getDaysUntilDue = function() {
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

Invoice.prototype.getFundingProgress = function() {
  if (!this.fundingGoal || this.fundingGoal === 0) {
    return this.totalInvestment > 0 ? 100 : 0;
  }
  return Math.min((this.totalInvestment / this.fundingGoal) * 100, 100);
};

Invoice.prototype.isFullyFunded = function() {
  if (!this.fundingGoal) {
    return this.totalInvestment >= this.amount;
  }
  return this.totalInvestment >= this.fundingGoal;
};

Invoice.prototype.getRemainingAmount = function() {
  const target = this.fundingGoal || this.amount;
  return Math.max(target - this.totalInvestment, 0);
};

Invoice.prototype.canBeInvested = function() {
  return this.status === 'listed' && !this.isFullyFunded() && !this.isOverdue();
};

Invoice.prototype.updatePaymentStatus = function() {
  if (this.paidAmount >= this.amount) {
    this.paymentStatus = 'paid';
    this.status = 'paid';
    this.paidAt = new Date();
  } else if (this.paidAmount > 0) {
    this.paymentStatus = 'partial';
  } else if (this.isOverdue()) {
    this.paymentStatus = 'overdue';
    // Check if it should be marked as defaulted (e.g., 30 days overdue)
    const daysPastDue = Math.abs(this.getDaysUntilDue());
    if (daysPastDue > 30) {
      this.paymentStatus = 'defaulted';
      this.status = 'defaulted';
    }
  }
};

// Class methods
Invoice.findByInvoiceNumber = function(invoiceNumber) {
  return this.findOne({ where: { invoiceNumber } });
};

Invoice.findBySeller = function(sellerId, options = {}) {
  return this.findAll({
    where: { sellerId },
    ...options
  });
};

Invoice.findByBuyer = function(buyerId, options = {}) {
  return this.findAll({
    where: { buyerId },
    ...options
  });
};

Invoice.findOverdue = function(options = {}) {
  return this.scope('overdue').findAll(options);
};

Invoice.findByRiskRange = function(minRisk, maxRisk, options = {}) {
  return this.findAll({
    where: {
      riskScore: {
        [sequelize.Sequelize.Op.between]: [minRisk, maxRisk]
      }
    },
    ...options
  });
};

Invoice.getStatistics = async function() {
  const stats = await this.findAll({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalCount'],
      [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
      [sequelize.fn('AVG', sequelize.col('amount')), 'averageAmount'],
      [sequelize.fn('SUM', sequelize.col('totalInvestment')), 'totalInvestment'],
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
Invoice.beforeCreate(async (invoice) => {
  // Set funding goal to invoice amount if not specified
  if (!invoice.fundingGoal) {
    invoice.fundingGoal = invoice.amount;
  }
});

Invoice.beforeUpdate(async (invoice) => {
  // Update payment status when amount changes
  if (invoice.changed('paidAmount')) {
    invoice.updatePaymentStatus();
  }
});

Invoice.afterCreate(async (invoice) => {
  // Log invoice creation
  console.log(`Invoice ${invoice.invoiceNumber} created with ID ${invoice.id}`);
});

Invoice.afterUpdate(async (invoice) => {
  // Log status changes
  if (invoice.changed('status')) {
    console.log(`Invoice ${invoice.invoiceNumber} status changed to ${invoice.status}`);
  }
});

module.exports = Invoice;