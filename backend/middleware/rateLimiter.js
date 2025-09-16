const rateLimit = require('express-rate-limit');

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 100 : 5000, // Much higher limit in development
  message: {
    error: 'Too many requests from this IP, please try again after 1 minute',
    status: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development' && !req.path.startsWith('/api/auth')
});

// More aggressive rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 20 : 1000, // Higher limit in development
  message: {
    error: 'Too many login attempts, please try again after 1 minute',
    status: 429
  },
  skip: (req) => process.env.NODE_ENV === 'development' && !req.path.startsWith('/api/auth')
});

module.exports = {
  apiLimiter,
  authLimiter
};
