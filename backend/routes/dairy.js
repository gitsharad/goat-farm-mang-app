const express = require('express');
const router = express.Router();
const Dairy = require('../models/Dairy');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// Get all dairy animals with filtering
router.get('/', auth, async (req, res) => {
  try {
    console.log('=== DAIRY GET REQUEST ===');
    console.log('User ID:', req.user.id);
    console.log('Query params:', req.query);
    
    const { page = 1, limit = 10, _t, ...filters } = req.query;
    const query = { createdBy: req.user.id, ...filters };
    
    console.log('Base query:', JSON.stringify(query, null, 2));
    
    if (req.query.search) {
      query.$or = [
        { animalId: { $regex: req.query.search, $options: 'i' } },
        { name: { $regex: req.query.search, $options: 'i' } },
      ];
      console.log('Search query:', JSON.stringify(query.$or, null, 2));
    }

    // Log the final query being executed
    console.log('Final query:', JSON.stringify(query, null, 2));
    
    // Execute the query
    const dairy = await Dairy.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean(); // Convert to plain JavaScript objects
      
    console.log('Found records:', dairy.length);
    
    // Check if there are any documents in the collection at all
    if (dairy.length === 0) {
      const anyDoc = await Dairy.findOne().lean();
      console.log('Any document in collection?', anyDoc ? 'Yes' : 'No');
      if (anyDoc) {
        console.log('Sample document:', JSON.stringify(anyDoc, null, 2));
        console.log('Sample document createdBy type:', typeof anyDoc.createdBy, anyDoc.createdBy);
      }
    }
    
    const total = await Dairy.countDocuments(query);
    console.log('Total matching documents:', total);

    res.json({
      success: true,
      data: dairy,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Get single dairy animal
router.get('/:id', auth, async (req, res) => {
  try {
    const dairy = await Dairy.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });
    if (!dairy) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: dairy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Add milk record
router.post('/:id/milk', [
  auth,
  [
    body('morning', 'Morning quantity is required').isNumeric(),
    body('evening', 'Evening quantity is required').isNumeric(),
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const dairy = await Dairy.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });
    
    if (!dairy) return res.status(404).json({ success: false, message: 'Dairy animal not found' });

    const { morning, evening, fatPercentage, snfPercentage, notes } = req.body;
    const total = parseFloat(morning) + parseFloat(evening);
    
    const milkRecord = {
      date: new Date(),
      morning: parseFloat(morning),
      evening: parseFloat(evening),
      total,
      fatPercentage: parseFloat(fatPercentage) || null,
      snfPercentage: parseFloat(snfPercentage) || null,
      notes: notes || ''
    };

    // Update daily average
    const recordsCount = dairy.milkProduction.records.length;
    const newAverage = ((dairy.milkProduction.dailyAverage * recordsCount) + total) / (recordsCount + 1);

    dairy.milkProduction.records.push(milkRecord);
    dairy.milkProduction.dailyAverage = parseFloat(newAverage.toFixed(2));
    dairy.milkProduction.lastRecorded = new Date();
    
    await dairy.save();
    
    res.status(201).json({ 
      success: true, 
      data: milkRecord,
      dailyAverage: dairy.milkProduction.dailyAverage
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Add new dairy animal
router.post('/', [
  auth,
  [
    body('animalId', 'Animal ID is required').notEmpty(),
    body('breed', 'Breed is required').notEmpty(),
    body('gender', 'Gender is required').isIn(['Male', 'Female']),
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const newDairy = new Dairy({
      ...req.body,
      createdBy: req.user.id,
    });
    const dairy = await newDairy.save();
    res.status(201).json({ success: true, data: dairy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Update dairy animal
router.put('/:id', auth, async (req, res) => {
  try {
    const { animalId, createdBy, ...updateData } = req.body;
    const dairy = await Dairy.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      updateData,
      { new: true }
    );
    if (!dairy) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: dairy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Delete dairy animal
router.delete('/:id', auth, async (req, res) => {
  try {
    const dairy = await Dairy.findById(req.params.id);
    if (!dairy) return res.status(404).json({ success: false, message: 'Not found' });
    if (dairy.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await dairy.remove();
    res.json({ success: true, message: 'Dairy animal removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Get milk production report
router.get('/:id/milk-report', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dairy = await Dairy.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });
    
    if (!dairy) return res.status(404).json({ success: false, message: 'Dairy animal not found' });

    let records = [...dairy.milkProduction.records];
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      records = records.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= start && recordDate <= end;
      });
    }
    
    const totalMilk = records.reduce((sum, record) => sum + record.total, 0);
    const averageDaily = records.length > 0 ? totalMilk / records.length : 0;
    
    res.json({
      success: true,
      data: {
        records,
        totalMilk: parseFloat(totalMilk.toFixed(2)),
        averageDaily: parseFloat(averageDaily.toFixed(2)),
        totalDays: records.length
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
