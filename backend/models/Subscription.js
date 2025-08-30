const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['goat', 'poultry', 'dairy'],
    required: true,
    default: 'goat'
  },
  farmTypeAccess: {
    goat: {
      type: Boolean,
      default: false
    },
    poultry: {
      type: Boolean,
      default: false
    },
    dairy: {
      type: Boolean,
      default: false
    }
  },
  features: {
    maxAnimals: {
      type: Number,
      default: 50
    },
    healthTracking: {
      type: Boolean,
      default: true
    },
    breedingManagement: {
      type: Boolean,
      default: false
    },
    feedManagement: {
      type: Boolean,
      default: false
    },
    analytics: {
      type: Boolean,
      default: false
    },
    mobileApp: {
      type: Boolean,
      default: false
    },
    apiAccess: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'cancelled'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  // Trial fields
  isTrial: {
    type: Boolean,
    default: false,
    index: true
  },
  trialStartDate: {
    type: Date
  },
  trialEndDate: {
    type: Date
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'failed', 'refunded'],
    default: 'pending'
  },
  amount: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  }
}, {
  timestamps: true
});

// Ensure a user can have at most one subscription per plan (farm type),
// but can hold multiple different plans concurrently.
subscriptionSchema.index({ userId: 1, plan: 1 }, { unique: true });

// Static method to get subscription plans
subscriptionSchema.statics.getPlans = function() {
  return {
    goat: {
      name: 'Goat Plan',
      price: 9.99,
      duration: 30, // days
      farmTypeAccess: { goat: true, poultry: false, dairy: false },
      features: {
        maxAnimals: 200,
        healthTracking: true,
        breedingManagement: true,
        feedManagement: true,
        analytics: false,
        mobileApp: false,
        apiAccess: false
      }
    },
    poultry: {
      name: 'Poultry Plan',
      price: 9.99,
      duration: 30, // days
      farmTypeAccess: { goat: false, poultry: true, dairy: false },
      features: {
        maxAnimals: 200,
        healthTracking: true,
        breedingManagement: true,
        feedManagement: true,
        analytics: false,
        mobileApp: false,
        apiAccess: false
      }
    },
    dairy: {
      name: 'Dairy Plan',
      price: 9.99,
      duration: 30, // days
      farmTypeAccess: { goat: false, poultry: false, dairy: true },
      features: {
        maxAnimals: 200,
        healthTracking: true,
        breedingManagement: true,
        feedManagement: true,
        analytics: false,
        mobileApp: false,
        apiAccess: false
      }
    }
  };
};

// Instance method to check if subscription is active
subscriptionSchema.methods.isActive = function() {
  const now = new Date();
  const trialActive = this.isTrial && this.trialStartDate && this.trialEndDate && now <= this.trialEndDate;
  // Consider subscription active if status is active and within endDate (regardless of paymentStatus)
  const paidActive = this.status === 'active' && now <= this.endDate;
  return trialActive || paidActive;
};

// Instance method to check farm type access
subscriptionSchema.methods.hasFarmTypeAccess = function(farmType) {
  // During active trial, all farm types are accessible
  const now = new Date();
  const trialActive = this.isTrial && this.trialStartDate && this.trialEndDate && now <= this.trialEndDate;
  if (trialActive) return true;
  return this.isActive() && this.farmTypeAccess[farmType] === true;
};

// Instance method to get accessible farm types
subscriptionSchema.methods.getAccessibleFarmTypes = function() {
  const now = new Date();
  const trialActive = this.isTrial && this.trialStartDate && this.trialEndDate && now <= this.trialEndDate;
  if (trialActive) return ['goat', 'poultry', 'dairy'];
  if (!this.isActive()) return [];

  const accessible = [];
  if (this.farmTypeAccess.goat) accessible.push('goat');
  if (this.farmTypeAccess.poultry) accessible.push('poultry');
  if (this.farmTypeAccess.dairy) accessible.push('dairy');

  return accessible;
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
