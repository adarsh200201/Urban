const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const CabType = require('../models/CabType');

// @desc    Reset cab data (admin only)
// @route   DELETE /api/reset/cabs
// @access  Private/Admin
router.delete('/cabs', protect, authorize('admin'), async (req, res) => {
  try {
    // Delete all cab types
    await CabType.deleteMany({});
    
    res.status(200).json({
      success: true,
      message: 'All cab data has been cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cab data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cab data',
      error: error.message
    });
  }
});

module.exports = router;
