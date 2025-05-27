import React, { useState } from 'react';

const BookingTrack = () => {
  const [bookingId, setBookingId] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Tracking logic will be implemented here
    console.log('Tracking booking:', { bookingId, email });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Track Your Booking</h1>
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700">Booking ID</label>
            <input 
              type="text" 
              className="w-full border rounded p-2" 
              placeholder="Enter your booking ID" 
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Email</label>
            <input 
              type="email" 
              className="w-full border rounded p-2" 
              placeholder="Enter your email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
            Track Booking
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingTrack;
