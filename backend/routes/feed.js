const express = require('express');
const router = express.Router();
const FeedRecord = require('../models/FeedRecord');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// Get all feed records with filtering
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      goatId, 
      pen, 
      feedType,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    
    if (goatId) filter.goat = goatId;
    if (pen) filter.pen = pen;
    if (feedType) filter.feedType = feedType;
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const records = await FeedRecord.find(filter)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('goat', 'name tagNumber breed')
      .populate('createdBy', 'firstName lastName');

    const total = await FeedRecord.countDocuments(filter);

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

// Get feed record by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const record = await FeedRecord.findById(req.params.id)
      .populate('goat', 'name tagNumber breed')
      .populate('createdBy', 'firstName lastName');
    
    if (!record) {
      return res.status(404).json({ message: 'Feed record not found' });
    }
    
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new feed record
router.post('/', [
  auth,
  body('feedType').isIn(['Hay', 'Grain', 'Pasture', 'Silage', 'Mineral', 'Mineral Supplement', 'Concentrate', 'Pellets', 'Water', 'Other']).withMessage('Valid feed type is required'),
  body('quantity').isNumeric().withMessage('Valid quantity is required'),
  body('unit').isIn(['kg', 'lbs', 'liters', 'gallons', 'bales', 'scoops']).withMessage('Valid unit is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const record = new FeedRecord(req.body);
    const savedRecord = await record.save();

    const populatedRecord = await FeedRecord.findById(savedRecord._id)
      .populate('goat', 'name tagNumber breed')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json(populatedRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update feed record
router.put('/:id', auth, async (req, res) => {
  try {
    const record = await FeedRecord.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('goat', 'name tagNumber breed')
     .populate('createdBy', 'firstName lastName');
    
    if (!record) {
      return res.status(404).json({ message: 'Feed record not found' });
    }
    
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete feed record
router.delete('/:id', auth, async (req, res) => {
  try {
    const record = await FeedRecord.findByIdAndDelete(req.params.id);
    
    if (!record) {
      return res.status(404).json({ message: 'Feed record not found' });
    }
    
    res.json({ message: 'Feed record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get feed consumption summary
router.get('/stats/consumption', auth, async (req, res) => {
  try {
    const { startDate, endDate, feedType } = req.query;
    
    const filter = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (feedType) filter.feedType = feedType;

    const consumption = await FeedRecord.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$feedType',
          totalQuantity: { $sum: '$quantity' },
          totalCost: { $sum: '$cost' },
          totalConsumed: { $sum: '$consumed' },
          totalWaste: { $sum: '$waste' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalQuantity: -1 } }
    ]);

    const dailyConsumption = await FeedRecord.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            feedType: '$feedType'
          },
          quantity: { $sum: '$quantity' },
          cost: { $sum: '$cost' }
        }
      },
      { $sort: { '_id.date': -1 } },
      { $limit: 30 }
    ]);

    res.json({
      consumption,
      dailyTrend: dailyConsumption
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get feed cost analysis
router.get('/stats/cost-analysis', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const costAnalysis = await FeedRecord.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalCost: { $sum: '$cost' },
          totalQuantity: { $sum: '$quantity' },
          avgCostPerUnit: { $avg: { $divide: ['$cost', '$quantity'] } }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    const supplierCosts = await FeedRecord.aggregate([
      { $match: { ...filter, supplier: { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: '$supplier',
          totalCost: { $sum: '$cost' },
          totalQuantity: { $sum: '$quantity' },
          feedTypes: { $addToSet: '$feedType' }
        }
      },
      { $sort: { totalCost: -1 } }
    ]);

    res.json({
      monthlyCosts: costAnalysis,
      supplierAnalysis: supplierCosts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 