const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Poultry = require('../models/Poultry');
const PoultryFeedRecord = require('../models/PoultryFeedRecord');

// List poultry feed records
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, poultryId, coop, feedType, startDate, endDate, sortBy = 'date', sortOrder = 'desc' } = req.query;

    const filter = { createdBy: req.user.id };
    if (poultryId) filter.poultry = poultryId;
    if (coop) filter.coop = coop;
    if (feedType) filter.feedType = feedType;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const records = await PoultryFeedRecord.find(filter)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('poultry', 'tagNumber batchNumber breed type')
      .populate('createdBy', 'firstName lastName');

    const total = await PoultryFeedRecord.countDocuments(filter);

    res.json({
      records,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get by id
router.get('/:id', auth, async (req, res) => {
  try {
    const record = await PoultryFeedRecord.findOne({ _id: req.params.id, createdBy: req.user.id })
      .populate('poultry', 'tagNumber batchNumber breed type')
      .populate('createdBy', 'firstName lastName');
    if (!record) return res.status(404).json({ message: 'Poultry feed record not found' });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create
router.post('/', [
  auth,
  body('poultry').isMongoId().withMessage('Valid poultry ID is required'),
  body('feedType').isIn([
    'Starter', 'Pre-Starter', 'Grower', 'Finisher', 'Layer', 'Breeder',
    'Chick Starter', 'Broiler Starter', 'Broiler Grower', 'Broiler Finisher',
    'Grain', 'Maize/Corn', 'Soybean Meal', 'Fish Meal', 'Vitamins', 'Minerals',
    'Grit', 'Oyster Shell', 'Mash', 'Crumbles', 'Pellets', 'Scratch', 'Greens',
    'Water', 'Probiotics', 'Supplement', 'Medicated Feed', 'Other'
  ]).withMessage('Valid feed type is required'),
  body('quantity').isNumeric().withMessage('Valid quantity is required'),
  body('unit').isIn(['kg', 'g', 'lbs', 'tonnes', 'liters', 'ml', 'gallons', 'scoops', 'bags']).withMessage('Valid unit is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const poultry = await Poultry.findOne({ _id: req.body.poultry, createdBy: req.user.id });
    if (!poultry) return res.status(404).json({ message: 'Poultry not found' });

    const record = new PoultryFeedRecord({ ...req.body, createdBy: req.user.id });
    const saved = await record.save();
    const populated = await PoultryFeedRecord.findById(saved._id)
      .populate('poultry', 'tagNumber batchNumber breed type')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update
router.put('/:id', auth, async (req, res) => {
  try {
    const record = await PoultryFeedRecord.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate('poultry', 'tagNumber batchNumber breed type')
     .populate('createdBy', 'firstName lastName');

    if (!record) return res.status(404).json({ message: 'Poultry feed record not found' });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const record = await PoultryFeedRecord.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!record) return res.status(404).json({ message: 'Poultry feed record not found' });
    res.json({ message: 'Poultry feed record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Stats: consumption
router.get('/stats/consumption', auth, async (req, res) => {
  try {
    const { startDate, endDate, feedType } = req.query;

    const filter = { createdBy: req.user.id };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (feedType) filter.feedType = feedType;

    const consumption = await PoultryFeedRecord.aggregate([
      { $match: filter },
      { $group: { _id: '$feedType', totalQuantity: { $sum: '$quantity' }, totalCost: { $sum: '$cost' }, totalConsumed: { $sum: '$consumed' }, totalWaste: { $sum: '$waste' }, count: { $sum: 1 } } },
      { $sort: { totalQuantity: -1 } }
    ]);

    const dailyTrend = await PoultryFeedRecord.aggregate([
      { $match: filter },
      { $group: { _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, feedType: '$feedType' }, quantity: { $sum: '$quantity' }, cost: { $sum: '$cost' } } },
      { $sort: { '_id.date': -1 } },
      { $limit: 30 }
    ]);

    res.json({ consumption, dailyTrend });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
