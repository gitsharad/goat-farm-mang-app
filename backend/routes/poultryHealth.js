const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Poultry = require('../models/Poultry');
const PoultryHealthRecord = require('../models/PoultryHealthRecord');

// List poultry health records
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, poultryId, type, startDate, endDate, sortBy = 'date', sortOrder = 'desc' } = req.query;

    const filter = { createdBy: req.user.id };
    if (poultryId) filter.poultry = poultryId;
    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const records = await PoultryHealthRecord.find(filter)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('poultry', 'tagNumber batchNumber breed type')
      .populate('createdBy', 'firstName lastName');

    const total = await PoultryHealthRecord.countDocuments(filter);

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
    const record = await PoultryHealthRecord.findOne({ _id: req.params.id, createdBy: req.user.id })
      .populate('poultry', 'tagNumber batchNumber breed type')
      .populate('createdBy', 'firstName lastName');
    if (!record) return res.status(404).json({ message: 'Poultry health record not found' });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create
router.post('/', [
  auth,
  body('poultry').isMongoId().withMessage('Valid poultry ID is required'),
  body('type').isIn(['Vaccination', 'Deworming', 'Treatment', 'Checkup', 'Surgery', 'Other']).withMessage('Valid type is required'),
  body('description').notEmpty().withMessage('Description is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // verify poultry exists and belongs to user
    const poultry = await Poultry.findOne({ _id: req.body.poultry, createdBy: req.user.id });
    if (!poultry) return res.status(404).json({ message: 'Poultry not found' });

    const record = new PoultryHealthRecord({ ...req.body, createdBy: req.user.id });
    const saved = await record.save();
    const populated = await PoultryHealthRecord.findById(saved._id)
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
    const record = await PoultryHealthRecord.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate('poultry', 'tagNumber batchNumber breed type')
     .populate('createdBy', 'firstName lastName');

    if (!record) return res.status(404).json({ message: 'Poultry health record not found' });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const record = await PoultryHealthRecord.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!record) return res.status(404).json({ message: 'Poultry health record not found' });
    res.json({ message: 'Poultry health record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upcoming events
router.get('/upcoming/events', auth, async (req, res) => {
  try {
    const upcoming = await PoultryHealthRecord.find({
      createdBy: req.user.id,
      nextDueDate: { $gte: new Date() }
    })
    .sort({ nextDueDate: 1 })
    .populate('poultry', 'tagNumber batchNumber breed type')
    .limit(20);

    res.json(upcoming);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Stats overview
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const byType = await PoultryHealthRecord.aggregate([
      { $match: { createdBy: req.user._id } },
      { $group: { _id: '$type', count: { $sum: 1 }, totalCost: { $sum: '$cost' } } },
      { $sort: { count: -1 } }
    ]);

    const monthlyTrend = await PoultryHealthRecord.aggregate([
      { $match: { createdBy: req.user._id } },
      { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, count: { $sum: 1 }, totalCost: { $sum: '$cost' } } },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({ byType, monthlyTrend });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
