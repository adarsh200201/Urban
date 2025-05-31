import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaMoneyBillWave, FaCreditCard, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

/**
 * Reusable animation component for payment success and booking confirmation
 * Supports both online payment and cash on delivery modes
 */
export const PaymentSuccessAnimation = ({ onComplete, paymentMethod = 'online' }) => {
  const [animationState, setAnimationState] = useState('loading'); // loading, success, error
  const [errorMessage, setErrorMessage] = useState('');
  
  // Simulate animation loading and potential errors
  useEffect(() => {
    // Start loading animation
    const loadingTimer = setTimeout(() => {
      try {
        // Try to advance animation to success state
        setAnimationState('success');
        
        // Schedule completion callback
        const completionTimer = setTimeout(() => {
          if (onComplete) onComplete();
        }, 2500);
        
        return () => clearTimeout(completionTimer);
      } catch (error) {
        console.error('Animation error:', error);
        setAnimationState('error');
        setErrorMessage('Could not display animation');
        
        // Even on error, eventually call onComplete
        const fallbackTimer = setTimeout(() => {
          if (onComplete) onComplete();
        }, 2000);
        
        return () => clearTimeout(fallbackTimer);
      }
    }, 800); // Short delay to show loading state
    
    return () => clearTimeout(loadingTimer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white p-6 md:p-8 rounded-lg text-center max-w-md mx-4 animate-scaleIn shadow-2xl">
        {animationState === 'loading' && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <FaSpinner className="text-blue-500 text-5xl animate-spin" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-blue-600 mb-2">
              {paymentMethod === 'online' ? 'Processing Payment...' : 'Confirming Booking...'}
            </h2>
            <p className="text-gray-600">
              Please wait while we {paymentMethod === 'online' ? 'process your payment' : 'confirm your booking'}
            </p>
          </>
        )}

        {animationState === 'success' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                {paymentMethod === 'online' ? (
                  <FaCreditCard className="text-green-600 text-3xl md:text-4xl" />
                ) : (
                  <FaMoneyBillWave className="text-green-600 text-3xl md:text-4xl" />
                )}
              </div>
            </div>
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 relative">
              <div className="animate-circle absolute inset-0 border-4 border-green-200 rounded-full"></div>
              <div className="animate-checkmark opacity-0 flex items-center justify-center h-full">
                <FaCheckCircle className="text-green-600 text-4xl md:text-5xl" />
              </div>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-green-600 mb-2">
              {paymentMethod === 'online' ? 'Payment Successful!' : 'Booking Confirmed!'}
            </h2>
            <p className="text-gray-600 text-sm md:text-base">
              {paymentMethod === 'online' 
                ? 'Your payment has been processed successfully.'
                : 'Your booking is confirmed. Payment will be collected during the ride.'}
            </p>
          </>
        )}

        {animationState === 'error' && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <FaExclamationTriangle className="text-yellow-500 text-5xl" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-yellow-600 mb-2">
              Animation Error
            </h2>
            <p className="text-gray-600 mb-4">
              {errorMessage || 'There was a problem displaying the animation.'}
            </p>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-700 mb-1">
                {paymentMethod === 'online' ? 'Payment was successful!' : 'Booking was confirmed!'}
              </h3>
              <p className="text-sm text-green-600">
                {paymentMethod === 'online' 
                  ? 'Your payment was processed successfully.'
                  : 'Your booking is confirmed. Payment will be collected during the ride.'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Booking confirmation animation component
 */
export const BookingConfirmedAnimation = ({ onComplete, bookingData = {} }) => {
  const [animationState, setAnimationState] = useState('loading'); // loading, success, error
  const [errorMessage, setErrorMessage] = useState('');
  
  // Handle animation states with proper error recovery
  useEffect(() => {
    // Start loading animation
    const loadingTimer = setTimeout(() => {
      try {
        // Try to advance animation to success state
        setAnimationState('success');
        
        // Schedule completion callback
        const completionTimer = setTimeout(() => {
          if (onComplete) onComplete();
        }, 2500);
        
        return () => clearTimeout(completionTimer);
      } catch (error) {
        console.error('Booking animation error:', error);
        setAnimationState('error');
        setErrorMessage('Could not display booking confirmation');
        
        // Even on error, eventually call onComplete
        const fallbackTimer = setTimeout(() => {
          if (onComplete) onComplete();
        }, 2000);
        
        return () => clearTimeout(fallbackTimer);
      }
    }, 600); // Short delay to show loading state
    
    return () => clearTimeout(loadingTimer);
  }, [onComplete]);

  // Extract booking information if available
  const bookingId = bookingData.id || bookingData._id || bookingData.bookingId || '';
  const fromCity = bookingData.fromCity || bookingData.from || '';
  const toCity = bookingData.toCity || bookingData.to || '';
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white p-6 md:p-8 rounded-lg text-center max-w-md mx-4 animate-scaleIn shadow-2xl">
        {animationState === 'loading' && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <FaSpinner className="text-blue-500 text-5xl animate-spin" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-blue-600 mb-2">Finalizing Your Booking...</h2>
            <p className="text-gray-600">Please wait while we confirm your booking details</p>
          </>
        )}

        {animationState === 'success' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                <FaCheckCircle className="text-blue-600 text-4xl md:text-5xl" />
              </div>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-blue-600 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-600 text-sm md:text-base">
              Your cab booking has been confirmed successfully.
              {fromCity && toCity && (
                <span className="block mt-2 font-medium">From {fromCity} to {toCity}</span>
              )}
            </p>
            <div className="mt-4 text-sm text-gray-500">
              Your booking details will be displayed shortly...
              {bookingId && (
                <div className="mt-1 text-xs text-blue-500">
                  Booking Reference: {bookingId.substring(0, 8)}...
                </div>
              )}
            </div>
          </>
        )}

        {animationState === 'error' && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <FaExclamationTriangle className="text-yellow-500 text-5xl" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-yellow-600 mb-2">
              Animation Error
            </h2>
            <p className="text-gray-600 mb-4">
              {errorMessage || 'There was a problem displaying the animation.'}
            </p>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-700 mb-1">Booking Confirmed</h3>
              <p className="text-sm text-blue-600">
                Your booking has been successfully confirmed. Redirecting to booking details...
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * CSS Animation styles for keyframes
 */
export const AnimationStyles = () => (
  <style jsx="true">{`
    @keyframes fadeIn {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
    
    @keyframes scaleIn {
      0% { transform: scale(0.9); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    
    @keyframes checkmarkFadeIn {
      0% { opacity: 0; }
      50% { opacity: 0; }
      100% { opacity: 1; }
    }
    
    @keyframes circleAnimation {
      0% { transform: scale(0.8); opacity: 0; }
      50% { transform: scale(1.1); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    
    .animate-fadeIn {
      animation: fadeIn 0.5s ease forwards;
    }
    
    .animate-scaleIn {
      animation: scaleIn 0.5s ease forwards;
    }
    
    .animate-checkmark {
      animation: checkmarkFadeIn 1.5s ease forwards;
    }
    
    .animate-circle {
      animation: circleAnimation 1.5s ease forwards;
    }
    
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    
    .animate-pulse {
      animation: pulse 2s ease infinite;
    }
    
    /* Ensure animations work on mobile devices */
    @media (max-width: 768px) {
      .animate-fadeIn,
      .animate-scaleIn,
      .animate-checkmark,
      .animate-circle,
      .animate-spin,
      .animate-pulse {
        will-change: transform, opacity;
      }
    }
  `}</style>
);

export default {
  PaymentSuccessAnimation,
  BookingConfirmedAnimation,
  AnimationStyles
};
