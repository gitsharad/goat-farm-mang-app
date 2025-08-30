const mongoose = require('mongoose');

const dairyFeedRecordSchema = new mongoose.Schema({
  dairy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dairy'
  },
  pen: String,
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  feedType: {
    type: String,
    required: true,
    enum: ['Grass', 'Silage', 'Hay', 'Concentrate', 'Mineral', 'Water', 'Other']
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

dairyFeedRecordSchema.index({ dairy: 1, date: -1 });
dairyFeedRecordSchema.index({ pen: 1, date: -1 });
dairyFeedRecordSchema.index({ feedType: 1 });
dairyFeedRecordSchema.index({ date: 1 });

module.exports = mongoose.model('DairyFeedRecord', dairyFeedRecordSchema);
