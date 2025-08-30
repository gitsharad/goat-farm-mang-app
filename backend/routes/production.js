const express = require('express');
const router = express.Router();
const ProductionRecord = require('../models/ProductionRecord');
const Poultry = require('../models/Poultry');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// @route   POST /api/production
// @desc    Add a new production record
// @access  Private
router.post('/', [
  auth,
  [
    body('poultry', 'Poultry ID is required').notEmpty(),
    body('date', 'Date is required').isISO8601(),
    body('eggsProduced', 'Eggs produced must be a non-negative number').isInt({ min: 0 }),
  ],
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { poultry: poultryId, date, eggsProduced, eggsDamaged, notes } = req.body;

    const poultry = await Poultry.findOne({ _id: poultryId, createdBy: req.user.id });
    if (!poultry) {
      return res.status(404).json({ msg: 'Poultry not found' });
    }

    const newRecord = new ProductionRecord({
      poultry: poultryId,
      date,
      eggsProduced,
      eggsDamaged,
      notes,
      createdBy: req.user.id,
    });

    const record = await newRecord.save();
    res.status(201).json(record);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/production/:poultryId
// @desc    Get all production records for a specific poultry
// @access  Private
router.get('/:poultryId', auth, async (req, res) => {
  try {
    const poultry = await Poultry.findOne({ _id: req.params.poultryId, createdBy: req.user.id });
    if (!poultry) {
      return res.status(404).json({ msg: 'Poultry not found' });
    }

    const records = await ProductionRecord.find({ poultry: req.params.poultryId })
      .sort({ date: -1 });
      
    res.json(records);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
