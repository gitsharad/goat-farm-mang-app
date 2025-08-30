const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// @route   GET /api/financial
// @desc    Get financial summary
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    res.json({ message: 'Financial route working' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
