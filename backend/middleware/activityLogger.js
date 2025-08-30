const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const winston = require('winston');
const { format } = winston;
const { v4: uuidv4 } = require('uuid');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',  
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'goat-farm-api' },
  transports: [
    // Write all logs with level `error` and below to `error.log`
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error' 
    }),
    // Write all logs with level `info` and below to `combined.log`
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log') 
    })
  ]
});

// If we're not in production, log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

// Custom activity logger
const activityLogger = (req, res, next) => {
  const requestId = uuidv4();
  const startTime = Date.now();
  
  // Log request details
  logger.info({
    requestId,
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    query: req.query,
    headers: {
      'user-agent': req.headers['user-agent'],
      referer: req.headers.referer || '',
      origin: req.headers.origin || '',
      'x-forwarded-for': req.headers['x-forwarded-for'] || req.connection.remoteAddress
    },
    userId: req.user ? req.user._id : 'unauthenticated',
    timestamp: new Date().toISOString(),
    type: 'request'
  });

  // Log response details
  const originalSend = res.send;
  res.send = function (body) {
    const responseTime = Date.now() - startTime;
    
    logger.info({
      requestId,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      type: 'response',
      userId: req.user ? req.user._id : 'unauthenticated'
    });
    
    return originalSend.call(this, body);
  };

  next();
};

// Error logger
const errorLogger = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    userId: req.user ? req.user._id : 'unauthenticated',
    timestamp: new Date().toISOString(),
    type: 'error'
  });
  
  next(err);
};

// Activity tracking for specific events
const trackActivity = (activityType, userId, details = {}) => {
  logger.info({
    activityType,
    userId,
    details,
    timestamp: new Date().toISOString(),
    type: 'activity'
  });};

module.exports = {
  logger,
  activityLogger,
  errorLogger,
  trackActivity
};
