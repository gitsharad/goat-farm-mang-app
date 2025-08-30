const mongoose = require('mongoose');

const poultryHealthRecordSchema = new mongoose.Schema({
  poultry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poultry',
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
  attachments: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

poultryHealthRecordSchema.index({ poultry: 1, date: -1 });
poultryHealthRecordSchema.index({ type: 1 });
poultryHealthRecordSchema.index({ nextDueDate: 1 });

module.exports = mongoose.model('PoultryHealthRecord', poultryHealthRecordSchema);
