import React, { useState, useEffect } from 'react';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import PropTypes from 'prop-types';
import refundService from '../../services/refundService';

/**
 * Reusable Cancellation Modal component
 * Handles ride cancellation with conditional refund logic
 */
const CancellationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  booking 
}) => {
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [refundEligibility, setRefundEligibility] = useState(null);

  // Reset form and check refund eligibility when modal opens
  useEffect(() => {
    if (isOpen && booking) {
      setReason('');
      setIsProcessing(false);
      
      // Check if the booking is eligible for refund based on its status
      const eligibility = refundService.checkRefundEligibility(booking);
      setRefundEligibility(eligibility);
    }
  }, [isOpen, booking]);

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    
    setIsProcessing(true);
    
    try {
      await onConfirm({
        bookingId: booking._id || booking.bookingId,
        reason,
        isRefundEligible: refundEligibility?.eligible || false
      });
      
      onClose();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      // Show error message to user
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Cancel Booking</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to cancel this booking?
          </p>
          
          {/* Refund eligibility notice */}
          <div className={`mb-4 p-3 rounded-md ${
            refundEligibility?.eligible 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : booking?.status === 'assigned' 
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <FaExclamationTriangle className={
                  refundEligibility?.eligible 
                    ? 'text-green-500' 
                    : booking?.status === 'assigned' 
                      ? 'text-red-500' 
                      : 'text-yellow-500'
                } />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium">
                  {refundEligibility?.eligible 
                    ? 'Eligible for Full Refund' 
                    : booking?.status === 'assigned'
                      ? 'No Refund - Driver Already Assigned'
                      : 'No Refund Available'}
                </h3>
                <div className="mt-1 text-sm">
                  <p>{refundEligibility?.reason}</p>
                  {booking?.status === 'assigned' && (
                    <p className="mt-2 font-semibold">
                      You can still cancel this booking, but no refund will be processed as a driver has already been assigned to your ride.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Booking details summary */}
          <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mb-4">
            <h4 className="font-medium text-gray-700 mb-2">Booking Details:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><span className="font-medium">ID:</span> {booking.bookingId || booking._id}</li>
              <li><span className="font-medium">From:</span> {
                booking.pickupLocation?.name || booking.pickupAddress || 'N/A'
              }</li>
              <li><span className="font-medium">To:</span> {
                booking.dropLocation?.name || booking.dropAddress || 'N/A'
              }</li>
              <li><span className="font-medium">Amount:</span> ₹{booking.totalAmount || 0}</li>
              <li><span className="font-medium">Status:</span> {booking.status || 'N/A'}</li>
            </ul>
          </div>
        </div>
        
        {/* Cancellation reason */}
        <div className="mb-4">
          <label 
            htmlFor="reason" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Reason for Cancellation
          </label>
          <textarea
            id="reason"
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide a reason for cancellation"
            required
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="mr-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isProcessing}
          >
            Keep Booking
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300"
            disabled={!reason.trim() || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Confirm Cancellation'}
          </button>
        </div>
      </div>
    </div>
  );
};

CancellationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  booking: PropTypes.object
};

export default CancellationModal;
