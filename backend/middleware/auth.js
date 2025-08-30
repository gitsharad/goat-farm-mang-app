const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

module.exports = async function (req, res, next) {
  // Get token from header
  const authHeader = req.header('Authorization');

  // Check if not token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('No valid auth token found in header', { 
      authHeader: authHeader ? 'Present' : 'Missing',
      url: req.originalUrl,
      method: req.method
    });
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    
    logger.debug('Verifying token', { 
      token: token ? 'present' : 'missing',
      secretSet: !!process.env.JWT_SECRET
    });
    
    const decoded = jwt.verify(token, jwtSecret);
    
    logger.debug('Token decoded', { 
      userId: decoded.userId,
      role: decoded.role,
      primaryFarmType: decoded.primaryFarmType
    });
    
    // Get full user data from database
    const user = await User.findById(decoded.userId).select('-password -refreshToken');
    
    if (!user) {
      logger.warn('User not found in database', { 
        userId: decoded.userId,
        url: req.originalUrl,
        method: req.method
      });
      return res.status(401).json({ 
        msg: 'User not found',
        error: 'user_not_found',
        userId: decoded.userId
      });
    }
    
    logger.debug('User found', { 
      userId: user._id,
      username: user.username,
      role: user.role 
    });

    // Set user data for routes
    req.user = {
      _id: user._id,
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      primaryFarmType: user.primaryFarmType
    };
    
    next();
  } catch (err) {
    logger.error('Auth middleware error', { 
      error: err.message, 
      stack: err.stack,
      url: req.originalUrl,
      authHeader: req.header('Authorization') ? 'Present' : 'Missing'
    });
    res.status(401).json({ 
      msg: 'Token is not valid',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
