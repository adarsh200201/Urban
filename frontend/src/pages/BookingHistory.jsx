import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaMapMarkerAlt, FaTaxi, FaCalendarAlt, FaRupeeSign, FaEye, FaSearch, FaFilter } from 'react-icons/fa';

const BookingHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useSelector(state => state.auth);

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const API_URL = 'http://localhost:5000/api';
  
  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      
      try {
        // Attempt to get bookings from the database via API
        const config = user && user.token ? {
          headers: { Authorization: `Bearer ${user.token}` }
        } : {};
        
        // First try to get user-specific bookings if logged in
        if (user && user.token) {
          try {
            console.log('Fetching user bookings from MongoDB...');
            const response = await axios.get(`${API_URL}/booking/my-bookings`, config);
            
            if (response.data && response.data.success) {
              console.log('User bookings fetched successfully:', response.data.data);
              setBookings(response.data.data);
              setIsLoading(false);
              return;
            }
          } catch (userBookingError) {
            console.error('Error fetching user bookings:', userBookingError);
            // Continue to try public bookings endpoint
          }
        }
        
        // If not logged in or user bookings failed, get public bookings
        console.log('Fetching public bookings from MongoDB...');
        const publicResponse = await axios.get(`${API_URL}/booking`, config);
        
        if (publicResponse.data && publicResponse.data.success) {
          console.log('Public bookings fetched successfully:', publicResponse.data.data);
          setBookings(publicResponse.data.data);
        } else {
          console.warn('No bookings found in the database');
          setBookings([]);
          toast.info('No booking history found');
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        toast.error('Unable to fetch booking history. Please try again later.');
        setBookings([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBookings();
  }, [user, API_URL]);

  // Format date to readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Filter bookings based on search term and filter
  const filteredBookings = bookings.filter(booking => {
    // Extract location names from objects if needed
    const fromCity = 
      typeof booking.pickupLocation === 'object' && booking.pickupLocation?.name ? 
        booking.pickupLocation.name : 
        booking.fromCity || booking.from || '';
        
    const toCity = 
      typeof booking.dropLocation === 'object' && booking.dropLocation?.name ? 
        booking.dropLocation.name : 
        booking.toCity || booking.to || '';
        
    const bookingId = booking.bookingId || booking._id || booking.id || '';
    
    const cabName = 
      typeof booking.cabType === 'object' && booking.cabType?.name ? 
        booking.cabType.name : 
        booking.cabName || '';
    
    const matchesSearch = 
      fromCity.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      toCity.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(bookingId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      cabName.toString().toLowerCase().includes(searchTerm.toLowerCase());
      
    if (filter === 'all') return matchesSearch;
    if (filter === 'upcoming') {
      const bookingDate = new Date(booking.pickupDate || booking.travelDate || booking.date || Date.now());
      const today = new Date();
      return matchesSearch && bookingDate >= today;
    }
    if (filter === 'completed') {
      const bookingDate = new Date(booking.pickupDate || booking.travelDate || booking.date || Date.now());
      const today = new Date();
      return matchesSearch && bookingDate < today;
    }
    
    return matchesSearch;
  });
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Bookings</h1>
            <p className="text-gray-600 mt-1">View and manage all your cab bookings</p>
          </div>
          <Link to="/" className="mt-4 md:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Book a New Cab
          </Link>
        </div>
        
        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search bookings..."
                className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-shrink-0">
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Bookings</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Bookings List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="rounded-full bg-blue-100 p-3 inline-block mb-4">
              <FaTaxi className="h-8 w-8 text-blue-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No Bookings Found</h2>
            <p className="text-gray-600 mb-6">You haven't made any bookings yet or no bookings match your search.</p>
            <Link to="/" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              Book Your First Cab
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredBookings.map(booking => {
              const id = booking.bookingId || booking._id || booking.id;
              
              // Extract location names from objects if needed including state information
              const fromCity = 
                typeof booking.pickupLocation === 'object' && booking.pickupLocation?.name ? 
                  `${booking.pickupLocation.name}${booking.pickupLocation.state ? `, ${booking.pickupLocation.state}` : ''}` : 
                  booking.fromCity || booking.from || 'Origin';
                  
              const toCity = 
                typeof booking.dropLocation === 'object' && booking.dropLocation?.name ? 
                  `${booking.dropLocation.name}${booking.dropLocation.state ? `, ${booking.dropLocation.state}` : ''}` : 
                  booking.toCity || booking.to || 'Destination';
                  
              const bookingDate = new Date(booking.pickupDate || booking.travelDate || booking.date || Date.now());
              const formattedDate = bookingDate.toLocaleDateString();
              
              const cabName = 
                typeof booking.cabType === 'object' && booking.cabType?.name ? 
                  booking.cabType.name : 
                  booking.cabName || 'Standard Cab';
                  
              const amount = booking.amount || booking.fare || booking.totalAmount || 0;
              const status = booking.status || 'confirmed';
              const paymentMethod = booking.paymentMethod || 'online';
              
              return (
                <div key={id} className="bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between">
                      <div className="mb-4 md:mb-0">
                        <div className="flex items-start mb-4">
                          <div className="flex-shrink-0 bg-blue-100 p-2 rounded-full mr-4">
                            <FaMapMarkerAlt className="text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-800">
                              {fromCity} to {toCity}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Booking ID: <span className="font-medium">{typeof id === 'string' ? id : String(id)}</span>
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-4">
                          <div className="flex items-center">
                            <FaCalendarAlt className="text-gray-500 mr-2" />
                            <span className="text-sm">{formattedDate}</span>
                          </div>
                          <div className="flex items-center">
                            <FaTaxi className="text-gray-500 mr-2" />
                            <span className="text-sm">{cabName}</span>
                          </div>
                          <div className="flex items-center">
                            <FaRupeeSign className="text-gray-500 mr-2" />
                            <span className="text-sm">₹{amount}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium text-center 
                          ${status === 'confirmed' || status === 'completed' ? 'bg-green-100 text-green-800' : 
                            status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium text-center 
                          ${paymentMethod === 'cod' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}
                        >
                          {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid Online'}
                        </div>
                        <Link 
                          to={`/booking/${id}`}
                          className="mt-2 flex items-center justify-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <FaEye /> View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingHistory;
