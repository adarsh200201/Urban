const Booking = require('../models/Booking');
const socketManager = require('../utils/socketManager');
const sendEmail = require('../utils/sendEmail');

/**
 * @desc    Process refund for a booking
 * @route   POST /api/booking/:id/refund
 * @access  Private
 */
exports.processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentId } = req.body;
    
    // Find the booking
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if this user is authorized to request refund
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to process refund for this booking'
      });
    }
    
    // Check refund eligibility
    if (booking.status === 'assigned' || booking.status === 'inProgress' || booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Booking is not eligible for refund. Driver already assigned.'
      });
    }
    
    if (booking.refundStatus === 'processed') {
      return res.status(400).json({
        success: false,
        message: 'Refund has already been processed for this booking'
      });
    }
    
    if (booking.paymentStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot refund a booking that has not been paid'
      });
    }
    
    // Initialize refund data
    const refundData = {
      status: 'processing',
      initiatedAt: new Date(),
      amount: booking.totalAmount,
    };
    
    // Process refund through payment gateway (e.g., Razorpay)
    try {
      // This would be replaced with actual Razorpay refund API call
      // const razorpay = new Razorpay({
      //   key_id: process.env.RAZORPAY_KEY_ID,
      //   key_secret: process.env.RAZORPAY_KEY_SECRET
      // });
      
      // const refund = await razorpay.refunds.create({
      //   payment_id: paymentId,
      //   amount: booking.totalAmount * 100, // Convert to paise
      //   speed: 'normal'
      // });
      
      // Mock successful refund for now
      const refund = {
        id: `refund_${Date.now()}`,
        amount: booking.totalAmount * 100,
        status: 'processed'
      };
      
      // Update refund data with payment gateway response
      refundData.refundId = refund.id;
      refundData.status = 'processed';
      refundData.processedAt = new Date();
      
      // Send success email to user
      try {
        await sendEmail({
          email: req.user.email,
          subject: 'Refund Processed for Your UrbanRide Booking',
          message: `
            Dear ${req.user.name},
            
            Your refund for booking #${booking.bookingId} has been processed.
            
            Refund Amount: ₹${booking.totalAmount}
            Refund ID: ${refund.id}
            
            The refund should be credited to your original payment method within 5-7 business days.
            
            Thank you for using UrbanRide.
          `
        });
      } catch (emailError) {
        console.error('Error sending refund email:', emailError);
        // Continue processing even if email fails
      }
      
    } catch (paymentError) {
      console.error('Payment gateway refund error:', paymentError);
      refundData.status = 'failed';
      refundData.error = paymentError.message || 'Payment gateway error';
      
      return res.status(500).json({
        success: false,
        message: 'Failed to process refund through payment gateway',
        error: paymentError.message
      });
    }
    
    // Update booking with refund information
    booking.refundStatus = refundData.status;
    booking.refundId = refundData.refundId;
    booking.refundAmount = refundData.amount;
    booking.refundProcessedAt = refundData.processedAt;
    booking.status = 'cancelled';
    booking.cancellationReason = req.body.reason || 'Cancelled by user with refund';
    
    await booking.save();
    
    // Emit real-time updates through socket
    socketManager.emitRefundProcessed({
      bookingId: booking._id,
      bookingNumber: booking.bookingId,
      status: refundData.status,
      amount: refundData.amount,
      user: booking.user,
      refundId: refundData.refundId
    });
    
    return res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundId: refundData.refundId,
        status: refundData.status,
        amount: refundData.amount,
        processedAt: refundData.processedAt
      }
    });
    
  } catch (error) {
    console.error('Refund processing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing refund',
      error: error.message
    });
  }
};

/**
 * @desc    Get refund status for a booking
 * @route   GET /api/booking/:id/refund-status
 * @access  Private
 */
exports.getRefundStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if this user is authorized to view refund status
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view refund status for this booking'
      });
    }
    
    // Return refund information
    return res.status(200).json({
      success: true,
      data: {
        refundStatus: booking.refundStatus || 'none',
        refundId: booking.refundId || null,
        refundAmount: booking.refundAmount || 0,
        refundProcessedAt: booking.refundProcessedAt || null
      }
    });
    
  } catch (error) {
    console.error('Get refund status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching refund status',
      error: error.message
    });
  }
};
