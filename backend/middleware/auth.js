const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const config = require('../config/config');
const { AuthenticationError, AuthorizationError } = require('./errorHandler');
const logger = require('./logger');

// JWT token verification
const verifyToken = async (token) => {
  try {
    const decoded = await promisify(jwt.verify)(token, config.jwt.secret);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new AuthenticationError('Invalid token');
    } else {
      throw new AuthenticationError('Token verification failed');
    }
  }
};

// Generate JWT token
const generateToken = (payload, expiresIn = config.jwt.expiresIn) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience
  });
};

// Generate refresh token
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience
  });
};

// Verify refresh token
const verifyRefreshToken = async (token) => {
  try {
    const decoded = await promisify(jwt.verify)(token, config.jwt.refreshSecret);
    return decoded;
  } catch (error) {
    throw new AuthenticationError('Invalid refresh token');
  }
};

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      throw new AuthenticationError('Access token is required');
    }

    // Verify token
    const decoded = await verifyToken(token);
    
    // Add user info to request
    req.user = {
      id: decoded.userId,
      accountId: decoded.accountId,
      role: decoded.role,
      email: decoded.email,
      permissions: decoded.permissions || []
    };

    // Log authentication
    logger.info('User authenticated', {
      userId: req.user.id,
      accountId: req.user.accountId,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl
    });

    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication middleware (doesn't throw error if no token)
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (token) {
      const decoded = await verifyToken(token);
      req.user = {
        id: decoded.userId,
        accountId: decoded.accountId,
        role: decoded.role,
        email: decoded.email,
        permissions: decoded.permissions || []
      };
    }

    next();
  } catch (error) {
    // Continue without authentication for optional routes
    next();
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      if (!roles.includes(req.user.role)) {
        throw new AuthorizationError(`Access denied. Required roles: ${roles.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Permission-based authorization middleware
const requirePermission = (...permissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const userPermissions = req.user.permissions || [];
      const hasPermission = permissions.some(permission => 
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        throw new AuthorizationError(`Access denied. Required permissions: ${permissions.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Resource ownership middleware
const requireOwnership = (resourceIdParam = 'id', userIdField = 'userId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Admin can access any resource
      if (req.user.role === 'admin') {
        return next();
      }

      const resourceId = req.params[resourceIdParam];
      if (!resourceId) {
        throw new AuthorizationError('Resource ID is required');
      }

      // This would typically involve a database lookup
      // For now, we'll assume the resource has a userId field
      // In a real implementation, you'd query the database here
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Account ID validation middleware
const validateAccountId = (req, res, next) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const { accountId } = req.params;
    if (accountId && accountId !== req.user.accountId && req.user.role !== 'admin') {
      throw new AuthorizationError('Access denied to this account');
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Rate limiting by user
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();

  return (req, res, next) => {
    try {
      if (!req.user) {
        return next();
      }

      const userId = req.user.id;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Get user's request history
      let userRequestHistory = userRequests.get(userId) || [];
      
      // Remove old requests outside the window
      userRequestHistory = userRequestHistory.filter(timestamp => timestamp > windowStart);
      
      // Check if user has exceeded the limit
      if (userRequestHistory.length >= maxRequests) {
        throw new AuthorizationError('Rate limit exceeded. Please try again later.');
      }
      
      // Add current request
      userRequestHistory.push(now);
      userRequests.set(userId, userRequestHistory);
      
      // Clean up old entries periodically
      if (Math.random() < 0.01) { // 1% chance
        for (const [key, requests] of userRequests.entries()) {
          const filteredRequests = requests.filter(timestamp => timestamp > windowStart);
          if (filteredRequests.length === 0) {
            userRequests.delete(key);
          } else {
            userRequests.set(key, filteredRequests);
          }
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// API key authentication middleware
const authenticateApiKey = (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      throw new AuthenticationError('API key is required');
    }

    // Validate API key (this would typically involve database lookup)
    if (apiKey !== config.api.key) {
      throw new AuthenticationError('Invalid API key');
    }

    // Set API user context
    req.user = {
      id: 'api',
      role: 'api',
      permissions: ['api_access']
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Hedera account validation middleware
const validateHederaAccount = (req, res, next) => {
  try {
    const { accountId } = req.body;
    
    if (accountId) {
      // Basic Hedera account ID format validation
      const hederaAccountRegex = /^\d+\.\d+\.\d+$/;
      if (!hederaAccountRegex.test(accountId)) {
        throw new ValidationError('Invalid Hedera account ID format');
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Session management
const sessions = new Map();

const createSession = (userId, sessionData) => {
  const sessionId = require('crypto').randomBytes(32).toString('hex');
  sessions.set(sessionId, {
    userId,
    ...sessionData,
    createdAt: new Date(),
    lastAccessed: new Date()
  });
  return sessionId;
};

const getSession = (sessionId) => {
  const session = sessions.get(sessionId);
  if (session) {
    session.lastAccessed = new Date();
  }
  return session;
};

const destroySession = (sessionId) => {
  return sessions.delete(sessionId);
};

const cleanupSessions = () => {
  const now = new Date();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.lastAccessed > maxAge) {
      sessions.delete(sessionId);
    }
  }
};

// Run cleanup every hour
setInterval(cleanupSessions, 60 * 60 * 1000);

module.exports = {
  // Token functions
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  
  // Authentication middleware
  authenticate,
  optionalAuthenticate,
  authenticateApiKey,
  
  // Authorization middleware
  authorize,
  requirePermission,
  requireOwnership,
  validateAccountId,
  
  // Validation middleware
  validateHederaAccount,
  
  // Rate limiting
  userRateLimit,
  
  // Session management
  createSession,
  getSession,
  destroySession,
  cleanupSessions
};