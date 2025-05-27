const express = require('express');
const Booking = require('../models/Booking');
const {
  createBooking,
  getUserBookings,
  getBookingById,
  getBookingByBookingId,
  updateBookingStatus,
  cancelBooking,
  getAllBookings,
  updatePaymentMethod,
  updatePaymentMethodCustom,
  getConfirmedBookings,
  assignDriverToBooking
} = require('../controllers/bookingController');
const {
  sendBookingConfirmation,
  sendInvoiceEmail
} = require('../controllers/emailController');
const {
  processRefund,
  getRefundStatus
} = require('../controllers/refundController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// Direct booking endpoint with no middleware for authentication issues
router.post('/direct', createBooking);

// Special route for custom booking IDs that doesn't use URL params
router.post('/payment-update/custom', updatePaymentMethodCustom); // New approach for custom IDs

// Standard endpoint with authentication middleware
router.post('/', protect, createBooking); // Only authenticated users can create bookings

// Allow public access to bookings for the demo page, but the controller will still handle authorization
router.get('/', getUserBookings);

// Admin-only routes
router.get('/admin/all', protect, authorize('admin'), getAllBookings);
router.get('/confirmed', protect, authorize('admin'), getConfirmedBookings);
router.put('/assign-driver', protect, authorize('admin'), assignDriverToBooking); // New route for assigning driver
router.get('/track/:bookingId', getBookingByBookingId);

// Add dedicated endpoint for user's bookings
router.get('/my-bookings', protect, async (req, res) => {
  try {
    // Debug information
    console.log('Fetching my-bookings for user:', req.user);
    
    // Ensure user.id exists before querying
    if (!req.user || !req.user.id) {
      console.log('No valid user ID found in request');
      return res.status(400).json({
        success: false,
        message: 'No valid user ID found in request'
      });
    }
    
    console.log('Looking for bookings with user ID:', req.user.id);
    
    // Query bookings with proper error handling
    const bookings = await Booking.find({ user: req.user.id })
      .populate('cabType', 'name imageUrl')
      .populate('pickupLocation', 'name state')
      .populate('dropLocation', 'name state')
      .sort({ createdAt: -1 });
      
    console.log(`Found ${bookings.length} bookings for user ${req.user.id}`);

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
});

// Dedicated route for booking confirmation page
router.get('/confirmation', async (req, res) => {
  try {
    // Extract query parameters if any
    const { from, to, cabName, bookingId, email, amount, paymentMethod } = req.query;
    
    // Return booking confirmation data using query parameters
    return res.status(200).json({
      success: true,
      message: 'Booking confirmation successful',
      data: {
        from,
        to,
        cabName,
        bookingId,
        email,
        amount,
        paymentMethod,
        date: new Date().toISOString(),
        status: 'confirmed'
      }
    });
  } catch (error) {
    console.error('Error in confirmation route:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing confirmation',
      error: error.message
    });
  }
});

router.get('/:id', protect, getBookingById);
router.put('/:id', protect, authorize('admin'), updateBookingStatus);
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/payment-method', protect, updatePaymentMethod); // Require authentication for payment updates

// Refund routes
router.post('/:id/refund', protect, processRefund);
router.get('/:id/refund-status', protect, getRefundStatus);

// Email routes
router.post('/send-confirmation', sendBookingConfirmation);
router.post('/send-invoice', sendInvoiceEmail);

module.exports = router;
