const config = require('../config/config');
const logger = require('./logger');

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error types
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400);
    this.name = 'ValidationError';
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500);
    this.name = 'InternalServerError';
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 503);
    this.name = 'ServiceUnavailableError';
  }
}

// Contract-specific errors
class ContractError extends AppError {
  constructor(message, contractAddress = null, transactionHash = null) {
    super(message, 500);
    this.name = 'ContractError';
    this.contractAddress = contractAddress;
    this.transactionHash = transactionHash;
  }
}

class InsufficientFundsError extends AppError {
  constructor(message = 'Insufficient funds for transaction') {
    super(message, 400);
    this.name = 'InsufficientFundsError';
  }
}

class TransactionFailedError extends AppError {
  constructor(message, transactionHash = null, gasUsed = null) {
    super(message, 500);
    this.name = 'TransactionFailedError';
    this.transactionHash = transactionHash;
    this.gasUsed = gasUsed;
  }
}

// Database-specific errors
class DatabaseError extends AppError {
  constructor(message, query = null) {
    super(message, 500);
    this.name = 'DatabaseError';
    this.query = query;
  }
}

// External service errors
class ExternalServiceError extends AppError {
  constructor(message, service = null, statusCode = 502) {
    super(message, statusCode);
    this.name = 'ExternalServiceError';
    this.service = service;
  }
}

// Error handler middleware
const errorHandler = (error, req, res, next) => {
  let err = { ...error };
  err.message = error.message;
  err.stack = error.stack;

  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    requestId: req.id || 'unknown'
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    err = handleValidationError(error);
  } else if (error.name === 'CastError') {
    err = handleCastError(error);
  } else if (error.code === 11000) {
    err = handleDuplicateFieldError(error);
  } else if (error.name === 'JsonWebTokenError') {
    err = handleJWTError(error);
  } else if (error.name === 'TokenExpiredError') {
    err = handleJWTExpiredError(error);
  } else if (error.name === 'SequelizeValidationError') {
    err = handleSequelizeValidationError(error);
  } else if (error.name === 'SequelizeUniqueConstraintError') {
    err = handleSequelizeUniqueError(error);
  } else if (error.name === 'SequelizeForeignKeyConstraintError') {
    err = handleSequelizeForeignKeyError(error);
  } else if (error.code === 'ECONNREFUSED') {
    err = handleConnectionError(error);
  } else if (error.code === 'ETIMEDOUT') {
    err = handleTimeoutError(error);
  }

  // Set default error if not operational
  if (!err.isOperational) {
    err = new InternalServerError('Something went wrong');
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      message: err.message,
      statusCode: err.statusCode || 500,
      timestamp: err.timestamp || new Date().toISOString(),
      requestId: req.id || 'unknown'
    }
  };

  // Add additional error details in development
  if (config.isDevelopment()) {
    errorResponse.error.stack = err.stack;
    errorResponse.error.details = err.details;
    
    if (err.contractAddress) {
      errorResponse.error.contractAddress = err.contractAddress;
    }
    
    if (err.transactionHash) {
      errorResponse.error.transactionHash = err.transactionHash;
    }
    
    if (err.query) {
      errorResponse.error.query = err.query;
    }
    
    if (err.service) {
      errorResponse.error.service = err.service;
    }
  }

  // Send error response
  res.status(err.statusCode || 500).json(errorResponse);
};

// Specific error handlers
const handleValidationError = (error) => {
  const errors = Object.values(error.errors).map(val => val.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new ValidationError(message, errors);
};

const handleCastError = (error) => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new ValidationError(message);
};

const handleDuplicateFieldError = (error) => {
  const field = Object.keys(error.keyValue)[0];
  const message = `Duplicate field value: ${field}. Please use another value`;
  return new ConflictError(message);
};

const handleJWTError = () => {
  return new AuthenticationError('Invalid token. Please log in again');
};

const handleJWTExpiredError = () => {
  return new AuthenticationError('Your token has expired. Please log in again');
};

const handleSequelizeValidationError = (error) => {
  const errors = error.errors.map(err => ({
    field: err.path,
    message: err.message,
    value: err.value
  }));
  const message = 'Validation failed';
  return new ValidationError(message, errors);
};

const handleSequelizeUniqueError = (error) => {
  const field = error.errors[0].path;
  const message = `${field} already exists`;
  return new ConflictError(message);
};

const handleSequelizeForeignKeyError = (error) => {
  const message = 'Invalid reference to related resource';
  return new ValidationError(message);
};

const handleConnectionError = (error) => {
  const message = 'Unable to connect to external service';
  return new ServiceUnavailableError(message);
};

const handleTimeoutError = (error) => {
  const message = 'Request timeout. Please try again';
  return new ServiceUnavailableError(message);
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

// Validation error helper
const createValidationError = (message, details = null) => {
  return new ValidationError(message, details);
};

// Contract error helper
const createContractError = (message, contractAddress = null, transactionHash = null) => {
  return new ContractError(message, contractAddress, transactionHash);
};

// Database error helper
const createDatabaseError = (message, query = null) => {
  return new DatabaseError(message, query);
};

// External service error helper
const createExternalServiceError = (message, service = null, statusCode = 502) => {
  return new ExternalServiceError(message, service, statusCode);
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  
  // Error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
  ContractError,
  InsufficientFundsError,
  TransactionFailedError,
  DatabaseError,
  ExternalServiceError,
  
  // Error helpers
  createValidationError,
  createContractError,
  createDatabaseError,
  createExternalServiceError
};