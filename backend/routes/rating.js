const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { protect } = require('../middleware/authMiddleware');
const { protectDriver } = require('../middleware/driverAuthMiddleware');

// User rates a driver
router.post('/driver', protect, ratingController.rateDriver);

// Driver rates a user
router.post('/user', protectDriver, ratingController.rateUser);

// Get driver ratings (public)
router.get('/driver/:id', ratingController.getDriverRatings);

// Get user ratings (private/admin)
router.get('/user/:id', protect, ratingController.getUserRatings);

module.exports = router;
