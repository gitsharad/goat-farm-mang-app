const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// @route   GET /api/inventory
// @desc    Get all inventory items
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    res.json({ message: 'Inventory route working' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
