const express = require('express');
const router = express.Router();
const BreedingRecord = require('../models/BreedingRecord');
const Goat = require('../models/Goat');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');

// Test endpoint to verify route and database connection
router.get('/test', async (req, res) => {
  console.log('Breeding test endpoint hit');
  try {
    const count = await BreedingRecord.countDocuments();
    res.json({
      success: true,
      message: 'Breeding route is working',
      dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      recordCount: count
    });
  } catch (error) {
    console.error('Breeding test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error accessing database',
      error: error.message
    });
  }
});

// Get all breeding records with filtering
router.get('/', async (req, res) => {
  console.log('Breeding route hit. Query params:', req.query);
  try {
    const { 
      page = 1, 
      limit = 20, 
      doeId, 
      buckId, 
      status,
      startDate,
      endDate,
      sortBy = 'matingDate',
      sortOrder = 'desc',
      _t // Cache busting parameter
    } = req.query;
    
    console.log('Processing breeding records request with params:', {
      page, limit, doeId, buckId, status, startDate, endDate, sortBy, sortOrder
    });

    const filter = {};
    
    if (doeId) filter.doe = doeId;
    if (buckId) filter.buck = buckId;
    if (status) filter.status = status;
    
    if (startDate || endDate) {
      filter.matingDate = {};
      if (startDate) filter.matingDate.$gte = new Date(startDate);
      if (endDate) filter.matingDate.$lte = new Date(endDate);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const records = await BreedingRecord.find(filter)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('doe', 'name tagNumber breed')
      .populate('buck', 'name tagNumber breed')
      .populate('createdBy', 'firstName lastName');

    const total = await BreedingRecord.countDocuments(filter);

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

// Get breeding record by ID
router.get('/:id', async (req, res) => {
  try {
    const record = await BreedingRecord.findById(req.params.id)
      .populate('doe', 'name tagNumber breed')
      .populate('buck', 'name tagNumber breed')
      .populate('createdBy', 'firstName lastName');
    
    if (!record) {
      return res.status(404).json({ message: 'Breeding record not found' });
    }
    
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new breeding record
router.post('/', [
  body('doe').isMongoId().withMessage('Valid doe ID is required'),
  body('buck').isMongoId().withMessage('Valid buck ID is required'),
  body('matingDate').isISO8601().withMessage('Valid mating date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify goats exist and are correct gender
    const doe = await Goat.findById(req.body.doe);
    const buck = await Goat.findById(req.body.buck);
    
    if (!doe || !buck) {
      return res.status(404).json({ message: 'Doe or buck not found' });
    }
    
    if (doe.gender !== 'Female') {
      return res.status(400).json({ message: 'Doe must be female' });
    }
    
    if (buck.gender !== 'Male') {
      return res.status(400).json({ message: 'Buck must be male' });
    }

    // Calculate expected due date (approximately 150 days gestation)
    const expectedDueDate = new Date(req.body.matingDate);
    expectedDueDate.setDate(expectedDueDate.getDate() + 150);

    const breedingRecord = new BreedingRecord({
      ...req.body,
      expectedDueDate
    });

    const savedRecord = await breedingRecord.save();

    // Update doe's breeding status
    await Goat.findByIdAndUpdate(req.body.doe, {
      'breeding.isPregnant': true,
      'breeding.dueDate': expectedDueDate,
      'breeding.lastBreeding': req.body.matingDate,
      'breeding.sire': req.body.buck
    });

    const populatedRecord = await BreedingRecord.findById(savedRecord._id)
      .populate('doe', 'name tagNumber breed')
      .populate('buck', 'name tagNumber breed')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json(populatedRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update breeding record
router.put('/:id', async (req, res) => {
  try {
    const record = await BreedingRecord.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('doe', 'name tagNumber breed')
     .populate('buck', 'name tagNumber breed')
     .populate('createdBy', 'firstName lastName');
    
    if (!record) {
      return res.status(404).json({ message: 'Breeding record not found' });
    }
    
    // Update doe's breeding status if kidding occurred
    if (req.body.kiddingDate && req.body.status === 'Kidded') {
      await Goat.findByIdAndUpdate(record.doe, {
        'breeding.isPregnant': false,
        'breeding.dueDate': null
      });
    }
    
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete breeding record
router.delete('/:id', async (req, res) => {
  try {
    const record = await BreedingRecord.findByIdAndDelete(req.params.id);
    
    if (!record) {
      return res.status(404).json({ message: 'Breeding record not found' });
    }
    
    // Reset doe's breeding status if record is deleted
    await Goat.findByIdAndUpdate(record.doe, {
      'breeding.isPregnant': false,
      'breeding.dueDate': null,
      'breeding.lastBreeding': null,
      'breeding.sire': null
    });
    
    res.json({ message: 'Breeding record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get upcoming kidding events
router.get('/upcoming/kidding', async (req, res) => {
  try {
    const upcoming = await BreedingRecord.find({
      status: 'Pregnant',
      expectedDueDate: { $gte: new Date() }
    })
    .sort({ expectedDueDate: 1 })
    .populate('doe', 'name tagNumber breed')
    .populate('buck', 'name tagNumber breed')
    .limit(20);

    res.json(upcoming);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get breeding statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await BreedingRecord.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalKids: { $sum: '$kidsBorn' },
          survivedKids: { $sum: '$kidsSurvived' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const monthlyStats = await BreedingRecord.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$matingDate' },
            month: { $month: '$matingDate' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      byStatus: stats,
      monthlyTrend: monthlyStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 