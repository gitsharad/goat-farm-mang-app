const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const csrf = require('csurf');
const { body, validationResult } = require('express-validator');

// Security headers middleware
const securityHeaders = [
  // Prevent clickjacking
  helmet.frameguard({ action: 'deny' }),
  
  // Enable XSS filter in browsers
  helmet.xssFilter(),
  
  // Prevent MIME type sniffing
  helmet.noSniff(),
  
  // Set HSTS header
  helmet.hsts({
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true
  }),
  
  // Remove X-Powered-By header
  helmet.hidePoweredBy(),
  
  // Set Content Security Policy
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "https://api.example.com"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  })
];

// Rate limiting configuration
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for certain paths
    const skipPaths = ['/health-check', '/api/health'];
    return skipPaths.some(path => req.path.startsWith(path));
  }
});

// CSRF protection
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600 // 1 hour
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
});

// Input validation middleware
const validateInput = (schema) => {
  return async (req, res, next) => {
    await Promise.all(schema.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  };
};

// Request validation schemas
const validationSchemas = {
  createGoat: [
    body('name').trim().isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('age').isInt({ min: 0, max: 30 })
      .withMessage('Age must be between 0 and 30'),
    body('weight').isFloat({ min: 0.1, max: 200 })
      .withMessage('Weight must be between 0.1 and 200 kg'),
    body('gender').isIn(['male', 'female'])
      .withMessage('Gender must be either male or female'),
    body('birthDate').isISO8601()
      .withMessage('Invalid date format. Use ISO 8601 format (YYYY-MM-DD)')
  ],
  
  updateHealthRecord: [
    body('temperature').optional().isFloat({ min: 35, max: 42 })
      .withMessage('Temperature must be between 35°C and 42°C'),
    body('weight').optional().isFloat({ min: 0.1, max: 200 })
      .withMessage('Weight must be between 0.1 and 200 kg'),
    body('notes').optional().isLength({ max: 1000 })
      .withMessage('Notes cannot exceed 1000 characters')
  ]
};

// Security headers middleware
const securityMiddleware = [
  ...securityHeaders,
  rateLimiter,
  (req, res, next) => {
    // Additional security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  }
];

module.exports = {
  securityMiddleware,
  csrfProtection,
  validateInput,
  validationSchemas,
  rateLimiter
};
