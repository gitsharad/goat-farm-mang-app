const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['Admin', 'Manager', 'Worker', 'Viewer'],
    default: 'Worker'
  },
  // Primary farm type for default views/navigation
  primaryFarmType: {
    type: String,
    enum: ['goat', 'poultry', 'dairy'],
    required: true,
    default: 'goat'
  },
  // Multiple farm types the user/farm operates
  farmTypes: [{
    type: String,
    enum: ['goat', 'poultry', 'dairy']
  }],
  refreshToken: {
    type: String,
    select: false // Don't include this field by default in queries
  },
  permissions: {
    canManageGoats: { type: Boolean, default: true },
    canManageHealth: { type: Boolean, default: true },
    canManageBreeding: { type: Boolean, default: true },
    canManageFeed: { type: Boolean, default: true },
    canManageUsers: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: true }
  },
  phone: String,
  address: String,
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  profileImage: String
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Indexes
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ primaryFarmType: 1 });
userSchema.index({ farmTypes: 1 });

module.exports = mongoose.model('User', userSchema); 