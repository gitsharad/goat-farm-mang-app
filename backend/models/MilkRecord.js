const mongoose = require('mongoose');

const MilkRecordSchema = new mongoose.Schema({
  goat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goat',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  fat: {
    type: Number,
    min: 0,
    max: 20
  },
  snf: {
    type: Number,
    min: 0,
    max: 20
  },
  notes: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
MilkRecordSchema.index({ goat: 1, date: -1 });
MilkRecordSchema.index({ farm: 1, date: -1 });

module.exports = mongoose.model('MilkRecord', MilkRecordSchema);
