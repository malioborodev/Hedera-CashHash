const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += '\n' + JSON.stringify(meta, null, 2);
    }
    
    return log;
  })
);

// Create winston logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: {
    service: 'cashhash-backend',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: config.logging.maxFileSize,
      maxFiles: config.logging.maxFiles,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: config.logging.maxFileSize,
      maxFiles: config.logging.maxFiles,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    
    // Access log file
    new winston.transports.File({
      filename: path.join(logsDir, 'access.log'),
      level: 'info',
      maxsize: config.logging.maxFileSize,
      maxFiles: config.logging.maxFiles,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],
  
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: config.logging.maxFileSize,
      maxFiles: config.logging.maxFiles
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: config.logging.maxFileSize,
      maxFiles: config.logging.maxFiles
    })
  ]
});

// Add console transport in development
if (config.isDevelopment()) {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Request logging middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Generate request ID
  req.id = require('crypto').randomBytes(16).toString('hex');
  
  // Log request start
  logger.info('Request started', {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    userId: req.user?.id,
    accountId: req.user?.accountId
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    
    // Log response
    logger.info('Request completed', {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      userId: req.user?.id,
      accountId: req.user?.accountId
    });
    
    // Call original end
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Security logging
const securityLogger = {
  logFailedLogin: (email, ip, userAgent) => {
    logger.warn('Failed login attempt', {
      event: 'failed_login',
      email,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },
  
  logSuccessfulLogin: (userId, email, ip, userAgent) => {
    logger.info('Successful login', {
      event: 'successful_login',
      userId,
      email,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },
  
  logLogout: (userId, ip) => {
    logger.info('User logout', {
      event: 'logout',
      userId,
      ip,
      timestamp: new Date().toISOString()
    });
  },
  
  logUnauthorizedAccess: (userId, resource, ip, userAgent) => {
    logger.warn('Unauthorized access attempt', {
      event: 'unauthorized_access',
      userId,
      resource,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },
  
  logSuspiciousActivity: (userId, activity, details, ip) => {
    logger.warn('Suspicious activity detected', {
      event: 'suspicious_activity',
      userId,
      activity,
      details,
      ip,
      timestamp: new Date().toISOString()
    });
  },
  
  logRateLimitExceeded: (userId, ip, endpoint) => {
    logger.warn('Rate limit exceeded', {
      event: 'rate_limit_exceeded',
      userId,
      ip,
      endpoint,
      timestamp: new Date().toISOString()
    });
  }
};

// Transaction logging
const transactionLogger = {
  logTransactionStart: (transactionId, type, userId, details) => {
    logger.info('Transaction started', {
      event: 'transaction_start',
      transactionId,
      type,
      userId,
      details,
      timestamp: new Date().toISOString()
    });
  },
  
  logTransactionSuccess: (transactionId, type, userId, hash, gasUsed) => {
    logger.info('Transaction successful', {
      event: 'transaction_success',
      transactionId,
      type,
      userId,
      hash,
      gasUsed,
      timestamp: new Date().toISOString()
    });
  },
  
  logTransactionFailure: (transactionId, type, userId, error, details) => {
    logger.error('Transaction failed', {
      event: 'transaction_failure',
      transactionId,
      type,
      userId,
      error: error.message,
      details,
      timestamp: new Date().toISOString()
    });
  },
  
  logContractInteraction: (contractAddress, method, userId, parameters) => {
    logger.info('Contract interaction', {
      event: 'contract_interaction',
      contractAddress,
      method,
      userId,
      parameters,
      timestamp: new Date().toISOString()
    });
  }
};

// Business logic logging
const businessLogger = {
  logInvoiceCreated: (invoiceId, userId, amount, currency) => {
    logger.info('Invoice created', {
      event: 'invoice_created',
      invoiceId,
      userId,
      amount,
      currency,
      timestamp: new Date().toISOString()
    });
  },
  
  logInvestmentMade: (investmentId, invoiceId, userId, amount) => {
    logger.info('Investment made', {
      event: 'investment_made',
      investmentId,
      invoiceId,
      userId,
      amount,
      timestamp: new Date().toISOString()
    });
  },
  
  logPaymentReceived: (paymentId, invoiceId, amount, currency) => {
    logger.info('Payment received', {
      event: 'payment_received',
      paymentId,
      invoiceId,
      amount,
      currency,
      timestamp: new Date().toISOString()
    });
  },
  
  logRiskAssessment: (invoiceId, riskScore, factors) => {
    logger.info('Risk assessment completed', {
      event: 'risk_assessment',
      invoiceId,
      riskScore,
      factors,
      timestamp: new Date().toISOString()
    });
  }
};

// Performance logging
const performanceLogger = {
  logSlowQuery: (query, duration, parameters) => {
    logger.warn('Slow database query', {
      event: 'slow_query',
      query,
      duration: `${duration}ms`,
      parameters,
      timestamp: new Date().toISOString()
    });
  },
  
  logHighMemoryUsage: (usage, threshold) => {
    logger.warn('High memory usage detected', {
      event: 'high_memory_usage',
      usage: `${usage}MB`,
      threshold: `${threshold}MB`,
      timestamp: new Date().toISOString()
    });
  },
  
  logApiResponseTime: (endpoint, method, duration, statusCode) => {
    const level = duration > 5000 ? 'warn' : 'info';
    logger.log(level, 'API response time', {
      event: 'api_response_time',
      endpoint,
      method,
      duration: `${duration}ms`,
      statusCode,
      timestamp: new Date().toISOString()
    });
  }
};

// Error context logger
const errorContextLogger = (error, context = {}) => {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    ...context,
    timestamp: new Date().toISOString()
  });
};

// Log rotation and cleanup
const cleanupOldLogs = () => {
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
  const now = Date.now();
  
  fs.readdir(logsDir, (err, files) => {
    if (err) {
      logger.error('Error reading logs directory', { error: err.message });
      return;
    }
    
    files.forEach(file => {
      const filePath = path.join(logsDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlink(filePath, (err) => {
            if (err) {
              logger.error('Error deleting old log file', { file, error: err.message });
            } else {
              logger.info('Deleted old log file', { file });
            }
          });
        }
      });
    });
  });
};

// Run cleanup daily
setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);

// Export logger and utilities
module.exports = logger;
module.exports.requestLogger = requestLogger;
module.exports.securityLogger = securityLogger;
module.exports.transactionLogger = transactionLogger;
module.exports.businessLogger = businessLogger;
module.exports.performanceLogger = performanceLogger;
module.exports.errorContextLogger = errorContextLogger;
module.exports.cleanupOldLogs = cleanupOldLogs;