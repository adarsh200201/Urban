const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const CabType = require('../models/CabType');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Get all cab types (public)
// @route   GET /api/cabtype/all
// @access  Public
router.get('/all', async (req, res) => {
  try {
    const cabTypes = await CabType.find({ active: true });
    res.status(200).json({
      success: true,
      count: cabTypes.length,
      data: cabTypes
    });
  } catch (error) {
    console.error('Error fetching cab types:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get all cab types (including inactive)
// @route   GET /api/cabtype/admin
// @access  Private/Admin
router.get('/admin', protect, admin, async (req, res) => {
  try {
    const cabTypes = await CabType.find({});
    res.status(200).json({
      success: true,
      count: cabTypes.length,
      data: cabTypes
    });
  } catch (error) {
    console.error('Error fetching cab types:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get a specific cab type
// @route   GET /api/cabtype/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const cabType = await CabType.findById(req.params.id);
    
    if (!cabType) {
      return res.status(404).json({
        success: false,
        message: 'Cab type not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: cabType
    });
  } catch (error) {
    console.error('Error fetching cab type:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Create new cab type
// @route   POST /api/cabtype
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const cabType = await CabType.create(req.body);
    res.status(201).json({
      success: true,
      data: cabType
    });
  } catch (error) {
    console.error('Error creating cab type:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update cab type
// @route   PUT /api/cabtype/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const cabType = await CabType.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!cabType) {
      return res.status(404).json({
        success: false,
        message: 'Cab type not found'
      });
    }

    res.status(200).json({
      success: true,
      data: cabType
    });
  } catch (error) {
    console.error('Error updating cab type:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Delete cab type
// @route   DELETE /api/cabtype/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const cabType = await CabType.findByIdAndDelete(req.params.id);

    if (!cabType) {
      return res.status(404).json({
        success: false,
        message: 'Cab type not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  }
  catch (error) {
    console.error('Error deleting cab type:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
