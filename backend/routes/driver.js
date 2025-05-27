const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  registerDriver,
  getDrivers,
  getAvailableDrivers,
  getDriverById,
  updateDriver,
  updateAvailability,
  updateLocation,
  assignDriver,
  startTrip,
  completeTrip,
  getCurrentBooking,
  getDriverBookings,
  toggleDriverApproval
} = require('../controllers/driverController');

// Basic routes
router.get('/', getDrivers);
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Driver API is working'
  });
});
router.get('/available', protect, authorize('admin'), getAvailableDrivers);

// Booking management routes - MUST BE DEFINED BEFORE ID ROUTES
router.post('/register', protect, authorize('admin'), registerDriver);
router.put('/assign', protect, authorize('admin'), assignDriver);
router.put('/start-trip', protect, startTrip);
router.put('/complete-trip', protect, completeTrip);

// Routes requiring ID parameter - MUST BE AFTER SPECIFIC ROUTES
router.get('/:id', getDriverById);
router.put('/:id', updateDriver);
router.get('/:id/current-booking', getCurrentBooking);
router.get('/:id/bookings', getDriverBookings);

// Driver availability and location updates
router.put('/:id/availability', updateAvailability);
router.put('/:id/location', updateLocation);

// Driver approval management
router.put('/:id/approval', protect, authorize('admin'), toggleDriverApproval);

module.exports = router;
