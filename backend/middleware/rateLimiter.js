const rateLimit = require('express-rate-limit');

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Higher limit in development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development' && req.ip === '::1' // Skip for localhost in development
});

// More aggressive rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 20 : 10000, // Higher limit in development
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes'
  },
  skip: (req) => process.env.NODE_ENV === 'development' && req.ip === '::1' // Skip for localhost in development
});

module.exports = {
  apiLimiter,
  authLimiter
};
