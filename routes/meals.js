const express = require('express');
const router = express.Router();

// Get user meals
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      meals: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get meals'
    });
  }
});

module.exports = router; 