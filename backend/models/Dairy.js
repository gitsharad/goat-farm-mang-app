const mongoose = require('mongoose');

const dairySchema = new mongoose.Schema({
  animalId: { type: String, required: true, unique: true },
  name: { type: String },
  breed: { 
    type: String, 
    required: true,
    enum: ['Holstein Friesian', 'Jersey', 'Sahiwal', 'Gir', 'Red Sindhi', 'Tharparkar', 'Other']
  },
  dateOfBirth: { type: Date },
  gender: {
    type: String,
    enum: ['Male', 'Female'],
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Dry', 'Pregnant', 'Sick', 'Sold', 'Deceased'],
    default: 'Active'
  },
  lactation: {
    currentLactationNumber: { type: Number, default: 0 },
    daysInMilk: { type: Number, default: 0 },
    lastCalvingDate: { type: Date },
    pregnancyStatus: {
      isPregnant: { type: Boolean, default: false },
      breedingDate: { type: Date },
      expectedCalvingDate: { type: Date },
      confirmed: { type: Boolean, default: false }
    }
  },
  milkProduction: {
    dailyAverage: { type: Number, default: 0 },
    lastRecorded: { type: Date },
    records: [{
      date: { type: Date, default: Date.now },
      morning: { type: Number, default: 0 },
      evening: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      fatPercentage: { type: Number },
      snfPercentage: { type: Number },
      notes: { type: String }
    }]
  },
  health: {
    vaccination: [{
      name: { type: String, required: true },
      date: { type: Date, required: true },
      nextDueDate: { type: Date },
      notes: { type: String }
    }],
    medicalHistory: [{
      date: { type: Date, default: Date.now },
      diagnosis: { type: String, required: true },
      treatment: { type: String },
      medication: { type: String },
      vetName: { type: String },
      notes: { type: String }
    }],
    currentStatus: {
      type: String,
      enum: ['Healthy', 'Sick', 'Under Treatment', 'Critical'],
      default: 'Healthy'
    }
  },
  feeding: {
    dailyRation: { type: String },
    supplements: [{
      name: { type: String },
      quantity: { type: String },
      frequency: { type: String }
    }]
  },
  breeding: {
    breedingHistory: [{
      date: { type: Date, required: true },
      bullId: { type: String },
      bullBreed: { type: String },
      method: { type: String, enum: ['Natural', 'AI', 'ET'] },
      result: { type: String, enum: ['Pregnant', 'Open', 'Aborted'] },
      notes: { type: String }
    }]
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
dairySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add text index for search functionality
dairySchema.index({
  animalId: 'text',
  name: 'text',
  breed: 'text',
  status: 'text'
});

// Calculate total milk production for a date range
dairySchema.methods.getMilkProduction = function(startDate, endDate) {
  return this.milkProduction.records.filter(record => {
    return record.date >= startDate && record.date <= endDate;
  }).reduce((total, record) => total + record.total, 0);
};

module.exports = mongoose.model('Dairy', dairySchema);
