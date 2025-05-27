import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

/**
 * Service to handle all refund-related operations
 * Centralizes refund logic in one place to avoid duplication
 */
class RefundService {
  /**
   * Process a refund for a booking
   * @param {string} bookingId - The ID of the booking to refund
   * @param {string} paymentId - The payment ID from payment processor
   * @param {string} token - Authentication token
   * @param {boolean} isPartial - Whether this is a partial refund
   * @param {number} amount - Refund amount (for partial refunds)
   * @param {string} reason - Reason for the refund
   * @returns {Promise} - Promise with refund result
   */
  async processRefund(bookingId, paymentId, token, isPartial = false, amount = 0, reason = 'Booking cancelled') {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };

      const refundData = {
        paymentId,
        isPartial,
        reason
      };
      
      // Add amount for partial refunds
      if (isPartial && amount > 0) {
        refundData.amount = amount;
      }

      const response = await axios.post(
        `${API_URL}/booking/${bookingId}/refund`,
        refundData,
        config
      );

      return response.data;
    } catch (error) {
      console.error('Refund processing error:', error);
      throw error;
    }
  }

  /**
   * Get refund status for a booking
   * @param {string} bookingId - The ID of the booking
   * @param {string} token - Authentication token
   * @returns {Promise} - Promise with refund status
   */
  async getRefundStatus(bookingId, token) {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.get(
        `${API_URL}/booking/${bookingId}/refund-status`,
        config
      );

      return response.data;
    } catch (error) {
      console.error('Get refund status error:', error);
      throw error;
    }
  }

  /**
   * Check if a booking is eligible for refund
   * @param {Object} booking - The booking object
   * @returns {Object} - Detailed eligibility information
   */
  checkRefundEligibility(booking) {
    if (!booking) {
      return { 
        eligible: false, 
        fullRefund: false,
        reason: 'Booking not found',
        cancellationAllowed: false 
      };
    }

    // Can't refund if booking is already cancelled
    if (booking.status === 'cancelled') {
      return { 
        eligible: false, 
        fullRefund: false,
        reason: 'Booking already cancelled',
        cancellationAllowed: false 
      };
    }
    
    // Can't refund if already refunded
    if (booking.refundStatus === 'processed') {
      return { 
        eligible: false, 
        fullRefund: false,
        reason: 'Refund already processed',
        cancellationAllowed: false 
      };
    }

    // Can't refund if payment is not completed
    if (booking.paymentStatus !== 'completed') {
      return { 
        eligible: false, 
        fullRefund: false,
        reason: 'Payment not completed or pending',
        cancellationAllowed: true  // Can still cancel unpaid bookings
      };
    }

    // Completed rides cannot be cancelled
    if (booking.status === 'completed') {
      return { 
        eligible: false, 
        fullRefund: false,
        reason: 'Completed rides cannot be cancelled',
        cancellationAllowed: false 
      };
    }
    
    // In-progress rides cannot be cancelled
    if (booking.status === 'inProgress') {
      return { 
        eligible: false, 
        fullRefund: false,
        reason: 'Ride in progress cannot be cancelled',
        cancellationAllowed: false 
      };
    }

    // Refund policy: Before driver assignment, full refund
    if (booking.status === 'pending' || booking.status === 'confirmed') {
      return { 
        eligible: true, 
        fullRefund: true,
        reason: 'Booking can be cancelled with full refund',
        cancellationAllowed: true,
        refundType: 'full'
      };
    }
    
    // After driver assignment, no refund but cancellation allowed
    if (booking.status === 'assigned') {
      return { 
        eligible: false, 
        fullRefund: false,
        reason: 'Driver already assigned, cancellation without refund is possible',
        cancellationAllowed: true,
        refundType: 'none'
      };
    }

    // Default case - unknown status
    return { 
      eligible: false, 
      fullRefund: false,
      reason: 'Booking status does not allow cancellation',
      cancellationAllowed: false 
    };
  }
  
  /**
   * Cancel a booking with proper refund handling
   * @param {string} bookingId - ID of the booking to cancel
   * @param {string} reason - Cancellation reason
   * @param {string} token - Authentication token
   * @returns {Promise} - Promise with cancellation result
   */
  async cancelBooking(bookingId, reason, token) {
    try {
      // First, get booking details to check refund eligibility
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };
      
      const bookingResponse = await axios.get(
        `${API_URL}/booking/${bookingId}`,
        config
      );
      
      const booking = bookingResponse.data.data;
      const eligibility = this.checkRefundEligibility(booking);
      
      // If cancellation is not allowed, throw error
      if (!eligibility.cancellationAllowed) {
        throw new Error(eligibility.reason);
      }
      
      // Cancel the booking
      const cancelResponse = await axios.post(
        `${API_URL}/booking/${bookingId}/cancel`,
        { 
          reason,
          isRefundEligible: eligibility.eligible,
          refundType: eligibility.refundType || 'none'
        },
        config
      );
      
      return cancelResponse.data;
    } catch (error) {
      console.error('Booking cancellation error:', error);
      throw error;
    }
  }
  
  /**
   * Track a refund status
   * @param {string} refundId - ID of the refund to track
   * @param {string} token - Authentication token
   * @returns {Promise} - Promise with refund tracking result
   */
  async trackRefund(refundId, token) {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.get(
        `${API_URL}/refund/${refundId}`,
        config
      );

      return response.data;
    } catch (error) {
      console.error('Refund tracking error:', error);
      throw error;
    }
  }
}



export default new RefundService();
