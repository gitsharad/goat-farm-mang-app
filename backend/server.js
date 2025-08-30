require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { securityMiddleware, csrfProtection } = require('./middleware/security');
const { activityLogger, errorLogger, logger } = require('./middleware/activityLogger');
const { initSentry, errorHandler: sentryErrorHandler } = require('./config/sentry');
const corsErrorHandler = require('./middleware/corsErrorHandler');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 5000;

// Set server timeout to 30 seconds (default is 2 minutes)
const SERVER_TIMEOUT = 30000; // 30 seconds
app.set('timeout', SERVER_TIMEOUT);

// Add request timeout handling
app.use((req, res, next) => {
  // Set a timeout for all HTTP requests
  req.setTimeout(SERVER_TIMEOUT, () => {
    const err = new Error('Request Timeout');
    err.status = 408;
    next(err);
  });
  
  // Handle response timeout
  const { send } = res;
  res.send = function (body) {
    clearTimeout(res.timeout);
    send.call(this, body);
  };
  
  next();
});

// Initialize Sentry for error tracking and performance monitoring
const Sentry = initSentry(app);

// Security middleware
app.use(securityMiddleware);

// Activity logging
app.use(activityLogger);

// Enhanced CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    try {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log('[CORS] Allowing request with no origin');
        return callback(null, true);
      }

      // Get allowed origins from environment
      const allowedOrigins = process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
        : [];

      // Development: Allow all with logging
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[CORS] Development - Allowing origin: ${origin}`);
        return callback(null, true);
      }

      // Production: Check against allowed origins
      if (allowedOrigins.includes(origin)) {
        console.log(`[CORS] Allowed origin: ${origin}`);
        return callback(null, true);
      }

      // Check for localhost or IP addresses (useful for testing)
      const isLocalhost = /^https?:\/\/localhost(:[0-9]+)?$/.test(origin);
      const isIP = /^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:[0-9]+)?$/.test(origin);
      
      if (isLocalhost || isIP) {
        console.log(`[CORS] Allowed local/network origin: ${origin}`);
        return callback(null, true);
      }

      // If we get here, the origin is not allowed
      console.warn(`[CORS] Blocked origin: ${origin}`);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
      
    } catch (error) {
      console.error('[CORS] Error in origin validation:', error);
      // In case of error, be permissive in development, restrictive in production
      const allow = process.env.NODE_ENV !== 'production';
      if (allow) {
        console.warn(`[CORS] Allowing origin due to error: ${origin}`);
      }
      return callback(allow ? null : error);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization',
    'Cache-Control',
    'Pragma',
    'Expires',
    'X-Requested-With',
    'Accept',
    'X-Requested-With', 
    'Accept', 
    'Origin',
    'X-CSRF-Token',
    'X-Request-ID'
  ],
  exposedHeaders: [
    'Content-Range', 
    'X-Total-Count',
    'X-Request-ID',
    'Retry-After',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  optionsSuccessStatus: 204,
  preflightContinue: false,
  maxAge: 600 // 10 minutes
};

// Enable CORS for all routes with enhanced error handling
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Add CORS headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization, Cache-Control, Pragma, Expires');
  next();
});

// Add a simple health check endpoint
app.get('/api/health-check', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (process.env.NODE_ENV !== 'test') {
  const morgan = require('morgan');
  app.use(morgan('combined', {
    skip: (req) => req.path === '/health-check'
  }));
}

// Trust proxy for rate limiting and secure cookies
app.set('trust proxy', 1);

// CSRF protection for non-API routes
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Skip CSRF for API routes and health checks
    if (req.path.startsWith('/api/') || req.path === '/health-check') {
      return next();
    }
    return csrfProtection(req, res, next);
  });
}

// Enhanced MongoDB connection with reconnection handling
const connectWithRetry = () => {
  const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,  // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000,          // Close sockets after 45s of inactivity
    family: 4,                       // Use IPv4, skip trying IPv6
    maxPoolSize: 10,                 // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000,   // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000,           // Close sockets after 45s of inactivity
  };

  console.log('Attempting MongoDB connection...');
  
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goat-farm', mongoOptions)
    .then(() => console.log('✅ MongoDB connection established successfully'))
    .catch(err => {
      console.error('❌ MongoDB connection error:', err.message);
      console.log('Retrying MongoDB connection in 5 seconds...');
      setTimeout(connectWithRetry, 5000);
    });
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from DB');
});

// Handle Node process termination
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('Mongoose connection closed through app termination');
    process.exit(0);
  });
});

// Initial connection
connectWithRetry();

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Apply stricter rate limiting to auth routes
app.use('/api/auth', authLimiter);

// Admin middleware to protect monitoring routes
const adminOnly = (req, res, next) => {
  // In a real app, you would check if the user has admin role
  // For now, we'll just check for a special header or environment variable
  const isAdmin = req.headers['x-admin-secret'] === process.env.ADMIN_SECRET || 
                 process.env.NODE_ENV === 'development';
  
  if (!isAdmin) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin privileges required.' 
    });
  }
  next();
};

// API Routes
const routes = [
  { path: '/api/auth', route: require('./routes/auth') },
  { path: '/api/subscription', route: require('./routes/subscription') },
  { path: '/api/goats', route: require('./routes/goats') },
  { path: '/api/health', route: require('./routes/health') },
  { path: '/api/breeding', route: require('./routes/breeding') },
  { path: '/api/milk-production', route: require('./routes/milkProduction') },
  { 
    path: '/api/monitor', 
    route: (() => {
      const router = require('express').Router();
      const monitorRoutes = require('./routes/monitor');
      router.use(adminOnly);
      router.use('/', monitorRoutes);
      return router;
    })()
  },
];

// Register routes
routes.forEach(({ path, route }) => {
  app.use(path, route);
});

// API Documentation
const swaggerDocs = require('./config/swagger');
swaggerDocs(app, PORT);

// Health check endpoint
app.get('/health-check', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
// Auth routes
app.use('/api/auth', require('./routes/auth'));

// Application routes
app.use('/api/goats', require('./routes/goats'));
app.use('/api/goats/milk-records', require('./routes/milkRecords'));
app.use('/api/breeding', require('./routes/breeding'));
app.use('/api/feed', require('./routes/feed'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/dairy', require('./routes/dairy'));
app.use('/api/poultry', require('./routes/poultry'));
app.use('/api/poultry-health', require('./routes/poultryHealth'));
app.use('/api/poultry-feed', require('./routes/poultryFeed'));
app.use('/api/dairy-health', require('./routes/dairyHealth'));
app.use('/api/dairy-feed', require('./routes/dairyFeed'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/users', require('./routes/users'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/financial', require('./routes/financial'));

// Health check endpoint
app.get('/api/health-check', (req, res) => {
  res.json({ status: 'OK', message: 'Goat Farm API is running' });
});

// The Sentry error handler must be before any other error middleware
if (process.env.NODE_ENV === 'production') {
  app.use(sentryErrorHandler());
}

// CORS error handler
app.use(corsErrorHandler); // Handle CORS errors

// Error logging middleware
app.use(errorLogger);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Capture exception with Sentry in production
  if (process.env.NODE_ENV === 'production' && Sentry) {
    Sentry.captureException(err, {
      extra: {
        path: req.path,
        method: req.method,
        query: req.query,
        body: process.env.NODE_ENV === 'development' ? req.body : {},
        user: req.user ? {
          id: req.user._id,
          role: req.user.role,
          email: req.user.email
        } : null
      }
    });
  }
  
  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    message: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { error: err.message, stack: err.stack })
  };
  
  res.status(statusCode).json(response);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});