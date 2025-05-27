import React from 'react';
import { Link, useParams } from 'react-router-dom';

const PaymentSuccess = () => {
  const { bookingId } = useParams();
  
  return (
    <div className="container mx-auto py-12">
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-8 text-center">
        <div className="inline-block p-4 rounded-full bg-green-100 mb-6">
          <svg className="h-16 w-16 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-3">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Your payment for booking #{bookingId} has been successfully processed.
          A confirmation has been sent to your email address.
        </p>
        
        <div className="border-t border-b py-6 mb-6">
          <p className="text-gray-600 mb-1">Transaction Reference</p>
          <p className="font-medium text-lg">{`TXN-${Math.floor(100000000 + Math.random() * 900000000)}`}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to={`/booking/${bookingId}`} className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700">
            View Booking Details
          </Link>
          <Link to="/dashboard" className="bg-gray-200 text-gray-800 px-6 py-3 rounded hover:bg-gray-300">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
