import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaTaxi, FaMapMarkerAlt, FaCalendarAlt, FaUser, FaHistory, FaClock, FaRupeeSign } from 'react-icons/fa';

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState([]);
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const { user } = useSelector(state => state.auth || {});
  // Import API URL from config
  const { API_URL } = require('../config/apiConfig');
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      let bookingsData = [];
      
      // Get data from MongoDB through the API
      if (user && user.token) {
        try {
          const config = {
            headers: {
              Authorization: `Bearer ${user.token}`
            }
          };
          
          // Fetch user-specific bookings from MongoDB
          console.log('Fetching user bookings from /api/booking/my-bookings');
          try {
            const bookingsResponse = await axios.get(`${API_URL}/booking/my-bookings`, config);
            if (bookingsResponse.data && bookingsResponse.data.success) {
              bookingsData = bookingsResponse.data.data;
              console.log('User bookings fetched successfully:', bookingsData);
            } else {
              console.log('No bookings found for user in database');
              // Try public bookings as fallback
              const publicBookingsResponse = await axios.get(`${API_URL}/booking`, config);
              if (publicBookingsResponse.data && publicBookingsResponse.data.success) {
                bookingsData = publicBookingsResponse.data.data;
                console.log('Public bookings fetched as fallback:', bookingsData);
              }
            }
          } catch (bookingError) {
            console.error('Error fetching user bookings:', bookingError);
            // Try public bookings as fallback
            try {
              const publicBookingsResponse = await axios.get(`${API_URL}/booking`, config);
              if (publicBookingsResponse.data && publicBookingsResponse.data.success) {
                bookingsData = publicBookingsResponse.data.data;
                console.log('Public bookings fetched as fallback:', bookingsData);
              }
            } catch (publicError) {
              console.error('Error fetching public bookings:', publicError);
            }
          }
          
          // Fetch user profile from MongoDB
          console.log('Fetching user profile from /api/user/profile');
          try {
            const profileResponse = await axios.get(`${API_URL}/user/profile`, config);
            if (profileResponse.data && profileResponse.data.success) {
              setUserProfile(profileResponse.data.data);
              console.log('User profile fetched successfully:', profileResponse.data.data);
            } else {
              console.log('No user profile found in database');
              // If we can't get profile from API but have user data in Redux
              if (user) {
                setUserProfile({
                  name: user.name,
                  email: user.email,
                  phone: user.phone,
                  createdAt: user.createdAt || new Date().toISOString()
                });
                console.log('Using profile from Redux state as fallback');
              }
            }
          } catch (profileError) {
            console.error('Error fetching user profile:', profileError);
            // Use profile from Redux state if available
            if (user) {
              setUserProfile({
                name: user.name,
                email: user.email,
                phone: user.phone,
                createdAt: user.createdAt || new Date().toISOString()
              });
              console.log('Using profile from Redux state as fallback after error');
            }
          }
        } catch (apiError) {
          console.error('Failed to fetch data from the database:', apiError);
          toast.error('Could not connect to the server. Please try again later.');
        }
      } else {
        console.log('User not authenticated. Please log in to view dashboard.');
        toast.warning('Please log in to view your dashboard');
      }
      
      // Process and organize booking data
      if (bookingsData.length > 0) {
        // Filter for upcoming trips (future date)
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to beginning of day for comparison
        
        // Process bookings data from MongoDB
        const processedBookings = bookingsData.map(booking => {
          // Extract location names from objects if needed
          const pickupLocation = 
            typeof booking.pickupLocation === 'object' && booking.pickupLocation?.name ? 
              booking.pickupLocation.name : 
              booking.pickupAddress || 'N/A';
              
          const dropLocation = 
            typeof booking.dropLocation === 'object' && booking.dropLocation?.name ? 
              booking.dropLocation.name : 
              booking.dropAddress || 'N/A';
              
          const cabName = 
            typeof booking.cabType === 'object' && booking.cabType?.name ? 
              booking.cabType.name : 
              booking.cabName || 'Standard Cab';
          
          // Return normalized booking object
          return {
            id: booking._id || booking.bookingId,
            from: pickupLocation,
            to: dropLocation,
            date: booking.pickupDate || booking.date || new Date().toISOString(),
            status: booking.status || 'pending',
            amount: booking.totalAmount || booking.amount || 0,
            cabName: cabName,
            paymentMethod: booking.paymentMethod || 'cod',
            paymentStatus: booking.paymentStatus || 'pending'
          };
        });
        
        // Filter for upcoming trips
        const upcoming = processedBookings.filter(booking => {
          // Check if booking has a valid date
          if (!booking.date) return false;
          
          // Parse date depending on format
          let bookingDate;
          try {
            bookingDate = new Date(booking.date);
            bookingDate.setHours(0, 0, 0, 0); // Set to beginning of day for comparison
          } catch (e) {
            return false; // Invalid date format
          }
          
          // Keep only future dates
          return bookingDate >= today;
        });
        
        // Recent bookings (all, sorted by date)
        const recent = [...processedBookings].sort((a, b) => {
          const dateA = new Date(a.date || 0);
          const dateB = new Date(b.date || 0);
          return dateB - dateA; // Sort descending (newest first)
        }).slice(0, 5); // Limit to 5 results
        
        setRecentBookings(recent);
        setUpcomingTrips(upcoming.slice(0, 3)); // Show top 3 upcoming bookings
      }
      
      setIsLoading(false);
    };
    
    fetchDashboardData();
  }, [user, API_URL]);
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(date).toLocaleDateString(undefined, options);
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Dashboard</h1>
        <Link to="/bookings" className="mt-4 md:mt-0 text-blue-600 hover:text-blue-800 font-medium">
          View All Bookings →
        </Link>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Bookings Card */}
          <div className="bg-white rounded-xl shadow-md p-6 overflow-hidden">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <FaHistory className="text-blue-600 text-xl" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Recent Bookings</h2>
            </div>
            
            {recentBookings.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500">No recent bookings found</p>
                <Link to="/" className="mt-3 inline-block text-blue-600 hover:text-blue-800">
                  Book your first cab
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentBookings.map(booking => (
                  <div key={booking.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">{booking.from} to {booking.to}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <FaCalendarAlt className="mr-1 text-gray-400" size={12} />
                          {booking.formattedDate}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-blue-600">₹{booking.amount}</div>
                        <div className={`text-xs px-2 py-1 rounded-full ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </div>
                      </div>
                    </div>
                    <Link to={`/booking/${booking.id}`} className="text-sm text-blue-600 hover:text-blue-800">
                      View details →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Upcoming Trips Card */}
          <div className="bg-white rounded-xl shadow-md p-6 overflow-hidden">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 p-2 rounded-full mr-3">
                <FaClock className="text-green-600 text-xl" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Upcoming Trips</h2>
            </div>
            
            {upcomingTrips.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500">No upcoming trips scheduled</p>
                <Link to="/" className="mt-3 inline-block text-blue-600 hover:text-blue-800">
                  Schedule a new trip
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingTrips.map(trip => (
                  <div key={trip.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">{trip.from} to {trip.to}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <FaCalendarAlt className="mr-1 text-gray-400" size={12} />
                          {trip.formattedDate}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-blue-600">₹{trip.amount}</div>
                        <div className={`text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800`}>
                          {trip.cabType}
                        </div>
                      </div>
                    </div>
                    <Link to={`/booking/${trip.id}`} className="text-sm text-blue-600 hover:text-blue-800">
                      View details →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-md p-6 overflow-hidden">
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 p-2 rounded-full mr-3">
                <FaUser className="text-purple-600 text-xl" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Profile Summary</h2>
            </div>
            
            {userProfile ? (
              <div className="space-y-4">
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-bold">
                    {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'G'}
                  </div>
                </div>
                
                <div className="text-center mb-6">
                  <h3 className="font-semibold text-lg">{userProfile.name || 'Guest User'}</h3>
                  <p className="text-gray-500 text-sm">{userProfile.email || 'guest@example.com'}</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Total Bookings</span>
                    <span className="font-medium">{recentBookings.length + upcomingTrips.length}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Member Since</span>
                    <span className="font-medium">{formatDate(userProfile.joinedDate || userProfile.createdAt || Date.now())}</span>
                  </div>
                  
                  {userProfile.phone && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Phone</span>
                      <span className="font-medium">{userProfile.phone}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex justify-center">
                  <Link to="/profile" className="text-blue-600 hover:text-blue-800 font-medium">
                    View Full Profile
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">Sign in to view your profile</p>
                <Link to="/login" className="mt-3 inline-block text-blue-600 hover:text-blue-800">
                  Sign In
                </Link>
              </div>
            )}
          </div>
          
          {/* Quick Actions Card */}
          <div className="bg-white rounded-xl shadow-md p-6 overflow-hidden lg:col-span-3">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/" className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 text-center transition-colors duration-200">
                <FaTaxi className="mx-auto text-blue-500 text-2xl mb-2" />
                <span className="font-medium">Book a Cab</span>
              </Link>
              
              <Link to="/bookings" className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 text-center transition-colors duration-200">
                <FaHistory className="mx-auto text-blue-500 text-2xl mb-2" />
                <span className="font-medium">View Bookings</span>
              </Link>
              
              <Link to="/profile" className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 text-center transition-colors duration-200">
                <FaUser className="mx-auto text-blue-500 text-2xl mb-2" />
                <span className="font-medium">Edit Profile</span>
              </Link>
              
              <Link to="/contact" className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 text-center transition-colors duration-200">
                <FaMapMarkerAlt className="mx-auto text-blue-500 text-2xl mb-2" />
                <span className="font-medium">Contact Us</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
