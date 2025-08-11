const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('./errorHandler');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));
    
    throw new ValidationError('Validation failed', errorDetails);
  }
  next();
};

// Common validation rules
const commonValidations = {
  // Hedera Account ID validation
  hederaAccountId: (field = 'accountId') => {
    return body(field)
      .matches(/^\d+\.\d+\.\d+$/)
      .withMessage('Invalid Hedera account ID format (expected: x.y.z)');
  },
  
  // Email validation
  email: (field = 'email') => {
    return body(field)
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email format');
  },
  
  // Password validation
  password: (field = 'password') => {
    return body(field)
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be between 8 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
  },
  
  // Amount validation (for financial amounts)
  amount: (field = 'amount') => {
    return body(field)
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be a positive number greater than 0.01')
      .custom((value) => {
        // Check for reasonable decimal places (max 8 for crypto)
        const decimalPlaces = (value.toString().split('.')[1] || '').length;
        if (decimalPlaces > 8) {
          throw new Error('Amount cannot have more than 8 decimal places');
        }
        return true;
      });
  },
  
  // Currency validation
  currency: (field = 'currency') => {
    return body(field)
      .isIn(['USD', 'EUR', 'GBP', 'HBAR', 'USDC', 'BTC', 'ETH'])
      .withMessage('Invalid currency code');
  },
  
  // Date validation
  date: (field, options = {}) => {
    const validator = body(field)
      .isISO8601()
      .withMessage('Invalid date format (expected ISO 8601)');
    
    if (options.future) {
      validator.custom((value) => {
        if (new Date(value) <= new Date()) {
          throw new Error('Date must be in the future');
        }
        return true;
      });
    }
    
    if (options.past) {
      validator.custom((value) => {
        if (new Date(value) >= new Date()) {
          throw new Error('Date must be in the past');
        }
        return true;
      });
    }
    
    return validator;
  },
  
  // UUID validation
  uuid: (field) => {
    return body(field)
      .isUUID()
      .withMessage('Invalid UUID format');
  },
  
  // MongoDB ObjectId validation
  objectId: (field) => {
    return body(field)
      .isMongoId()
      .withMessage('Invalid ObjectId format');
  },
  
  // URL validation
  url: (field) => {
    return body(field)
      .isURL()
      .withMessage('Invalid URL format');
  },
  
  // Phone number validation
  phone: (field = 'phone') => {
    return body(field)
      .isMobilePhone()
      .withMessage('Invalid phone number format');
  },
  
  // File validation
  file: (field, options = {}) => {
    return body(field)
      .custom((value, { req }) => {
        if (!req.file && !options.optional) {
          throw new Error('File is required');
        }
        
        if (req.file) {
          // Check file size
          if (options.maxSize && req.file.size > options.maxSize) {
            throw new Error(`File size exceeds ${options.maxSize} bytes`);
          }
          
          // Check file type
          if (options.allowedTypes && !options.allowedTypes.includes(req.file.mimetype)) {
            throw new Error(`File type not allowed. Allowed types: ${options.allowedTypes.join(', ')}`);
          }
        }
        
        return true;
      });
  }
};

// Invoice validation schemas
const invoiceValidations = {
  create: [
    body('sellerId')
      .notEmpty()
      .withMessage('Seller ID is required'),
    
    body('buyerId')
      .notEmpty()
      .withMessage('Buyer ID is required'),
    
    commonValidations.amount('amount'),
    commonValidations.currency('currency'),
    
    body('dueDate')
      .isISO8601()
      .withMessage('Invalid due date format')
      .custom((value) => {
        const dueDate = new Date(value);
        const now = new Date();
        const maxDueDate = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year from now
        
        if (dueDate <= now) {
          throw new Error('Due date must be in the future');
        }
        
        if (dueDate > maxDueDate) {
          throw new Error('Due date cannot be more than 1 year in the future');
        }
        
        return true;
      }),
    
    body('description')
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters'),
    
    body('invoiceNumber')
      .isLength({ min: 1, max: 50 })
      .withMessage('Invoice number must be between 1 and 50 characters')
      .matches(/^[A-Za-z0-9-_]+$/)
      .withMessage('Invoice number can only contain letters, numbers, hyphens, and underscores'),
    
    body('terms')
      .optional()
      .isLength({ max: 2000 })
      .withMessage('Terms cannot exceed 2000 characters'),
    
    handleValidationErrors
  ],
  
  update: [
    param('id')
      .isMongoId()
      .withMessage('Invalid invoice ID'),
    
    body('amount')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be a positive number'),
    
    body('dueDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid due date format'),
    
    body('description')
      .optional()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters'),
    
    handleValidationErrors
  ],
  
  review: [
    param('id')
      .isMongoId()
      .withMessage('Invalid invoice ID'),
    
    body('status')
      .isIn(['approved', 'rejected'])
      .withMessage('Status must be either approved or rejected'),
    
    body('reviewNotes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Review notes cannot exceed 500 characters'),
    
    handleValidationErrors
  ]
};

// Investment validation schemas
const investmentValidations = {
  create: [
    body('invoiceId')
      .isMongoId()
      .withMessage('Invalid invoice ID'),
    
    commonValidations.amount('amount'),
    
    body('investorAccountId')
      .matches(/^\d+\.\d+\.\d+$/)
      .withMessage('Invalid investor Hedera account ID'),
    
    handleValidationErrors
  ],
  
  cancel: [
    param('id')
      .isMongoId()
      .withMessage('Invalid investment ID'),
    
    body('reason')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Cancellation reason cannot exceed 200 characters'),
    
    handleValidationErrors
  ]
};

// User validation schemas
const userValidations = {
  register: [
    commonValidations.email('email'),
    commonValidations.password('password'),
    commonValidations.hederaAccountId('accountId'),
    
    body('firstName')
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be between 1 and 50 characters')
      .matches(/^[A-Za-z\s]+$/)
      .withMessage('First name can only contain letters and spaces'),
    
    body('lastName')
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be between 1 and 50 characters')
      .matches(/^[A-Za-z\s]+$/)
      .withMessage('Last name can only contain letters and spaces'),
    
    body('role')
      .optional()
      .isIn(['seller', 'buyer', 'investor'])
      .withMessage('Invalid role'),
    
    handleValidationErrors
  ],
  
  login: [
    commonValidations.email('email'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    
    handleValidationErrors
  ],
  
  updateProfile: [
    body('firstName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be between 1 and 50 characters'),
    
    body('lastName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be between 1 and 50 characters'),
    
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Invalid phone number'),
    
    handleValidationErrors
  ]
};

// Query parameter validations
const queryValidations = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    handleValidationErrors
  ],
  
  dateRange: [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format')
      .custom((value, { req }) => {
        if (req.query.startDate && value) {
          const startDate = new Date(req.query.startDate);
          const endDate = new Date(value);
          
          if (endDate <= startDate) {
            throw new Error('End date must be after start date');
          }
        }
        return true;
      }),
    
    handleValidationErrors
  ],
  
  search: [
    query('q')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be between 1 and 100 characters')
      .escape(),
    
    handleValidationErrors
  ]
};

// File upload validations
const fileValidations = {
  document: [
    body('documentType')
      .isIn(['invoice', 'contract', 'receipt', 'identity', 'other'])
      .withMessage('Invalid document type'),
    
    body('description')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Description cannot exceed 200 characters'),
    
    // File validation will be handled by multer middleware
    handleValidationErrors
  ]
};

// Custom validation helpers
const customValidations = {
  // Validate that a field exists in database
  existsInDB: (model, field = '_id') => {
    return async (value) => {
      const record = await model.findOne({ [field]: value });
      if (!record) {
        throw new Error(`Record with ${field} '${value}' does not exist`);
      }
      return true;
    };
  },
  
  // Validate that a field is unique in database
  uniqueInDB: (model, field, excludeId = null) => {
    return async (value) => {
      const query = { [field]: value };
      if (excludeId) {
        query._id = { $ne: excludeId };
      }
      
      const record = await model.findOne(query);
      if (record) {
        throw new Error(`${field} '${value}' already exists`);
      }
      return true;
    };
  },
  
  // Validate business rules
  validateBusinessRules: {
    // Ensure investment amount doesn't exceed invoice amount
    investmentAmount: (invoiceModel) => {
      return async (value, { req }) => {
        const invoice = await invoiceModel.findById(req.body.invoiceId);
        if (!invoice) {
          throw new Error('Invoice not found');
        }
        
        if (value > invoice.amount) {
          throw new Error('Investment amount cannot exceed invoice amount');
        }
        
        return true;
      };
    },
    
    // Ensure due date is reasonable
    dueDate: () => {
      return (value) => {
        const dueDate = new Date(value);
        const now = new Date();
        const minDate = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // Tomorrow
        const maxDate = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year
        
        if (dueDate < minDate) {
          throw new Error('Due date must be at least 24 hours in the future');
        }
        
        if (dueDate > maxDate) {
          throw new Error('Due date cannot be more than 1 year in the future');
        }
        
        return true;
      };
    }
  }
};

module.exports = {
  handleValidationErrors,
  commonValidations,
  invoiceValidations,
  investmentValidations,
  userValidations,
  queryValidations,
  fileValidations,
  customValidations
};