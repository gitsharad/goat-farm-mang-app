const mongoose = require('mongoose');

const poultrySchema = new mongoose.Schema({
  tagNumber: { type: String, required: true, unique: true },
  batchNumber: { type: String, required: true },
  breed: { 
    type: String, 
    required: true,
    enum: ['Broiler', 'Layer', 'Desi', 'Kadaknath', 'Aseel', 'Rhode Island Red', 'Other']
  },
  type: { 
    type: String, 
    required: true,
    enum: ['Broiler', 'Layer', 'Breeder', 'Dual Purpose']
  },
  dateOfHatch: { type: Date },
  source: { type: String },
  quantity: { type: Number, required: true, default: 1 },
  currentAgeInWeeks: { type: Number },
  status: {
    type: String,
    enum: ['Active', 'Sold', 'Mortality', 'Culled', 'Other'],
    default: 'Active'
  },
  location: { type: String },
  vaccination: [{
    vaccine: { type: String, required: true },
    date: { type: Date, required: true },
    nextDate: { type: Date },
    notes: { type: String }
  }],
  production: {
    eggProduction: {
      dailyAverage: { type: Number, default: 0 },
      lastRecorded: { type: Date }
    },
    weight: {
      current: { type: Number },
      lastWeighed: { type: Date }
    },
    feed: {
      type: { type: String },
      dailyConsumption: { type: Number }
    }
  },
  health: {
    status: {
      type: String,
      enum: ['Healthy', 'Sick', 'Under Treatment', 'Recovering', 'Critical'],
      default: 'Healthy'
    },
    notes: { type: String }
  },
  notes: { type: String },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
poultrySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add text index for search functionality
poultrySchema.index({
  tagNumber: 'text',
  batchNumber: 'text',
  breed: 'text',
  type: 'text',
  status: 'text'
});

module.exports = mongoose.model('Poultry', poultrySchema);
