const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const MilkProduction = require('../models/MilkProduction');

// @route   POST api/milk-production
// @desc    Add milk production record
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      body('goatId', 'Goat ID is required').not().isEmpty(),
      body('date', 'Date is required').isISO8601(),
      body('amount', 'Amount is required').isNumeric(),
      body('timeOfDay', 'Time of day is required').isString(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { goatId, date, amount, timeOfDay, notes } = req.body;

      const newRecord = new MilkProduction({
        goatId,
        date,
        amount,
        timeOfDay,
        notes: notes || '',
        recordedBy: req.user.id,
      });

      const record = await newRecord.save();
      res.json(record);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/milk-production
// @desc    Get all milk production records
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, goatId } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (goatId) {
      query.goatId = goatId;
    }

    const records = await MilkProduction.find(query)
      .sort({ date: -1 })
      .populate('goatId', 'tagNumber name')
      .populate('recordedBy', 'name');

    res.json(records);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/milk-production/:id
// @desc    Get milk production record by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const record = await MilkProduction.findById(req.params.id)
      .populate('goatId', 'tagNumber name')
      .populate('recordedBy', 'name');

    if (!record) {
      return res.status(404).json({ msg: 'Record not found' });
    }

    res.json(record);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Record not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/milk-production/:id
// @desc    Update milk production record
// @access  Private
router.put(
  '/:id',
  [
    auth,
    [
      body('amount', 'Amount is required').optional().isNumeric(),
      body('date', 'Date must be a valid date').optional().isISO8601(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { amount, date, timeOfDay, notes } = req.body;
      const updateFields = {};

      if (amount) updateFields.amount = amount;
      if (date) updateFields.date = date;
      if (timeOfDay) updateFields.timeOfDay = timeOfDay;
      if (notes !== undefined) updateFields.notes = notes;

      let record = await MilkProduction.findById(req.params.id);

      if (!record) {
        return res.status(404).json({ msg: 'Record not found' });
      }

      // Check user is admin or the one who created the record
      if (record.recordedBy.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(401).json({ msg: 'User not authorized' });
      }

      record = await MilkProduction.findByIdAndUpdate(
        req.params.id,
        { $set: updateFields },
        { new: true }
      );

      res.json(record);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/milk-production/:id
// @desc    Delete milk production record
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const record = await MilkProduction.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ msg: 'Record not found' });
    }

    // Check user is admin or the one who created the record
    if (record.recordedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await record.remove();

    res.json({ msg: 'Record removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Record not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
