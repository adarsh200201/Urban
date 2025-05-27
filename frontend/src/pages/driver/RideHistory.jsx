import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { FaMapMarkerAlt, FaCalendarAlt, FaRupeeSign, FaClock } from 'react-icons/fa';
import DriverLayout from '../../layouts/DriverLayout';
import { getBookingHistory, reset } from '../../features/driver/driverSlice';

const RideHistory = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { driver, bookingHistory, loading, error } = useSelector((state) => state.driver);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (driver && driver._id) {
      dispatch(getBookingHistory(driver._id));
    }

    return () => {
      dispatch(reset());
    };
  }, [dispatch, driver]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(reset());
    }
  }, [error, dispatch]);

  const filteredBookings = () => {
    if (filter === 'all') return bookingHistory;
    return bookingHistory.filter(booking => booking.status === filter);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'inProgress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading && bookingHistory.length === 0) {
    return (
      <DriverLayout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        </div>
      </DriverLayout>
    );
  }

  return (
    <DriverLayout>
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold mb-4 md:mb-0">Ride History</h1>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === 'all' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === 'completed' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === 'cancelled' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>
        
        {bookingHistory.length > 0 ? (
          <div className="space-y-4">
            {filteredBookings().map((booking) => (
              <div key={booking._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex items-center mb-2 md:mb-0">
                      <div className="mr-3">
                        <span className="text-xs font-semibold">Booking ID</span>
                        <p className="font-medium">{booking.bookingId}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="flex items-center mr-4">
                        <FaCalendarAlt className="text-gray-400 mr-1" />
                        <span className="text-sm">{formatDate(booking.pickupDate)}</span>
                      </div>
                      <div className="flex items-center">
                        <FaRupeeSign className="text-gray-400 mr-1" />
                        <span className="text-sm font-semibold">₹{booking.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <FaMapMarkerAlt className="text-green-500" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-gray-500">Pickup</p>
                          <p className="font-medium">{booking.pickupLocation?.name || 'Unknown'}</p>
                          <p className="text-sm">{booking.pickupAddress}</p>
                        </div>
                      </div>
                      
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                            <FaMapMarkerAlt className="text-red-500" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-gray-500">Drop</p>
                          <p className="font-medium">{booking.dropLocation?.name || 'Unknown'}</p>
                          <p className="text-sm">{booking.dropAddress}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <FaClock className="text-blue-500" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-gray-500">Journey Time</p>
                          <p className="font-medium">{booking.pickupTime}</p>
                          <p className="text-sm">
                            {booking.journeyType === 'roundTrip' 
                              ? `Return: ${formatDate(booking.returnDate)} at ${booking.returnTime}` 
                              : 'One Way'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-purple-500 font-medium">P</span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-gray-500">Passenger</p>
                          <p className="font-medium">{booking.passengerDetails?.name}</p>
                          <p className="text-sm">{booking.passengerDetails?.phone}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {booking.completedAt && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Completed on: {new Date(booking.completedAt).toLocaleString()}</span>
                        {booking.distance && (
                          <span>Distance: {booking.distance} km</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FaCalendarAlt className="text-gray-400 text-3xl" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No Ride History</h2>
            <p className="text-gray-600">You haven't completed any rides yet.</p>
          </div>
        )}
      </div>
    </DriverLayout>
  );
};

export default RideHistory;
