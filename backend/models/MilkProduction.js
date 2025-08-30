const mongoose = require('mongoose');

const MilkProductionSchema = new mongoose.Schema({
  goatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goat',
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  timeOfDay: {
    type: String,
    required: true,
    enum: ['morning', 'afternoon', 'evening', 'night'],
  },
  notes: {
    type: String,
    trim: true,
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
MilkProductionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create a compound index for better query performance
MilkProductionSchema.index({ goatId: 1, date: -1 });

module.exports = mongoose.model('MilkProduction', MilkProductionSchema);
