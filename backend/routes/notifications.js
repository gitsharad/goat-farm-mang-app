const express = require('express');
const router = express.Router();

// @route   GET api/notifications
// @desc    Get all notifications for a user
// @access  Private
router.get('/', (req, res) => {
  res.json({ msg: 'Notifications route' });
});

module.exports = router;
