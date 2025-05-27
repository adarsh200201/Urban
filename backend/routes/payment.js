const express = require('express');
const {
  createOrder,
  verifyPayment,
  getPaymentDetails
} = require('../controllers/paymentController');
const { protect } = require('../middlewares/auth');
const { allowGuestBooking } = require('../middlewares/guestBooking');

const router = express.Router();

router.post('/create-order', allowGuestBooking, createOrder); // Allow guests to create payment orders
router.post('/verify-payment', allowGuestBooking, verifyPayment); // Allow guests to verify payments
router.get('/:paymentId', protect, getPaymentDetails);

module.exports = router;
