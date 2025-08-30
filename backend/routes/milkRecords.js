const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const MilkRecord = require('../models/MilkRecord');
const Goat = require('../models/Goat');

// @route   GET api/goats/milk-records
// @desc    Get all milk records
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { days, goatId } = req.query;
    let query = { farm: req.user.farm };
    
    if (days) {
      const date = new Date();
      date.setDate(date.getDate() - parseInt(days));
      query.date = { $gte: date };
    }
    
    if (goatId) {
      query.goat = goatId;
    }
    
    const records = await MilkRecord.find(query)
      .populate('goat', 'tagId name')
      .sort({ date: -1 });
      
    res.json(records);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/goats/milk-records
// @desc    Add new milk record
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      body('goat', 'Goat ID is required').not().isEmpty(),
      body('quantity', 'Quantity is required').isNumeric(),
      body('date', 'Valid date is required').optional().isISO8601(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { goat, quantity, fat, snf, notes, date } = req.body;

    try {
      // Check if goat exists and belongs to the user's farm
      const goatExists = await Goat.findOne({
        _id: goat,
        farm: req.user.farm,
      });

      if (!goatExists) {
        return res.status(404).json({ msg: 'Goat not found' });
      }

      const newRecord = new MilkRecord({
        goat,
        quantity,
        fat,
        snf,
        notes,
        date: date || Date.now(),
        recordedBy: req.user.id,
        farm: req.user.farm,
      });

      const record = await newRecord.save();
      
      // Update the goat's last milk record
      goatExists.lastMilkRecord = record._id;
      await goatExists.save();

      res.json(record);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/goats/milk-records/:id
// @desc    Update milk record
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { quantity, fat, snf, notes } = req.body;
  
  // Build record object
  const recordFields = {};
  if (quantity) recordFields.quantity = quantity;
  if (fat) recordFields.fat = fat;
  if (snf) recordFields.snf = snf;
  if (notes) recordFields.notes = notes;

  try {
    let record = await MilkRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ msg: 'Record not found' });
    }

    // Make sure user owns the record
    if (record.farm.toString() !== req.user.farm) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    record = await MilkRecord.findByIdAndUpdate(
      req.params.id,
      { $set: recordFields },
      { new: true }
    );

    res.json(record);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/goats/milk-records/:id
// @desc    Delete milk record
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const record = await MilkRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ msg: 'Record not found' });
    }

    // Make sure user owns the record
    if (record.farm.toString() !== req.user.farm) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await MilkRecord.findByIdAndRemove(req.params.id);

    res.json({ msg: 'Record removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
