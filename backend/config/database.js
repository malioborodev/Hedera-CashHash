const { Sequelize } = require('sequelize');
const config = require('./config');
const logger = require('../middleware/logger');

// Database configuration
const dbConfig = {
  host: config.database.host,
  port: config.database.port,
  dialect: config.database.dialect,
  database: config.database.name,
  username: config.database.username,
  password: config.database.password,
  
  // Connection pool configuration
  pool: {
    max: config.database.pool.max,
    min: config.database.pool.min,
    acquire: config.database.pool.acquire,
    idle: config.database.pool.idle
  },
  
  // Logging configuration
  logging: config.isDevelopment() ? 
    (msg) => logger.debug('Database Query:', { query: msg }) : false,
  
  // Timezone configuration
  timezone: '+00:00', // UTC
  
  // Additional options
  define: {
    // Use camelCase for automatically added attributes
    underscored: false,
    
    // Don't delete database entries but set the newly added attribute deletedAt to the current date
    paranoid: true,
    
    // Don't use createdAt/updatedAt timestamps
    timestamps: true,
    
    // Disable the modification of table names
    freezeTableName: true,
    
    // Define charset and collation for MySQL
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  },
  
  // Query options
  query: {
    // Set the default transaction isolation level
    isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
  },
  
  // Retry configuration
  retry: {
    max: 3,
    match: [
      /ETIMEDOUT/,
      /EHOSTUNREACH/,
      /ECONNRESET/,
      /ECONNREFUSED/,
      /ENOTFOUND/,
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/
    ]
  }
};

// SSL configuration for production
if (config.isProduction() && config.database.ssl) {
  dbConfig.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  };
}

// Create Sequelize instance
const sequelize = new Sequelize(dbConfig);

// Connection event handlers
sequelize.addHook('beforeConnect', (config) => {
  logger.info('Attempting to connect to database', {
    host: config.host,
    port: config.port,
    database: config.database,
    username: config.username
  });
});

sequelize.addHook('afterConnect', (connection, config) => {
  logger.info('Successfully connected to database', {
    host: config.host,
    port: config.port,
    database: config.database
  });
});

sequelize.addHook('beforeDisconnect', (connection) => {
  logger.info('Disconnecting from database');
});

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully');
    return true;
  } catch (error) {
    logger.error('Unable to connect to the database:', {
      error: error.message,
      stack: error.stack
    });
    return false;
  }
};

// Initialize database
const initializeDatabase = async () => {
  try {
    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }
    
    // Import models
    const User = require('../models/User');
    const Invoice = require('../models/Invoice');
    const Investment = require('../models/Investment');
    
    // Define associations
    defineAssociations();
    
    // Sync database in development
    if (config.isDevelopment()) {
      await sequelize.sync({ alter: true });
      logger.info('Database synchronized successfully');
    }
    
    return true;
  } catch (error) {
    logger.error('Failed to initialize database:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Define model associations
const defineAssociations = () => {
  const User = require('../models/User');
  const Invoice = require('../models/Invoice');
  const Investment = require('../models/Investment');
  
  // User associations
  User.hasMany(Invoice, {
    as: 'sellerInvoices',
    foreignKey: 'sellerId',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  });
  
  User.hasMany(Invoice, {
    as: 'buyerInvoices',
    foreignKey: 'buyerId',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  });
  
  User.hasMany(Invoice, {
    as: 'reviewedInvoices',
    foreignKey: 'reviewedBy',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  });
  
  User.hasMany(Investment, {
    as: 'investments',
    foreignKey: 'investorId',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  });
  
  User.hasMany(Investment, {
    as: 'cancelledInvestments',
    foreignKey: 'cancelledBy',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  });
  
  // Invoice associations
  Invoice.belongsTo(User, {
    as: 'seller',
    foreignKey: 'sellerId',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  });
  
  Invoice.belongsTo(User, {
    as: 'buyer',
    foreignKey: 'buyerId',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  });
  
  Invoice.belongsTo(User, {
    as: 'reviewer',
    foreignKey: 'reviewedBy',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  });
  
  Invoice.hasMany(Investment, {
    as: 'investments',
    foreignKey: 'invoiceId',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  });
  
  // Investment associations
  Investment.belongsTo(User, {
    as: 'investor',
    foreignKey: 'investorId',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  });
  
  Investment.belongsTo(User, {
    as: 'cancelledByUser',
    foreignKey: 'cancelledBy',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  });
  
  Investment.belongsTo(Invoice, {
    as: 'invoice',
    foreignKey: 'invoiceId',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  });
};

// Database health check
const healthCheck = async () => {
  try {
    await sequelize.authenticate();
    
    // Get connection pool status
    const pool = sequelize.connectionManager.pool;
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        host: config.database.host,
        port: config.database.port,
        name: config.database.name,
        dialect: config.database.dialect
      },
      pool: {
        size: pool.size,
        available: pool.available,
        using: pool.using,
        waiting: pool.waiting
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
};

// Graceful shutdown
const closeConnection = async () => {
  try {
    await sequelize.close();
    logger.info('Database connection closed successfully');
  } catch (error) {
    logger.error('Error closing database connection:', {
      error: error.message,
      stack: error.stack
    });
  }
};

// Transaction helper
const withTransaction = async (callback) => {
  const transaction = await sequelize.transaction();
  
  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Query performance monitoring
const monitorQueries = () => {
  if (config.isDevelopment()) {
    sequelize.addHook('beforeQuery', (options) => {
      options.startTime = Date.now();
    });
    
    sequelize.addHook('afterQuery', (options) => {
      const duration = Date.now() - options.startTime;
      
      if (duration > 1000) { // Log slow queries (>1s)
        logger.warn('Slow query detected', {
          duration: `${duration}ms`,
          sql: options.sql,
          bind: options.bind
        });
      }
    });
  }
};

// Initialize query monitoring
monitorQueries();

// Export sequelize instance and utilities
module.exports = sequelize;
module.exports.testConnection = testConnection;
module.exports.initializeDatabase = initializeDatabase;
module.exports.defineAssociations = defineAssociations;
module.exports.healthCheck = healthCheck;
module.exports.closeConnection = closeConnection;
module.exports.withTransaction = withTransaction;
module.exports.Sequelize = Sequelize;

// Handle process termination
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, closing database connection...');
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, closing database connection...');
  await closeConnection();
  process.exit(0);
});