import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Payment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  
  // This would normally be fetched from an API using the bookingId
  const booking = {
    id: bookingId,
    from: 'Mumbai',
    to: 'Pune',
    date: '2025-04-25',
    time: '09:00 AM',
    cabType: 'SUV',
    price: 3200,
    distance: '150 km'
  };

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handlePayment = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      toast.success('Payment successful!');
      navigate(`/payment-success/${bookingId}`);
    }, 2000);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Complete Your Payment</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
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
                  <label htmlFor="card" className="ml-2">Credit/Debit Card</label>
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
                  <label htmlFor="upi" className="ml-2">UPI</label>
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
                  <label htmlFor="cash" className="ml-2">Cash On Arrival</label>
                </div>
              </div>
              
              {paymentMethod === 'card' && (
                <form onSubmit={handlePayment} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-1">Card Number</label>
                    <input
                      type="text"
                      className="w-full border rounded p-2"
                      placeholder="1234 5678 9012 3456"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 mb-1">Expiry Date</label>
                      <input
                        type="text"
                        className="w-full border rounded p-2"
                        placeholder="MM/YY"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1">CVV</label>
                      <input
                        type="text"
                        className="w-full border rounded p-2"
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      className="w-full border rounded p-2"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Pay Now'}
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
                      className="w-full border rounded p-2"
                      placeholder="name@bank"
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Pay Now'}
                    </button>
                  </div>
                </form>
              )}
              
              {paymentMethod === 'cash' && (
                <div className="space-y-4">
                  <p className="text-gray-700">You will pay cash directly to the driver at the time of pickup.</p>
                  <div className="flex justify-end">
                    <button
                      onClick={handlePayment}
                      className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Confirm Booking'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <div className="bg-white rounded-lg shadow-md p-6">
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
