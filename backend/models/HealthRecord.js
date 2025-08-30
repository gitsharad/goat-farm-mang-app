const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
  goat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goat',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  type: {
    type: String,
    required: true,
    enum: ['Vaccination', 'Deworming', 'Treatment', 'Checkup', 'Surgery', 'Other']
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  veterinarian: {
    type: String,
    trim: true
  },
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
    notes: String
  }],
  cost: {
    type: Number,
    min: 0
  },
  nextDueDate: Date,
  notes: String,
  attachments: [String], // URLs to medical documents/images
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
healthRecordSchema.index({ goat: 1, date: -1 });
healthRecordSchema.index({ type: 1 });
healthRecordSchema.index({ nextDueDate: 1 });

module.exports = mongoose.model('HealthRecord', healthRecordSchema); 