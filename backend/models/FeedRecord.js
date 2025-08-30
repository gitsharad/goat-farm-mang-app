const mongoose = require('mongoose');

const feedRecordSchema = new mongoose.Schema({
  goat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goat'
  },
  pen: String, // If feeding by pen rather than individual goat
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  feedType: {
    type: String,
    required: true,
    enum: ['Hay', 'Grain', 'Pasture', 'Silage', 'Mineral', 'Mineral Supplement', 'Concentrate', 'Pellets', 'Water', 'Other']
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'lbs', 'liters', 'gallons', 'bales', 'scoops']
  },
  cost: {
    type: Number,
    min: 0
  },
  supplier: String,
  notes: String,
  feedingTime: {
    type: String,
    enum: ['Morning', 'Afternoon', 'Evening', 'Night', 'Continuous']
  },
  consumed: {
    type: Number,
    min: 0
  },
  waste: {
    type: Number,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
feedRecordSchema.index({ goat: 1, date: -1 });
feedRecordSchema.index({ pen: 1, date: -1 });
feedRecordSchema.index({ feedType: 1 });
feedRecordSchema.index({ date: 1 });

module.exports = mongoose.model('FeedRecord', feedRecordSchema); 