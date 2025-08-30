/**
 * CORS Error Handler Middleware
 * Provides better error messages and logging for CORS-related issues
 */
const corsErrorHandler = (err, req, res, next) => {
  // Handle CORS errors
  if (err.name === 'CorsError') {
    console.error('CORS Error:', {
      method: req.method,
      path: req.path,
      origin: req.headers.origin,
      referer: req.headers.referer,
      userAgent: req.headers['user-agent'],
      error: err.message
    });

    return res.status(403).json({
      success: false,
      error: {
        code: 'CORS_ERROR',
        message: 'Not allowed by CORS',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      }
    });
  }
  
  next(err);
};

module.exports = corsErrorHandler;
