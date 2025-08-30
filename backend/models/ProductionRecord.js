const mongoose = require('mongoose');

const productionRecordSchema = new mongoose.Schema({
  poultry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poultry',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  eggsProduced: {
    type: Number,
    required: true,
    min: 0,
  },
  eggsDamaged: {
    type: Number,
    default: 0,
    min: 0,
  },
  notes: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('ProductionRecord', productionRecordSchema);
