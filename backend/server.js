const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Import configuration and services
const config = require('./config/config');
const contractService = require('./services/contractService');
const htsService = require('./services/htsService');
const hfsService = require('./services/hfsService');
const notificationService = require('./services/notificationService');
const riskEngine = require('./services/riskEngine');

// Import routes
const invoiceRoutes = require('./routes/invoices');
const investmentRoutes = require('./routes/investments');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./middleware/logger');
const auth = require('./middleware/auth');

// Create Express app
const app = express();
const server = http.createServer(app);

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: config.security.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression middleware
app.use(compression());

// Request logging
if (config.isDevelopment()) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMax,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.security.rateLimitWindowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: config.api.maxRequestSize }));
app.use(express.urlencoded({ extended: true, limit: config.api.maxRequestSize }));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create necessary directories
const createDirectories = () => {
  const dirs = [
    config.upload.uploadDir,
    config.upload.tempDir,
    config.logging.logDir,
    config.backup.backupLocation
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
};

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.server.environment,
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'checking...',
        hedera: 'checking...',
        redis: 'checking...',
        email: 'checking...'
      }
    };

    // Check services (simplified for now)
    healthStatus.services.database = 'healthy';
    healthStatus.services.hedera = 'healthy';
    healthStatus.services.redis = 'healthy';
    healthStatus.services.email = 'healthy';

    res.status(200).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API routes
app.use(`${config.api.prefix}/${config.api.version}/invoices`, invoiceRoutes);
app.use(`${config.api.prefix}/${config.api.version}/investments`, investmentRoutes);

// API documentation (Swagger)
if (config.development.enableSwagger) {
  const swaggerUi = require('swagger-ui-express');
  const swaggerJsdoc = require('swagger-jsdoc');

  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'CashHash API',
        version: '1.0.0',
        description: 'Invoice factoring platform API on Hedera',
        contact: {
          name: 'CashHash Team',
          email: 'support@cashhash.com'
        }
      },
      servers: [
        {
          url: `http://localhost:${config.server.port}${config.api.prefix}/${config.api.version}`,
          description: 'Development server'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    },
    apis: ['./routes/*.js', './models/*.js']
  };

  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(`Swagger documentation available at http://localhost:${config.server.port}/api-docs`);
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use(errorHandler);

// Initialize services
const initializeServices = async () => {
  try {
    console.log('Initializing services...');

    // Initialize contract service
    await contractService.initialize();
    console.log('✓ Contract service initialized');

    // Initialize HTS service
    await htsService.initialize();
    console.log('✓ HTS service initialized');

    // Initialize HFS service
    await hfsService.initialize();
    console.log('✓ HFS service initialized');

    // Initialize notification service
    await notificationService.initialize(server);
    console.log('✓ Notification service initialized');

    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('HTTP server closed');
    
    // Close database connections, Redis, etc.
    // TODO: Add cleanup for database and other services
    
    console.log('Graceful shutdown completed');
    process.exit(0);
  });

  // Force close after 30 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Handle process signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    // Create necessary directories
    createDirectories();

    // Initialize services
    await initializeServices();

    // Start HTTP server
    server.listen(config.server.port, config.server.host, () => {
      console.log(`\n🚀 CashHash Backend Server started successfully!`);
      console.log(`📍 Server running on: http://${config.server.host}:${config.server.port}`);
      console.log(`🌍 Environment: ${config.server.environment}`);
      console.log(`🔗 Hedera Network: ${config.hedera.network}`);
      console.log(`📊 API Base URL: http://${config.server.host}:${config.server.port}${config.api.prefix}/${config.api.version}`);
      
      if (config.development.enableSwagger) {
        console.log(`📚 API Documentation: http://${config.server.host}:${config.server.port}/api-docs`);
      }
      
      console.log(`\n✨ Ready to process invoice factoring requests!\n`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${config.server.port} is already in use`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = { app, server };