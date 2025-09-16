const mongoose = require('mongoose');

// Static method to get available breeds
const getAvailableBreeds = () => {
  return goatSchema.path('breed').enumValues;
};

const goatSchema = new mongoose.Schema({
  tagNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  breed: {
    type: String,
    required: true,
    enum: ['Boer', 'Nubian', 'Alpine', 'Saanen', 'Toggenburg', 'LaMancha', 'Jamunapari', 'Sirohi', 'Barbari', 'Osmanabadi', 'Malabari', 'Surti', 'Jakhrana', 'Marwari', 'Mixed', 'Other']
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female']
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  weight: {
    current: { type: Number, min: 0 },
    birth: { type: Number, min: 0 },
    weaning: { type: Number, min: 0 },
    yearling: { type: Number, min: 0 }
  },
  color: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Sold', 'Deceased', 'Retired'],
    default: 'Active'
  },
  saleDetails: {
    saleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' },
    salePrice: { type: Number, min: 0 },
    saleDate: { type: Date }
  },
  health: {
    vaccinated: { type: Boolean, default: false },
    lastVaccination: Date,
    dewormed: { type: Boolean, default: false },
    lastDeworming: Date,
    healthNotes: String
  },
  breeding: {
    isPregnant: { type: Boolean, default: false },
    dueDate: Date,
    lastBreeding: Date,
    sire: { type: mongoose.Schema.Types.ObjectId, ref: 'Goat' },
    offspring: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Goat' }]
  },
  production: {
    milkProduction: {
      daily: { type: Number, min: 0 },
      weekly: { type: Number, min: 0 },
      monthly: { type: Number, min: 0 }
    },
    kiddingHistory: [{
      date: Date,
      kidsBorn: Number,
      kidsSurvived: Number,
      notes: String
    }]
  },
  location: {
    pen: String,
    section: String
  },
  notes: String,
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
goatSchema.index({ tagNumber: 1 });
goatSchema.index({ breed: 1 });
goatSchema.index({ status: 1 });
goatSchema.index({ gender: 1 });
goatSchema.index({ dateOfBirth: 1 });

// Virtual for age calculation
goatSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.dateOfBirth) / (1000 * 60 * 60 * 24 * 365.25));
});

// Pre-save middleware to update updatedAt
goatSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add static method to the schema
goatSchema.statics.getAvailableBreeds = getAvailableBreeds;

module.exports = mongoose.model('Goat', goatSchema); 