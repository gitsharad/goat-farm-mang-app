const mongoose = require('mongoose');

const weightRecordSchema = new mongoose.Schema({
  goat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goat',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  weight: {
    type: Number, // kilograms
    required: true,
    min: 0
  },
  source: {
    type: String,
    enum: ['scale', 'estimate', 'other'],
    default: 'scale'
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Prevent duplicate weight entries per goat for the same day
weightRecordSchema.index({ goat: 1, date: 1 });

module.exports = mongoose.model('WeightRecord', weightRecordSchema);
