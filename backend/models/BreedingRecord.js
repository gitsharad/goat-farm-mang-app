const mongoose = require('mongoose');

const breedingRecordSchema = new mongoose.Schema({
  doe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goat',
    required: true
  },
  buck: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goat',
    required: true
  },
  matingDate: {
    type: Date,
    required: true
  },
  expectedDueDate: {
    type: Date,
    required: true
  },
  actualDueDate: Date,
  pregnancyConfirmed: {
    type: Boolean,
    default: false
  },
  confirmationDate: Date,
  kiddingDate: Date,
  kidsBorn: {
    type: Number,
    min: 0,
    default: 0
  },
  kidsSurvived: {
    type: Number,
    min: 0,
    default: 0
  },
  notes: String,
  breedingMethod: {
    type: String,
    enum: ['natural', 'artificial-insemination'],
    default: 'natural'
  },
  breedingLocation: String,
  gestationPeriod: {
    type: Number, // days
    default: 150, // average goat gestation
    min: 140,
    max: 160
  },
  isOverdue: {
    type: Boolean,
    default: false
  },
  breedingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  expectedValue: {
    type: Number,
    default: 0,
    min: 0
  },
  veterinaryCost: {
    type: Number,
    default: 0,
    min: 0
  },
  healthStatus: {
    type: String,
    enum: ['healthy', 'at-risk', 'complications', 'monitoring'],
    default: 'healthy'
  },
  lastCheckupDate: Date,
  nextCheckupDate: Date,
  complications: [String],
  expectedBreed: String,
  pedigreeNotes: String,
  inbreedingCoefficient: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  previousKiddingHistory: [{
    date: Date,
    kidsBorn: Number,
    kidsSurvived: Number
  }],
  doeAge: {
    type: Number,
    min: 0
  },
  buckAge: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: ['mated', 'pregnancy-confirmed', 'pregnant', 'kidding', 'completed', 'failed'],
    default: 'mated'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
breedingRecordSchema.index({ doe: 1, matingDate: -1 });
breedingRecordSchema.index({ buck: 1, matingDate: -1 });
breedingRecordSchema.index({ expectedDueDate: 1 });
breedingRecordSchema.index({ status: 1 });
breedingRecordSchema.index({ confirmationDate: 1 });
breedingRecordSchema.index({ kiddingDate: 1 });

// Virtual for pregnancy duration
breedingRecordSchema.virtual('pregnancyDuration').get(function() {
  if (this.kiddingDate && this.matingDate) {
    return Math.floor((this.kiddingDate - this.matingDate) / (1000 * 60 * 60 * 24));
  }
  return null;
});

module.exports = mongoose.model('BreedingRecord', breedingRecordSchema); 