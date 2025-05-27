const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Create Razorpay order
// @route   POST /api/payment/create-order
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { amount, bookingId, currency = 'INR' } = req.body;

    // Validate inputs
    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide payment amount'
      });
    }

    let booking;
    
    // If bookingId is provided, validate it exists
    if (bookingId) {
      booking = await Booking.findById(bookingId);
      
      if (!booking) {
        console.log(`Booking with ID ${bookingId} not found`);
        // For frontend testing, allow payment even if booking not found
      }
    } else {
      console.log('No bookingId provided, creating test order');
      // Allow creating test order without bookingId for frontend testing
    }

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: `receipt_order_${bookingId}`,
      notes: {
        bookingId: bookingId
      }
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Payment initiation failed',
      error: error.message
    });
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/payment/verify-payment
// @access  Private
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId
    } = req.body;

    // Validate inputs
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment information'
      });
    }
    
    // For guest bookings or demo purposes, allow proceeding without a valid bookingId
    if (!bookingId && req.isGuestBooking) {
      console.log('Guest payment verification without bookingId');
      // For demo, we'll return success for guest users
      return res.status(200).json({
        success: true,
        message: 'Payment verified (guest demo mode)',
        booking: {
          bookingId: 'CB' + Date.now().toString().slice(-8)
        }
      });
    }

    // Verify payment signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    // Check if the signatures match
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Update booking status
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: 'confirmed',
        paymentId: razorpay_payment_id,
        paymentStatus: 'completed'
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment successful',
      booking
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
};

// @desc    Get payment details
// @route   GET /api/payment/:paymentId
// @access  Private
exports.getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }

    const payment = await razorpay.payments.fetch(paymentId);

    res.status(200).json({
      success: true,
      payment
    });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      error: error.message
    });
  }
};
