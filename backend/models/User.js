const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  // Basic information
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [8, 255],
      notEmpty: true
    }
  },
  
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      len: [1, 50],
      notEmpty: true,
      is: /^[A-Za-z\s]+$/
    }
  },
  
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      len: [1, 50],
      notEmpty: true,
      is: /^[A-Za-z\s]+$/
    }
  },
  
  // Contact information
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^[+]?[1-9]\d{1,14}$/
    }
  },
  
  // Hedera account information
  accountId: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      is: /^\d+\.\d+\.\d+$/,
      notEmpty: true
    }
  },
  
  publicKey: {
    type: DataTypes.STRING(64),
    allowNull: true,
    validate: {
      is: /^[a-fA-F0-9]{64}$/
    }
  },
  
  // Role and permissions
  role: {
    type: DataTypes.ENUM('admin', 'seller', 'buyer', 'investor', 'auditor'),
    allowNull: false,
    defaultValue: 'investor'
  },
  
  permissions: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  
  // Account status
  status: {
    type: DataTypes.ENUM('pending', 'active', 'suspended', 'banned', 'deleted'),
    allowNull: false,
    defaultValue: 'pending'
  },
  
  // Verification status
  emailVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  
  emailVerificationToken: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  emailVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  kycStatus: {
    type: DataTypes.ENUM('not_started', 'pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'not_started'
  },
  
  kycVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Security
  twoFactorEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  
  twoFactorSecret: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  passwordResetToken: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Login tracking
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  lastLoginIp: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  
  loginAttempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  
  lockedUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Profile information
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 500]
    }
  },
  
  website: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  
  // Business information (for sellers/buyers)
  companyName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [0, 100]
    }
  },
  
  companyRegistration: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: [0, 50]
    }
  },
  
  taxId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: [0, 50]
    }
  },
  
  // Address information
  address: {
    type: DataTypes.JSON,
    allowNull: true
  },
  
  // Financial information
  creditScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 300,
      max: 850
    }
  },
  
  riskProfile: {
    type: DataTypes.ENUM('conservative', 'moderate', 'aggressive'),
    allowNull: true
  },
  
  // Statistics
  totalInvestments: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  
  totalReturns: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  
  successfulInvestments: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  
  defaultedInvestments: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  
  // Preferences
  preferences: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      privacy: {
        showProfile: true,
        showInvestments: false
      },
      trading: {
        autoInvest: false,
        riskTolerance: 'moderate'
      }
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
  tableName: 'users',
  timestamps: true,
  paranoid: true, // Enable soft delete
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      unique: true,
      fields: ['accountId']
    },
    {
      fields: ['role']
    },
    {
      fields: ['status']
    },
    {
      fields: ['kycStatus']
    },
    {
      fields: ['emailVerified']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['lastLoginAt']
    }
  ],
  
  // Model options
  defaultScope: {
    attributes: {
      exclude: ['password', 'twoFactorSecret', 'passwordResetToken', 'emailVerificationToken', 'deletedAt']
    }
  },
  
  scopes: {
    withPassword: {
      attributes: {}
    },
    
    withDeleted: {
      paranoid: false
    },
    
    active: {
      where: {
        status: 'active'
      }
    },
    
    verified: {
      where: {
        emailVerified: true,
        kycStatus: 'approved'
      }
    },
    
    sellers: {
      where: {
        role: 'seller'
      }
    },
    
    buyers: {
      where: {
        role: 'buyer'
      }
    },
    
    investors: {
      where: {
        role: 'investor'
      }
    },
    
    admins: {
      where: {
        role: 'admin'
      }
    },
    
    suspended: {
      where: {
        status: 'suspended'
      }
    },
    
    locked: {
      where: {
        lockedUntil: {
          [sequelize.Sequelize.Op.gt]: new Date()
        }
      }
    }
  }
});

// Instance methods
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

User.prototype.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

User.prototype.isLocked = function() {
  return this.lockedUntil && this.lockedUntil > new Date();
};

User.prototype.incrementLoginAttempts = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockedUntil && this.lockedUntil < new Date()) {
    return this.update({
      loginAttempts: 1,
      lockedUntil: null
    });
  }
  
  const updates = { loginAttempts: this.loginAttempts + 1 };
  
  // Lock account after 5 failed attempts
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.lockedUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  }
  
  return this.update(updates);
};

User.prototype.resetLoginAttempts = async function() {
  return this.update({
    loginAttempts: 0,
    lockedUntil: null
  });
};

User.prototype.updateLastLogin = async function(ip) {
  return this.update({
    lastLoginAt: new Date(),
    lastLoginIp: ip
  });
};

User.prototype.hasPermission = function(permission) {
  if (this.role === 'admin') return true;
  return this.permissions && this.permissions.includes(permission);
};

User.prototype.addPermission = async function(permission) {
  const permissions = this.permissions || [];
  if (!permissions.includes(permission)) {
    permissions.push(permission);
    return this.update({ permissions });
  }
};

User.prototype.removePermission = async function(permission) {
  const permissions = this.permissions || [];
  const index = permissions.indexOf(permission);
  if (index > -1) {
    permissions.splice(index, 1);
    return this.update({ permissions });
  }
};

User.prototype.getInvestmentStats = function() {
  const totalInvestments = parseFloat(this.totalInvestments) || 0;
  const totalReturns = parseFloat(this.totalReturns) || 0;
  const successRate = this.successfulInvestments + this.defaultedInvestments > 0 
    ? (this.successfulInvestments / (this.successfulInvestments + this.defaultedInvestments)) * 100
    : 0;
  
  return {
    totalInvestments,
    totalReturns,
    netProfit: totalReturns - totalInvestments,
    successRate,
    totalTransactions: this.successfulInvestments + this.defaultedInvestments
  };
};

User.prototype.canInvest = function() {
  return this.status === 'active' && 
         this.emailVerified && 
         this.kycStatus === 'approved' && 
         !this.isLocked();
};

User.prototype.canSell = function() {
  return this.status === 'active' && 
         this.emailVerified && 
         this.kycStatus === 'approved' && 
         (this.role === 'seller' || this.role === 'admin') && 
         !this.isLocked();
};

User.prototype.canBuy = function() {
  return this.status === 'active' && 
         this.emailVerified && 
         this.kycStatus === 'approved' && 
         (this.role === 'buyer' || this.role === 'admin') && 
         !this.isLocked();
};

// Class methods
User.findByEmail = function(email) {
  return this.scope('withPassword').findOne({ where: { email } });
};

User.findByAccountId = function(accountId) {
  return this.findOne({ where: { accountId } });
};

User.findByEmailVerificationToken = function(token) {
  return this.findOne({ where: { emailVerificationToken: token } });
};

User.findByPasswordResetToken = function(token) {
  return this.scope('withPassword').findOne({
    where: {
      passwordResetToken: token,
      passwordResetExpires: {
        [sequelize.Sequelize.Op.gt]: new Date()
      }
    }
  });
};

User.getStatistics = async function() {
  const stats = await this.findAll({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalUsers'],
      [sequelize.fn('SUM', sequelize.col('totalInvestments')), 'totalInvestments'],
      [sequelize.fn('SUM', sequelize.col('totalReturns')), 'totalReturns'],
      [sequelize.fn('AVG', sequelize.col('creditScore')), 'averageCreditScore']
    ],
    raw: true
  });
  
  const roleStats = await this.findAll({
    attributes: [
      'role',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['role'],
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
    roleBreakdown: roleStats,
    statusBreakdown: statusStats
  };
};

// Hooks
User.beforeCreate(async (user) => {
  // Hash password
  if (user.password) {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
  }
  
  // Generate email verification token
  user.emailVerificationToken = require('crypto').randomBytes(32).toString('hex');
});

User.beforeUpdate(async (user) => {
  // Hash password if changed
  if (user.changed('password')) {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

User.afterCreate(async (user) => {
  console.log(`User ${user.email} created with ID ${user.id}`);
});

User.afterUpdate(async (user) => {
  // Log important status changes
  if (user.changed('status')) {
    console.log(`User ${user.email} status changed to ${user.status}`);
  }
  
  if (user.changed('kycStatus')) {
    console.log(`User ${user.email} KYC status changed to ${user.kycStatus}`);
  }
});

module.exports = User;