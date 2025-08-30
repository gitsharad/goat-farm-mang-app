const express = require('express');
const router = express.Router();
const WeightRecord = require('../models/WeightRecord');
const Goat = require('../models/Goat');

// Create a weight record for a goat
router.post('/:goatId', async (req, res) => {
  try {
    const { goatId } = req.params;
    const { date, weight, source = 'scale', notes } = req.body;

    // Basic validations
    const numericWeight = Number(weight);
    if (weight == null || isNaN(numericWeight)) {
      return res.status(400).json({ message: 'Weight is required and must be a number' });
    }
    if (numericWeight <= 0) {
      return res.status(400).json({ message: 'Weight must be greater than 0' });
    }
    const dateObj = date ? new Date(date) : new Date();
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ message: 'Invalid date' });
    }

    const goat = await Goat.findById(goatId);
    if (!goat) return res.status(404).json({ message: 'Goat not found' });

    // Duplicate-day guard: prevent multiple records for same goat on the same calendar day
    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);
    const existingSameDay = await WeightRecord.findOne({ goat: goatId, date: { $gte: startOfDay, $lte: endOfDay } });
    if (existingSameDay) {
      return res.status(409).json({ message: 'A weight record for this goat already exists on this date' });
    }

    const record = await WeightRecord.create({
      goat: goatId,
      date: dateObj,
      weight: numericWeight,
      source,
      notes
    });

    // Update goat.current weight if this is the latest record
    const latest = await WeightRecord.findOne({ goat: goatId }).sort({ date: -1 });
    if (latest && latest.date && latest.weight >= 0) {
      goat.weight = goat.weight || {};
      goat.weight.current = latest.weight;
      await goat.save();
    }

    res.status(201).json({ record });
  } catch (error) {
    console.error('Create weight record error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get weight time-series for a goat
router.get('/:goatId', async (req, res) => {
  try {
    const { goatId } = req.params;
    const { from, to, sort = 'asc', limit } = req.query;

    const goat = await Goat.findById(goatId).select('name tagNumber dateOfBirth weight');
    if (!goat) return res.status(404).json({ message: 'Goat not found' });

    const q = { goat: goatId };
    if (from || to) {
      q.date = {};
      if (from) q.date.$gte = new Date(from);
      if (to) q.date.$lte = new Date(to);
    }

    const cursor = WeightRecord.find(q)
      .sort({ date: sort === 'desc' ? -1 : 1 })
      .select('date weight source notes');

    if (limit) cursor.limit(Number(limit));

    const records = await cursor.exec();

    let summary = null;
    if (records.length >= 1) {
      const first = records[0];
      const last = records[records.length - 1];
      const days = Math.max(1, Math.floor((new Date(last.date) - new Date(first.date)) / (1000 * 60 * 60 * 24)));
      const adg = (last.weight - first.weight) / days; // kg/day
      summary = {
        startWeight: first.weight,
        endWeight: last.weight,
        days,
        adg,
      };
    }

    res.json({ goat, records, summary });
  } catch (error) {
    console.error('Get weight series error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update a weight record
router.put('/record/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, weight, source, notes } = req.body;

    const record = await WeightRecord.findByIdAndUpdate(
      id,
      {
        ...(date && { date: new Date(date) }),
        ...(weight != null && { weight: Number(weight) }),
        ...(source && { source }),
        ...(notes != null && { notes })
      },
      { new: true }
    );

    if (!record) return res.status(404).json({ message: 'Record not found' });

    // Update goat current weight if needed
    const latest = await WeightRecord.findOne({ goat: record.goat }).sort({ date: -1 });
    if (latest) {
      await Goat.findByIdAndUpdate(record.goat, { $set: { 'weight.current': latest.weight } });
    }

    res.json({ record });
  } catch (error) {
    console.error('Update weight record error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete a weight record
router.delete('/record/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const record = await WeightRecord.findByIdAndDelete(id);
    if (!record) return res.status(404).json({ message: 'Record not found' });

    // Recompute current weight for the goat
    const latest = await WeightRecord.findOne({ goat: record.goat }).sort({ date: -1 });
    const current = latest ? latest.weight : undefined;
    await Goat.findByIdAndUpdate(record.goat, { $set: { 'weight.current': current } });

    res.json({ message: 'Deleted', recordId: id });
  } catch (error) {
    console.error('Delete weight record error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
