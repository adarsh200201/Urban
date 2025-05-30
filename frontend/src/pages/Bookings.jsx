import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { FaMapMarkerAlt, FaTaxi, FaCalendarAlt, FaRupeeSign, FaEye, FaSearch } from 'react-icons/fa';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  
  // Get user authentication data from Redux store instead of localStorage
  const { user } = useSelector(state => state.auth);
  
  useEffect(() => {
    // Import API URL from config
    const { API_URL } = require('../config/apiConfig');
    
    // Get bookings from MongoDB database only using API
    const fetchBookings = async () => {
      setIsLoading(true);
      
      try {
        // Get authentication token from Redux store
        let config = {};
        
        if (user && user.token) {
          config = {
            headers: {
              Authorization: `Bearer ${user.token}`
            }
          };
        }
        
        // Fetch bookings from MongoDB through API
        const response = await axios.get(`${API_URL}/booking`, config);
        
        if (response.data && response.data.success) {
          console.log('Bookings loaded from MongoDB:', response.data.data);
          
          // Transform API data to the format needed by the component
          const formattedBookings = response.data.data.map(booking => {
            // Extract data depending on whether fields are populated objects or strings
            const pickupLocation = 
              typeof booking.pickupLocation === 'object' && booking.pickupLocation?.name ? 
                `${booking.pickupLocation.name}${booking.pickupLocation.state ? `, ${booking.pickupLocation.state}` : ''}` : 
                booking.pickupAddress || '';
              
            const dropLocation = 
              typeof booking.dropLocation === 'object' && booking.dropLocation?.name ? 
                `${booking.dropLocation.name}${booking.dropLocation.state ? `, ${booking.dropLocation.state}` : ''}` : 
                booking.dropAddress || '';
              
            const cabName = 
              typeof booking.cabType === 'object' && booking.cabType?.name ? 
                booking.cabType.name : 
                '';
            
            // Extract driver information if available
            let driverName = 'Not assigned';
            let driverContact = 'N/A';
            let driverInfo = null;
            
            if (booking.driver && booking.status === 'assigned') {
              if (typeof booking.driver === 'object' && booking.driver !== null) {
                driverName = `${booking.driver.firstName || ''} ${booking.driver.lastName || ''}`.trim() || 'Driver';
                driverContact = booking.driver.phone || 'Not provided';
                driverInfo = booking.driver;
              } else if (typeof booking.driver === 'string' && booking.driver) {
                driverName = 'Driver Assigned';
                driverContact = 'See details';
              }
            }
            
            // Format booking ID - use bookingId if available or _id as fallback
            const bookingId = booking.bookingId || booking._id;
            
            return {
              id: booking._id,
              bookingId: bookingId,
              from: pickupLocation,
              to: dropLocation,
              date: booking.pickupDate,
              status: booking.status,
              amount: booking.totalAmount,
              cabName: cabName,
              paymentMethod: booking.paymentMethod,
              paymentStatus: booking.paymentStatus,
              userName: booking.passengerDetails?.name,
              userEmail: booking.passengerDetails?.email,
              userPhone: booking.passengerDetails?.phone,
              driverName: driverName,
              driverContact: driverContact,
              driverInfo: driverInfo,
              assignedAt: booking.assignedAt,
              rawData: booking // Keep the original data for debugging
            };
          });
          
          setBookings(formattedBookings);
        } else {
          console.warn('No bookings found in the database');
          setBookings([]);
        }
      } catch (error) {
        console.error('Error fetching bookings from API:', error);
        alert('Failed to load bookings from the database. Please try again later.');
        setBookings([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBookings();
  }, []);
  
  // Filter bookings based on search term and filter
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      (booking.from && booking.from.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (booking.to && booking.to.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (booking.id && booking.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (booking.cabName && booking.cabName.toLowerCase().includes(searchTerm.toLowerCase()));
      
    if (filter === 'all') return matchesSearch;
    if (filter === 'upcoming') {
      const bookingDate = new Date(booking.date);
      const today = new Date();
      return matchesSearch && bookingDate >= today;
    }
    if (filter === 'completed') {
      const bookingDate = new Date(booking.date);
      const today = new Date();
      return matchesSearch && bookingDate < today;
    }
    
    return matchesSearch;
  });
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }
  
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
        {filteredBookings.length === 0 ? (
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
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="mb-4 md:mb-0">
                      <div className="flex items-start mb-4">
                        <div className="flex-shrink-0 bg-blue-100 p-2 rounded-full mr-4">
                          <FaMapMarkerAlt className="text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-800">
                            {booking.from} to {booking.to}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Booking ID: <span className="font-medium">{booking.bookingId || booking.id}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center">
                          <FaCalendarAlt className="text-gray-500 mr-2" />
                          <span className="text-sm">
                            {booking.date ? new Date(booking.date).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            }) : 'Not specified'}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <FaTaxi className="text-gray-500 mr-2" />
                          <span className="text-sm">{booking.cabName || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center">
                          <FaRupeeSign className="text-gray-500 mr-2" />
                          <span className="text-sm">₹{booking.amount || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium text-center 
                        ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                          booking.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                          booking.status === 'inProgress' ? 'bg-purple-100 text-purple-800' :
                          booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}
                      >
                        {!booking.status ? '' :
                         booking.status === 'inProgress' ? 'In Progress' :
                         booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium text-center 
                        ${booking.paymentMethod === 'cod' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}
                      >
                        {booking.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                         booking.paymentMethod === 'razorpay' ? 'Razorpay' : 
                         booking.paymentMethod === 'upi' ? 'UPI' : 
                         booking.paymentMethod === 'card' ? 'Card' : 
                         booking.paymentMethod || ''}
                      </div>
                      {/* Driver information if assigned */}
                      {booking.status === 'assigned' && booking.driverName !== 'Not assigned' && (
                        <div className="mt-2 px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700">
                          Driver: {booking.driverName}
                        </div>
                      )}
                      <Link 
                        to={`/booking/${booking.bookingId || booking.id}`}
                        className="mt-2 flex items-center justify-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <FaEye /> View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination - for future use when there are many bookings */}
        {filteredBookings.length > 10 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-1 rounded bg-blue-600 text-white">
                1
              </button>
              <button className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-blue-50">
                2
              </button>
              <button className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;
