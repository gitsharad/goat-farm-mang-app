const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Poultry = require('../models/Poultry');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const ProductionRecord = require('../models/ProductionRecord');

// Get all poultry with filtering
router.get('/', auth, async (req, res) => {
  try {
    console.log('=== DEBUG: Starting request ===');
    console.log('Received request with query params:', req.query);
    console.log('Authenticated user ID (raw):', req.user.id, 'type:', typeof req.user.id);
    
    // Ensure user ID is a valid ObjectId
    const userId = new mongoose.Types.ObjectId(req.user.id);
    console.log('Converted user ID:', userId, 'type:', userId.constructor.name);
    
    // Count all documents for this user
    const count = await Poultry.countDocuments({ createdBy: userId });
    console.log('Documents count for user:', count);
    
    // Find all documents for this user
    const userPoultry = await Poultry.find({ createdBy: userId }).lean();
    console.log('Found documents:', userPoultry.length);
    
    // If no documents found, check if any documents exist at all
    if (userPoultry.length === 0) {
      const anyPoultry = await Poultry.findOne().lean();
      console.log('Any document in collection?', anyPoultry ? 'Yes' : 'No');
      if (anyPoultry) {
        console.log('Sample document structure:', {
          _id: anyPoultry._id,
          createdBy: anyPoultry.createdBy,
          createdByType: anyPoultry.createdBy ? anyPoultry.createdBy.constructor.name : 'undefined'
        });
      }
    }
    
    // Return the results
    res.json({
      success: true,
      count: userPoultry.length,
      data: userPoultry,
      totalPages: 1,
      currentPage: 1,
      total: userPoultry.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Get single poultry
router.get('/:id', auth, async (req, res) => {
  try {
    const poultry = await Poultry.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });
    if (!poultry) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: poultry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Add new poultry
router.post('/', [
  auth,
  [
    body('tagNumber', 'Tag number is required').notEmpty(),
    body('batchNumber', 'Batch number is required').notEmpty(),
    body('breed', 'Breed is required').notEmpty(),
    body('type', 'Type is required').notEmpty(),
    body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const newPoultry = new Poultry({
      ...req.body,
      createdBy: req.user.id,
    });
    const poultry = await newPoultry.save();
    res.status(201).json({ success: true, data: poultry });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Tag number must be unique' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: 'Validation error', errors: messages });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Update poultry
router.put('/:id', auth, async (req, res) => {
  try {
    let poultry = await Poultry.findById(req.params.id);
    if (!poultry) return res.status(404).json({ success: false, message: 'Not found' });
    if (poultry.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    
    const { tagNumber, createdBy, ...updateData } = req.body;
    poultry = await Poultry.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, data: poultry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Delete poultry
router.delete('/:id', auth, async (req, res) => {
  try {
    const poultry = await Poultry.findById(req.params.id);
    if (!poultry) return res.status(404).json({ success: false, message: 'Not found' });
    if (poultry.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    await poultry.remove();
    res.json({ success: true, message: 'Poultry removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Get production records for a poultry batch
router.get('/:id([0-9a-fA-F]{24})/production', auth, async (req, res) => {
  try {
    const poultry = await Poultry.findById(req.params.id);
    if (!poultry) return res.status(404).json({ success: false, message: 'Poultry not found' });
    if (poultry.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const records = await ProductionRecord.find({ poultry: req.params.id, createdBy: req.user.id }).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Add a production record for a poultry batch
router.post('/:id([0-9a-fA-F]{24})/production', auth, async (req, res) => {
  try {
    const poultry = await Poultry.findById(req.params.id);
    if (!poultry) return res.status(404).json({ success: false, message: 'Poultry not found' });
    if (poultry.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const { date, eggsProduced, eggsDamaged = 0, notes } = req.body;
    const record = await ProductionRecord.create({
      poultry: req.params.id,
      date,
      eggsProduced,
      eggsDamaged,
      notes,
      createdBy: req.user.id,
    });
    res.status(201).json(record);
  } catch (err) {
    console.error(err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Validation error', errors: Object.values(err.errors).map(e => e.message) });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Delete a production record
router.delete('/production/:recordId([0-9a-fA-F]{24})', auth, async (req, res) => {
  try {
    const record = await ProductionRecord.findById(req.params.recordId);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    if (record.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    await record.remove();
    res.json({ success: true, message: 'Record deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Get poultry inventory report
router.get('/reports/inventory', auth, async (req, res) => {
  try {
    const inventory = await Poultry.aggregate([
      { $match: { createdBy: new mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: { breed: '$breed', type: '$type', status: '$status' },
          count: { $sum: '$quantity' }
        }
      },
      {
        $group: {
          _id: { breed: '$_id.breed', type: '$_id.type' },
          statuses: { $push: { status: '$_id.status', count: '$count' } },
          typeTotal: { $sum: '$count' }
        }
      },
      {
        $group: {
          _id: '$_id.breed',
          types: { 
            $push: { 
              type: '$_id.type', 
              statuses: '$statuses', 
              count: '$typeTotal' 
            } 
          },
          total: { $sum: '$typeTotal' }
        }
      },
      { $sort: { total: -1 } }
    ]);
    res.json({ success: true, data: inventory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Get poultry production report
router.get('/reports/production', auth, async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    let startDate;

    switch (timeRange) {
      case '30d':
        startDate = new Date(new Date().setDate(new Date().getDate() - 30));
        break;
      case '90d':
        startDate = new Date(new Date().setDate(new Date().getDate() - 90));
        break;
      case '7d':
      default:
        startDate = new Date(new Date().setDate(new Date().getDate() - 7));
        break;
    }

    const production = await ProductionRecord.aggregate([
      { $match: { createdBy: req.user.id, date: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          totalEggs: { $sum: '$eggsProduced' },
          totalDamaged: { $sum: '$eggsDamaged' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json({ success: true, data: production });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Get poultry vaccination report
router.get('/reports/vaccinations', auth, async (req, res) => {
  try {
    const upcoming = await Poultry.find({
      createdBy: req.user.id,
      'vaccination.nextDate': { $gte: new Date(), $lte: new Date(new Date().setDate(new Date().getDate() + 30)) },
    }).select('tagNumber vaccination');

    const recent = await Poultry.find({
      createdBy: req.user.id,
      'vaccination.date': { $gte: new Date(new Date().setDate(new Date().getDate() - 30)), $lt: new Date() },
    }).select('tagNumber vaccination');

    res.json({ success: true, data: { upcoming, recent } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
