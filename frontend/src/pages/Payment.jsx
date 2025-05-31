import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaInfoCircle, FaCreditCard, FaMoneyBillWave, FaMobile, FaLock } from 'react-icons/fa';

const Payment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State declarations
  const [booking, setBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [advancePercentage, setAdvancePercentage] = useState(20); // Default 20% advance
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const isLoggedIn = userInfo && userInfo.token;
    
    if (!isLoggedIn) {
      // Save current URL for redirect after login
      const currentPath = `${window.location.pathname}${window.location.search}`;
      // Redirect to login page with return URL
      toast.error('Please log in to continue with your booking');
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }
    
    setIsAuthenticated(true);
    
    // Try to get booking data from query params
    const queryParams = new URLSearchParams(location.search);
    const bookingData = {
      id: bookingId || queryParams.get('bookingId'),
      from: queryParams.get('from') || 'Mumbai',
      to: queryParams.get('to') || 'Pune',
      date: queryParams.get('travelDate') || '2025-04-25',
      time: queryParams.get('travelTime') || '09:00 AM',
      cabType: queryParams.get('cabName') || 'SUV',
      cabId: queryParams.get('cabId'),
      price: parseFloat(queryParams.get('amount')) || 3200,
      distance: queryParams.get('distance') || '150 km',
      tripType: queryParams.get('type') || 'oneWay',
      returnDate: queryParams.get('returnDate') || '',
      returnTime: queryParams.get('returnTime') || ''
    };
    
    setBooking(bookingData);
  }, [bookingId, location.search, navigate]);
  
  // Calculate actual payment amount based on partial payment setting
  const calculatePaymentAmount = () => {
    if (!booking) return 0;
    
    if (!isPartialPayment) {
      return booking.price;
    }
    
    // Calculate advance amount based on percentage
    return Math.round((booking.price * advancePercentage) / 100);
  };
  
  // Calculate remaining amount (only relevant for partial payments)
  const calculateRemainingAmount = () => {
    if (!booking || !isPartialPayment) return 0;
    return booking.price - calculatePaymentAmount();
  };
  
  const handlePayment = (e) => {
    if (e) e.preventDefault();
    setIsProcessing(true);
    
    const paymentAmount = calculatePaymentAmount();
    const isFullPayment = !isPartialPayment;
    const remainingAmount = calculateRemainingAmount();
    
    // Prepare payment data (for API call)
    const paymentData = {
      bookingId: booking?.id,
      amount: paymentAmount,
      method: paymentMethod,
      isFullPayment: isFullPayment,
      remainingAmount: remainingAmount,
      paymentDate: new Date().toISOString(),
      // Add UPI ID, card details, etc. if collected
    };
    
    // In a real app, you would send this to your backend API
    console.log('Payment data:', paymentData);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      toast.success(`Payment of ₹${paymentAmount.toFixed(2)} successful!`);
      
      // If partial payment, show a reminder toast about remaining payment
      if (isPartialPayment) {
        toast.info(`Remaining amount of ₹${remainingAmount.toFixed(2)} to be paid to the driver`);
      }
      
      navigate(`/payment-success/${booking?.id}`);
    }, 2000);
  };

  // Show auth check or loading state
  if (!isAuthenticated || !booking) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-64">
        <div className="animate-pulse flex flex-col items-center">
          {!isAuthenticated ? (
            <>
              <div className="flex items-center justify-center mb-4">
                <FaLock className="text-4xl text-blue-500" />
              </div>
              <div className="h-8 w-64 bg-gray-300 rounded mb-4"></div>
              <div className="text-gray-600">Verifying your login...</div>
            </>
          ) : (
            <>
              <div className="h-8 w-64 bg-gray-300 rounded mb-4"></div>
              <div className="h-4 w-32 bg-gray-300 rounded"></div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Complete Your Payment</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6">
              {/* Partial Payment Option */}
              <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <FaInfoCircle className="text-blue-500 mr-2" />
                    <h3 className="font-semibold">Payment Options</h3>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={isPartialPayment}
                      onChange={() => setIsPartialPayment(!isPartialPayment)}
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {isPartialPayment ? 'Partial Payment' : 'Full Payment'}
                    </span>
                  </label>
                </div>
                
                {isPartialPayment && (
                  <div className="mt-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Advance percentage</span>
                      <span className="text-sm font-semibold">{advancePercentage}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="90" 
                      step="5"
                      value={advancePercentage}
                      onChange={(e) => setAdvancePercentage(parseInt(e.target.value))}
                      className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>10%</span>
                      <span>50%</span>
                      <span>90%</span>
                    </div>
                    <div className="mt-3 p-3 bg-blue-100 rounded-lg text-sm">
                      <div className="flex justify-between mb-1">
                        <span>Pay now:</span>
                        <span className="font-semibold">₹{calculatePaymentAmount().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pay to driver:</span>
                        <span className="font-semibold">₹{calculateRemainingAmount().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
              
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <input
                    type="radio"
                    id="card"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="h-4 w-4"
                  />
                  <label htmlFor="card" className="ml-2 flex items-center">
                    <FaCreditCard className="mr-2 text-blue-500" />
                    Credit/Debit Card
                  </label>
                </div>
                
                <div className="flex items-center mb-3">
                  <input
                    type="radio"
                    id="upi"
                    name="paymentMethod"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                    className="h-4 w-4"
                  />
                  <label htmlFor="upi" className="ml-2 flex items-center">
                    <FaMobile className="mr-2 text-green-500" />
                    UPI
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="cash"
                    name="paymentMethod"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={() => setPaymentMethod('cash')}
                    className="h-4 w-4"
                  />
                  <label htmlFor="cash" className="ml-2 flex items-center">
                    <FaMoneyBillWave className="mr-2 text-green-600" />
                    Cash On Arrival
                  </label>
                </div>
              </div>
              
              {paymentMethod === 'card' && (
                <form onSubmit={handlePayment} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-1">Card Number</label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                      placeholder="1234 5678 9012 3456"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 mb-1">Expiry Date</label>
                      <input
                        type="text"
                        className="w-full border rounded-lg p-2"
                        placeholder="MM/YY"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1">CVV</label>
                      <input
                        type="text"
                        className="w-full border rounded-lg p-2"
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-all flex items-center"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>{isPartialPayment ? `Pay ₹${calculatePaymentAmount().toFixed(2)} Now` : `Pay ₹${booking.price.toFixed(2)}`}</>
                      )}
                    </button>
                  </div>
                </form>
              )}
              
              {paymentMethod === 'upi' && (
                <form onSubmit={handlePayment} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-1">UPI ID</label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                      placeholder="name@bank"
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-all flex items-center"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>{isPartialPayment ? `Pay ₹${calculatePaymentAmount().toFixed(2)} Now` : `Pay ₹${booking.price.toFixed(2)}`}</>
                      )}
                    </button>
                  </div>
                </form>
              )}
              
              {paymentMethod === 'cash' && (
                <div className="space-y-4">
                  {isPartialPayment ? (
                    <p className="text-gray-700">You will pay <span className="font-semibold">₹{calculatePaymentAmount().toFixed(2)}</span> now as advance, and the remaining <span className="font-semibold">₹{calculateRemainingAmount().toFixed(2)}</span> directly to the driver at the time of pickup.</p>
                  ) : (
                    <p className="text-gray-700">You will pay the full amount of <span className="font-semibold">₹{booking.price.toFixed(2)}</span> directly to the driver at the time of pickup.</p>
                  )}
                  <div className="flex justify-end">
                    <button
                      onClick={handlePayment}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-all flex items-center"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        'Confirm Booking'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking ID</span>
                  <span className="font-medium">{booking.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">From</span>
                  <span className="font-medium">{booking.from}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">To</span>
                  <span className="font-medium">{booking.to}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date</span>
                  <span className="font-medium">{booking.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time</span>
                  <span className="font-medium">{booking.time}</span>
                </div>
                {booking.returnDate && booking.tripType === 'roundTrip' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Return Date</span>
                      <span className="font-medium">{booking.returnDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Return Time</span>
                      <span className="font-medium">{booking.returnTime}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Cab Type</span>
                  <span className="font-medium">{booking.cabType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance</span>
                  <span className="font-medium">{booking.distance}</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>₹{booking.price.toFixed(2)}</span>
                  </div>
                  {isPartialPayment && (
                    <>
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-gray-600">Pay now:</span>
                        <span className="text-blue-600 font-medium">₹{calculatePaymentAmount().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Pay later:</span>
                        <span className="text-gray-600 font-medium">₹{calculateRemainingAmount().toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
