const express = require('express');
const {
  calculateDistance,
  getRajkotToMumbaiDistance,
  getRajkotToDelhiDistance
} = require('../controllers/distanceController');

const router = express.Router();

// Calculate distance and fare between two cities
router.post('/calculate', calculateDistance);

// Get Rajkot to Mumbai distance (with optional cab type for fare calculation)
router.get('/rajkot-to-mumbai', getRajkotToMumbaiDistance);

// Get Rajkot to Delhi distance (with optional cab type for fare calculation)
router.get('/rajkot-to-delhi', getRajkotToDelhiDistance);

module.exports = router;
