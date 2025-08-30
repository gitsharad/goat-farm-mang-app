const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Dairy = require('../models/Dairy');
const DairyHealthRecord = require('../models/DairyHealthRecord');

// List dairy health records
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, dairyId, type, startDate, endDate, sortBy = 'date', sortOrder = 'desc' } = req.query;

    const filter = { createdBy: req.user.id };
    if (dairyId) filter.dairy = dairyId;
    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const records = await DairyHealthRecord.find(filter)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('dairy', 'tagNumber breed status')
      .populate('createdBy', 'firstName lastName');

    const total = await DairyHealthRecord.countDocuments(filter);

    res.json({ records, totalPages: Math.ceil(total / limit), currentPage: page, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get by id
router.get('/:id', auth, async (req, res) => {
  try {
    const record = await DairyHealthRecord.findOne({ _id: req.params.id, createdBy: req.user.id })
      .populate('dairy', 'tagNumber breed status')
      .populate('createdBy', 'firstName lastName');
    if (!record) return res.status(404).json({ message: 'Dairy health record not found' });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create
router.post('/', [
  auth,
  body('dairy').isMongoId().withMessage('Valid dairy animal ID is required'),
  body('type').isIn(['Vaccination', 'Deworming', 'Treatment', 'Checkup', 'Surgery', 'Other']).withMessage('Valid type is required'),
  body('description').notEmpty().withMessage('Description is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const dairy = await Dairy.findOne({ _id: req.body.dairy, createdBy: req.user.id });
    if (!dairy) return res.status(404).json({ message: 'Dairy animal not found' });

    const record = new DairyHealthRecord({ ...req.body, createdBy: req.user.id });
    const saved = await record.save();
    const populated = await DairyHealthRecord.findById(saved._id)
      .populate('dairy', 'tagNumber breed status')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update
router.put('/:id', auth, async (req, res) => {
  try {
    const record = await DairyHealthRecord.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate('dairy', 'tagNumber breed status')
     .populate('createdBy', 'firstName lastName');

    if (!record) return res.status(404).json({ message: 'Dairy health record not found' });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const record = await DairyHealthRecord.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!record) return res.status(404).json({ message: 'Dairy health record not found' });
    res.json({ message: 'Dairy health record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upcoming events
router.get('/upcoming/events', auth, async (req, res) => {
  try {
    const upcoming = await DairyHealthRecord.find({ createdBy: req.user.id, nextDueDate: { $gte: new Date() } })
      .sort({ nextDueDate: 1 })
      .populate('dairy', 'tagNumber breed status')
      .limit(20);
    res.json(upcoming);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Stats overview
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const byType = await DairyHealthRecord.aggregate([
      { $match: { createdBy: req.user._id } },
      { $group: { _id: '$type', count: { $sum: 1 }, totalCost: { $sum: '$cost' } } },
      { $sort: { count: -1 } }
    ]);

    const monthlyTrend = await DairyHealthRecord.aggregate([
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
