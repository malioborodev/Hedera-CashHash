require('dotenv').config();

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || 'localhost',
    environment: process.env.NODE_ENV || 'development'
  },

  // Frontend configuration
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000'
  },

  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'cashhash',
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    dialect: process.env.DB_DIALECT || 'postgres',
    logging: process.env.DB_LOGGING === 'true',
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      min: parseInt(process.env.DB_POOL_MIN) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000
    }
  },

  // Hedera configuration
  hedera: {
    accountId: process.env.HEDERA_ACCOUNT_ID,
    privateKey: process.env.HEDERA_PRIVATE_KEY,
    network: process.env.HEDERA_NETWORK || 'testnet',
    jsonRpcUrl: process.env.HEDERA_JSON_RPC_URL || 'https://testnet.hashio.io/api',
    mirrorNodeUrl: process.env.HEDERA_MIRROR_NODE_URL || 'https://testnet.mirrornode.hedera.com'
  },

  // Smart contract addresses
  contracts: {
    invoiceAddress: process.env.CONTRACT_INVOICE_ADDRESS,
    payoutAddress: process.env.CONTRACT_PAYOUT_ADDRESS,
    bondAddress: process.env.CONTRACT_BOND_ADDRESS,
    htsAddress: process.env.CONTRACT_HTS_ADDRESS,
    hfsAddress: process.env.CONTRACT_HFS_ADDRESS
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  // Email configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    fromName: process.env.EMAIL_FROM_NAME || 'CashHash',
    fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@cashhash.com'
  },

  // Redis configuration (for caching and sessions)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB) || 0,
    ttl: parseInt(process.env.REDIS_TTL) || 3600 // 1 hour
  },

  // File upload configuration
  upload: {
    maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'text/csv'
    ],
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    tempDir: process.env.TEMP_DIR || './temp'
  },

  // Security configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100, // requests per window
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret',
    encryptionKey: process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key!'
  },

  // Risk engine configuration
  riskEngine: {
    maxInvoiceAmount: parseInt(process.env.RISK_MAX_INVOICE_AMOUNT) || 1000000, // $1M
    minInvoiceAmount: parseInt(process.env.RISK_MIN_INVOICE_AMOUNT) || 1000, // $1K
    maxTenorDays: parseInt(process.env.RISK_MAX_TENOR_DAYS) || 365, // 1 year
    minTenorDays: parseInt(process.env.RISK_MIN_TENOR_DAYS) || 30, // 30 days
    maxYieldBps: parseInt(process.env.RISK_MAX_YIELD_BPS) || 5000, // 50%
    minYieldBps: parseInt(process.env.RISK_MIN_YIELD_BPS) || 100, // 1%
    defaultRiskScore: parseFloat(process.env.RISK_DEFAULT_SCORE) || 0.5,
    riskThresholds: {
      low: parseFloat(process.env.RISK_THRESHOLD_LOW) || 0.3,
      medium: parseFloat(process.env.RISK_THRESHOLD_MEDIUM) || 0.6,
      high: parseFloat(process.env.RISK_THRESHOLD_HIGH) || 0.8
    }
  },

  // Bond configuration
  bond: {
    minBondPercentage: parseFloat(process.env.BOND_MIN_PERCENTAGE) || 0.05, // 5%
    maxBondPercentage: parseFloat(process.env.BOND_MAX_PERCENTAGE) || 0.20, // 20%
    defaultBondPercentage: parseFloat(process.env.BOND_DEFAULT_PERCENTAGE) || 0.10, // 10%
    bondRateBps: parseInt(process.env.BOND_RATE_BPS) || 500, // 5%
    slashingEnabled: process.env.BOND_SLASHING_ENABLED === 'true'
  },

  // Platform fees
  fees: {
    platformFeeBps: parseInt(process.env.PLATFORM_FEE_BPS) || 200, // 2%
    investmentFeeBps: parseInt(process.env.INVESTMENT_FEE_BPS) || 50, // 0.5%
    withdrawalFeeBps: parseInt(process.env.WITHDRAWAL_FEE_BPS) || 25, // 0.25%
    gasFeeBuffer: parseFloat(process.env.GAS_FEE_BUFFER) || 1.2 // 20% buffer
  },

  // Notification configuration
  notifications: {
    enableEmail: process.env.NOTIFICATIONS_EMAIL_ENABLED === 'true',
    enableRealTime: process.env.NOTIFICATIONS_REALTIME_ENABLED === 'true',
    enableSMS: process.env.NOTIFICATIONS_SMS_ENABLED === 'true',
    retryAttempts: parseInt(process.env.NOTIFICATIONS_RETRY_ATTEMPTS) || 3,
    retryDelay: parseInt(process.env.NOTIFICATIONS_RETRY_DELAY) || 5000 // 5 seconds
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    enableFileLogging: process.env.LOG_FILE_ENABLED === 'true',
    logDir: process.env.LOG_DIR || './logs',
    maxFileSize: process.env.LOG_MAX_FILE_SIZE || '20m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 14
  },

  // API configuration
  api: {
    version: process.env.API_VERSION || 'v1',
    prefix: process.env.API_PREFIX || '/api',
    timeout: parseInt(process.env.API_TIMEOUT) || 30000, // 30 seconds
    maxRequestSize: process.env.API_MAX_REQUEST_SIZE || '10mb'
  },

  // Pagination defaults
  pagination: {
    defaultLimit: parseInt(process.env.PAGINATION_DEFAULT_LIMIT) || 20,
    maxLimit: parseInt(process.env.PAGINATION_MAX_LIMIT) || 100
  },

  // Cache configuration
  cache: {
    defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL) || 3600, // 1 hour
    maxKeys: parseInt(process.env.CACHE_MAX_KEYS) || 1000,
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD) || 600 // 10 minutes
  },

  // External API configuration
  externalApis: {
    exchangeRateApi: {
      url: process.env.EXCHANGE_RATE_API_URL || 'https://api.exchangerate-api.com/v4/latest',
      key: process.env.EXCHANGE_RATE_API_KEY,
      timeout: parseInt(process.env.EXCHANGE_RATE_API_TIMEOUT) || 10000
    },
    kycApi: {
      url: process.env.KYC_API_URL,
      key: process.env.KYC_API_KEY,
      timeout: parseInt(process.env.KYC_API_TIMEOUT) || 30000
    },
    creditCheckApi: {
      url: process.env.CREDIT_CHECK_API_URL,
      key: process.env.CREDIT_CHECK_API_KEY,
      timeout: parseInt(process.env.CREDIT_CHECK_API_TIMEOUT) || 30000
    }
  },

  // Monitoring and health check
  monitoring: {
    enableHealthCheck: process.env.MONITORING_HEALTH_CHECK_ENABLED !== 'false',
    healthCheckInterval: parseInt(process.env.MONITORING_HEALTH_CHECK_INTERVAL) || 30000, // 30 seconds
    enableMetrics: process.env.MONITORING_METRICS_ENABLED === 'true',
    metricsPort: parseInt(process.env.MONITORING_METRICS_PORT) || 9090
  },

  // Development and testing
  development: {
    enableSwagger: process.env.ENABLE_SWAGGER === 'true',
    enableDebugLogs: process.env.ENABLE_DEBUG_LOGS === 'true',
    mockExternalApis: process.env.MOCK_EXTERNAL_APIS === 'true',
    seedDatabase: process.env.SEED_DATABASE === 'true'
  },

  // Backup and recovery
  backup: {
    enableAutoBackup: process.env.BACKUP_AUTO_ENABLED === 'true',
    backupInterval: process.env.BACKUP_INTERVAL || '0 2 * * *', // Daily at 2 AM
    backupRetention: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
    backupLocation: process.env.BACKUP_LOCATION || './backups'
  }
};

// Validation function
function validateConfig() {
  const requiredEnvVars = [
    'HEDERA_ACCOUNT_ID',
    'HEDERA_PRIVATE_KEY',
    'JWT_SECRET',
    'DB_PASSWORD'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '));
    if (config.server.environment === 'production') {
      process.exit(1);
    } else {
      console.warn('Running in development mode with missing environment variables');
    }
  }

  // Validate Hedera configuration
  if (config.hedera.accountId && !config.hedera.accountId.match(/^0\.0\.[0-9]+$/)) {
    console.error('Invalid Hedera Account ID format');
    if (config.server.environment === 'production') {
      process.exit(1);
    }
  }

  // Validate JWT secret length
  if (config.jwt.secret.length < 32) {
    console.warn('JWT secret should be at least 32 characters long');
  }

  // Validate database configuration
  if (!config.database.host || !config.database.name) {
    console.error('Database host and name are required');
    if (config.server.environment === 'production') {
      process.exit(1);
    }
  }

  console.log('Configuration validation completed');
}

// Helper functions
function isDevelopment() {
  return config.server.environment === 'development';
}

function isProduction() {
  return config.server.environment === 'production';
}

function isTestnet() {
  return config.hedera.network === 'testnet';
}

function isMainnet() {
  return config.hedera.network === 'mainnet';
}

// Run validation
validateConfig();

module.exports = {
  ...config,
  isDevelopment,
  isProduction,
  isTestnet,
  isMainnet,
  validateConfig
};