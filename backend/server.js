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

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000'
    ];
    
    // Check if the origin is in the allowed list or is a localhost origin
    if (
      allowedOrigins.includes(origin) || 
      /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
      /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    
    // For production, you might want to be more strict
    if (process.env.NODE_ENV === 'production') {
      const msg = `The CORS policy for this site does not allow access from the specified origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Accept-Version',
    'Content-Length',
    'X-Total-Count',
    'X-Pagination',
    'Cache-Control',
    'Pragma',
    'Expires',
    'If-Modified-Since',
    'If-None-Match',
    'X-Requested-With',
    'x-retry-max',
    'x-retry-count'
  ],
  exposedHeaders: [
    'Content-Length',
    'Content-Type',
    'X-Total-Count',
    'X-Pagination',
    'Cache-Control',
    'ETag',
    'Last-Modified'
  ],
  optionsSuccessStatus: 200, // Some legacy browsers (IE11) choke on 204
  maxAge: 600, // 10 minutes
  preflightContinue: false
};

// Apply CORS middleware to all routes
app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

// Add CORS headers to all responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Type, X-Total-Count, X-Pagination');
    res.header('Access-Control-Max-Age', '600');
  }
  next();
});

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
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

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Query:', JSON.stringify(req.query, null, 2));
  next();
});

// API Routes
const routes = [
  // Auth and User Management
  { path: '/api/auth', route: require('./routes/auth') },
  { path: '/api/users', route: require('./routes/users') },
  { path: '/api/subscription', route: require('./routes/subscription') },
  
  // Goat Management
  { path: '/api/goats', route: require('./routes/goats') },
  { path: '/api/health', route: require('./routes/health') },
  { path: '/api/breeding', route: require('./routes/breeding') },
  
  // Dairy Management
  { path: '/api/milk-records', route: require('./routes/milkRecords') },
  { path: '/api/milk-production', route: require('./routes/milkProduction') },
  { path: '/api/dairy', route: require('./routes/dairy') },
  { path: '/api/dairy-feed', route: require('./routes/dairyFeed') },
  { path: '/api/dairy-health', route: require('./routes/dairyHealth') },
  
  // Poultry Management
  { path: '/api/poultry', route: require('./routes/poultry') },
  { path: '/api/poultry-health', route: require('./routes/poultryHealth') },
  { path: '/api/poultry-feed', route: require('./routes/poultryFeed') },
  
  // Other Features
  { path: '/api/feed', route: require('./routes/feed') },
  { path: '/api/sales', route: require('./routes/sales') },
  { path: '/api/dashboard', route: require('./routes/dashboard') },
  { path: '/api/reports', route: require('./routes/reports') },
  { path: '/api/notifications', route: require('./routes/notifications') },
  { path: '/api/inventory', route: require('./routes/inventory') },
  { path: '/api/financial', route: require('./routes/financial') },
  
  // Admin Routes
  { 
    path: '/api/monitor', 
    route: (() => {
      const router = require('express').Router();
      const monitorRoutes = require('./routes/monitor');
      router.use(adminOnly);
      router.use('/', monitorRoutes);
      return router;
    })()
  }
];

// Register all routes
routes.forEach(({ path, route }) => {
  console.log(`Registering route: ${path}`);
  app.use(path, route);
});

// API Documentation
const swaggerDocs = require('./config/swagger');
swaggerDocs(app, PORT);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusText = {
    2: 'connecting',
    3: 'disconnecting'
  }[dbStatus] || 'unknown';

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: dbStatusText,
      name: process.env.MONGO_DB || 'not_configured',
      host: process.env.MONGO_URI ? new URL(process.env.MONGO_URI).hostname : 'not_configured'
    },
    server: {
      node: process.version,
      platform: process.platform,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  });
});

// Other routes that aren't in the routes array
app.use('/api/milk-records', require('./routes/milkRecords'));
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

// Health route is already included in the routes array above
app.use('/api/users', require('./routes/users'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/financial', require('./routes/financial'));

// Health check endpoint is already implemented at /api/health

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