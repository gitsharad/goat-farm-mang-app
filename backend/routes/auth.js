const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role, primaryFarmType, farmTypes } = req.body;

    // Validate farm types (allow multiple); require at least one
    const cleanedFarmTypes = Array.isArray(farmTypes)
      ? farmTypes.filter(t => ['goat', 'poultry', 'dairy'].includes(t))
      : [];
    const resolvedPrimary = primaryFarmType && ['goat', 'poultry', 'dairy'].includes(primaryFarmType)
      ? primaryFarmType
      : (cleanedFarmTypes[0] || undefined);

    if (!resolvedPrimary || cleanedFarmTypes.length === 0) {
      return res.status(400).json({ message: 'Select at least one valid farm type' });
    }

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      role: role || 'Worker',
      primaryFarmType: resolvedPrimary,
      farmTypes: cleanedFarmTypes
    });

    await user.save();

    // Create default basic subscription
    const plans = Subscription.getPlans();
    const basicPlan = plans.basic;
    
    const subscription = new Subscription({
      userId: user._id,
      plan: 'basic',
      farmTypeAccess: basicPlan.farmTypeAccess,
      features: basicPlan.features,
      endDate: new Date(Date.now() + basicPlan.duration * 24 * 60 * 60 * 1000),
      paymentStatus: 'paid'
    });
    
    await subscription.save();

    // Create JWT token
    const payload = {
      userId: user._id,
      role: user.role,
      primaryFarmType: user.primaryFarmType
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '7d' // Extend to 7 days for development
    });
    
    // Create refresh token with longer expiration
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      { expiresIn: '30d' }
    );
    
    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      token,
      refreshToken,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        primaryFarmType: user.primaryFarmType,
        farmTypes: user.farmTypes
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Basic input validation
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last login without triggering full validation on legacy users
    await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

    // Create JWT token
    const payload = {
      userId: user._id,
      role: user.role,
      primaryFarmType: user.primaryFarmType
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '7d' // Extend to 7 days for development
    });
    
    // Create refresh token with longer expiration
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      { expiresIn: '30d' }
    );
    
    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      token,
      refreshToken,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        primaryFarmType: user.primaryFarmType,
        farmTypes: user.farmTypes
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Server error during login' });
  }
});

// Refresh token endpoint
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
    );
    
    // Find user with this refresh token
    const user = await User.findOne({ 
      _id: decoded.userId, 
      refreshToken: refreshToken 
    });
    
    if (!user) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }
    
    // Create new access token
    const payload = {
      userId: user._id,
      role: user.role,
      primaryFarmType: user.primaryFarmType
    };
    
    const newToken = jwt.sign(
      payload, 
      process.env.JWT_SECRET || 'your-secret-key', 
      { expiresIn: '7d' }
    );
    
    // Optionally create a new refresh token as well (refresh token rotation)
    const newRefreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      { expiresIn: '30d' }
    );
    
    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save();
    
    res.json({
      token: newToken,
      refreshToken: newRefreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        primaryFarmType: user.primaryFarmType,
        farmTypes: user.farmTypes
      }
    });
    
  } catch (error) {
    console.error('Refresh token error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Refresh token has expired' });
    }
    res.status(500).json({ message: 'Server error during token refresh' });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (userId) {
      // Remove refresh token from user
      await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
    }
    
    res.status(200).json({ message: 'Successfully logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

module.exports = router;
