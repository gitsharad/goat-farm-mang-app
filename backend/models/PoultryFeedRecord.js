const mongoose = require('mongoose');

const poultryFeedRecordSchema = new mongoose.Schema({
  poultry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poultry'
  },
  coop: String,
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  feedType: {
    type: String,
    required: true,
    enum: [
      'Starter', 'Pre-Starter', 'Grower', 'Finisher', 'Layer', 'Breeder',
      'Chick Starter', 'Broiler Starter', 'Broiler Grower', 'Broiler Finisher',
      'Grain', 'Maize/Corn', 'Soybean Meal', 'Fish Meal', 'Vitamins', 'Minerals',
      'Grit', 'Oyster Shell', 'Mash', 'Crumbles', 'Pellets', 'Scratch', 'Greens',
      'Water', 'Probiotics', 'Supplement', 'Medicated Feed', 'Other'
    ]
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'g', 'lbs', 'tonnes', 'liters', 'ml', 'gallons', 'scoops', 'bags']
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

poultryFeedRecordSchema.index({ poultry: 1, date: -1 });
poultryFeedRecordSchema.index({ coop: 1, date: -1 });
poultryFeedRecordSchema.index({ feedType: 1 });
poultryFeedRecordSchema.index({ date: 1 });

module.exports = mongoose.model('PoultryFeedRecord', poultryFeedRecordSchema);
