const express = require('express');
const router = express.Router();
const HealthRecord = require('../models/HealthRecord');
const Goat = require('../models/Goat');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// Get all health records with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      goatId, 
      type, 
      startDate, 
      endDate,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    
    if (goatId) filter.goat = goatId;
    if (type) filter.type = type;
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const records = await HealthRecord.find(filter)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('goat', 'name tagNumber breed')
      .populate('createdBy', 'firstName lastName');

    const total = await HealthRecord.countDocuments(filter);

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

// Get health record by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const record = await HealthRecord.findById(req.params.id)
      .populate('goat', 'name tagNumber breed')
      .populate('createdBy', 'firstName lastName');
    
    if (!record) {
      return res.status(404).json({ message: 'Health record not found' });
    }
    
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new health record
router.post('/', [
  auth,
  body('goat').isMongoId().withMessage('Valid goat ID is required'),
  body('type').isIn(['Vaccination', 'Deworming', 'Treatment', 'Checkup', 'Surgery', 'Other']).withMessage('Valid type is required'),
  body('description').notEmpty().withMessage('Description is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify goat exists
    const goat = await Goat.findById(req.body.goat);
    if (!goat) {
      return res.status(404).json({ message: 'Goat not found' });
    }

    const record = new HealthRecord(req.body);
    const savedRecord = await record.save();

    // Update goat health status if needed
    if (req.body.type === 'Vaccination') {
      await Goat.findByIdAndUpdate(req.body.goat, {
        'health.vaccinated': true,
        'health.lastVaccination': req.body.date || new Date()
      });
    }

    if (req.body.type === 'Deworming') {
      await Goat.findByIdAndUpdate(req.body.goat, {
        'health.dewormed': true,
        'health.lastDeworming': req.body.date || new Date()
      });
    }

    const populatedRecord = await HealthRecord.findById(savedRecord._id)
      .populate('goat', 'name tagNumber breed')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json(populatedRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update health record
router.put('/:id', auth, async (req, res) => {
  try {
    const record = await HealthRecord.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('goat', 'name tagNumber breed')
     .populate('createdBy', 'firstName lastName');
    
    if (!record) {
      return res.status(404).json({ message: 'Health record not found' });
    }
    
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete health record
router.delete('/:id', auth, async (req, res) => {
  try {
    const record = await HealthRecord.findByIdAndDelete(req.params.id);
    
    if (!record) {
      return res.status(404).json({ message: 'Health record not found' });
    }
    
    res.json({ message: 'Health record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get upcoming health events
router.get('/upcoming/events', auth, async (req, res) => {
  try {
    const upcoming = await HealthRecord.find({
      nextDueDate: { $gte: new Date() }
    })
    .sort({ nextDueDate: 1 })
    .populate('goat', 'name tagNumber breed')
    .limit(20);

    res.json(upcoming);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get health statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = await HealthRecord.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalCost: { $sum: '$cost' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const monthlyStats = await HealthRecord.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          count: { $sum: 1 },
          totalCost: { $sum: '$cost' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      byType: stats,
      monthlyTrend: monthlyStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 