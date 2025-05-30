import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { updateProfile } from '../features/auth/authSlice';
import axios from 'axios';
import { FaUser, FaHistory, FaMapMarkerAlt, FaCreditCard, FaCog, FaCarSide } from 'react-icons/fa';

const Profile = () => {
  const { user, isLoading, isError, message } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [bookings, setBookings] = useState([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [preferences, setPreferences] = useState({
    preferredCabType: '',
    preferredPaymentMethod: '',
    notifications: true,
    emailUpdates: true
  });
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalDistance: 0,
    favoriteRoute: '',
    favoriteDriver: ''
  });

  // API URL
  // Import API URL from config
  const { API_URL } = require('../config/apiConfig');

  // Load user data and fetch bookings when component mounts
  useEffect(() => {
    if (user) {
      // Set form data from user info
      setFormData({
        name: user.user.name || '',
        email: user.user.email || '',
        phone: user.user.phone || '',
        address: user.user.address || '',
        city: user.user.city || '',
        state: user.user.state || '',
        pincode: user.user.pincode || ''
      });
      
      // Fetch user bookings
      const fetchUserBookings = async () => {
        setIsLoadingBookings(true);
        try {
          const config = {
            headers: {
              'Authorization': `Bearer ${user.token}`
            }
          };
          
          const response = await axios.get(`${API_URL}/booking/user`, config);
          
          if (response.data.success) {
            const bookingsData = response.data.data;
            setBookings(bookingsData);
            
            // Calculate user statistics dynamically based on booking history
            if (bookingsData.length > 0) {
              // Calculate total trips
              const totalTrips = bookingsData.length;
              
              // Calculate total distance traveled
              const totalDistance = bookingsData.reduce((total, booking) => {
                return total + (booking.distance || 0);
              }, 0);
              
              // Find favorite route (most frequently traveled)
              const routes = {};
              bookingsData.forEach(booking => {
                const route = `${booking.pickup.city} to ${booking.dropoff.city}`;
                routes[route] = (routes[route] || 0) + 1;
              });
              
              let favoriteRoute = '';
              let maxRouteCount = 0;
              
              Object.keys(routes).forEach(route => {
                if (routes[route] > maxRouteCount) {
                  maxRouteCount = routes[route];
                  favoriteRoute = route;
                }
              });
              
              // Find favorite driver (most trips with)
              const drivers = {};
              bookingsData.forEach(booking => {
                if (booking.driver && booking.driver.name) {
                  const driverName = booking.driver.name;
                  drivers[driverName] = (drivers[driverName] || 0) + 1;
                }
              });
              
              let favoriteDriver = '';
              let maxDriverCount = 0;
              
              Object.keys(drivers).forEach(driver => {
                if (drivers[driver] > maxDriverCount) {
                  maxDriverCount = drivers[driver];
                  favoriteDriver = driver;
                }
              });
              
              // Update stats state with calculated values
              setStats({
                totalTrips,
                totalDistance,
                favoriteRoute: favoriteRoute || 'None yet',
                favoriteDriver: favoriteDriver || 'None yet'
              });
            }
          }
        } catch (error) {
          console.error('Error fetching bookings:', error);
          // Don't show error toast here to avoid overwhelming the user
        } finally {
          setIsLoadingBookings(false);
        }
      };
      
      fetchUserBookings();
      
      // Load user preferences if available
      if (user.user.preferences) {
        setPreferences({
          ...preferences,
          ...user.user.preferences
        });
      }
    }
  }, [user]);

  // Show toast messages on error
  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
  }, [isError, message]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate fields
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }
    
    // Dispatch update profile action
    dispatch(updateProfile(formData));
    setIsEditing(false);
  };
  
  const handlePreferenceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const savePreferences = async () => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      };
      
      const response = await axios.put(`${API_URL}/user/preferences`, { preferences }, config);
      
      if (response.data.success) {
        toast.success('Preferences updated successfully');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 mt-16">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between">
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-4xl font-bold mb-4 md:mb-0">
              {formData.name.charAt(0)}
            </div>
            <div className="md:ml-6 text-center md:text-left">
              <h1 className="text-2xl font-bold">{formData.name}</h1>
              <p className="text-gray-600 mb-2">{formData.email}</p>
              <p className="text-gray-600">{formData.phone}</p>
              
              {/* User Stats Summary */}
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
                <div className="bg-blue-50 rounded-lg px-3 py-1">
                  <span className="font-semibold">{stats.totalTrips}</span> trips
                </div>
                <div className="bg-green-50 rounded-lg px-3 py-1">
                  <span className="font-semibold">{stats.totalDistance}</span> km traveled
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0">
            <button 
              onClick={() => setActiveTab('profile') || setIsEditing(!isEditing)}
              className={`px-4 py-2 rounded ${isEditing && activeTab === 'profile' ? 'bg-gray-200 text-gray-800' : 'bg-blue-600 text-white'}`}
            >
              {isEditing && activeTab === 'profile' ? 'Cancel Editing' : 'Edit Profile'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="flex border-b mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 font-medium ${activeTab === 'profile' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'} flex items-center`}
        >
          <FaUser className="mr-2" /> Profile
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2 font-medium ${activeTab === 'bookings' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'} flex items-center`}
        >
          <FaHistory className="mr-2" /> Booking History
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-4 py-2 font-medium ${activeTab === 'preferences' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'} flex items-center`}
        >
          <FaCog className="mr-2" /> Preferences
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 font-medium ${activeTab === 'stats' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'} flex items-center`}
        >
          <FaCarSide className="mr-2" /> Travel Stats
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <>
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full border rounded p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full border rounded p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full border rounded p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full border rounded p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full border rounded p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      className="w-full border rounded p-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full border rounded p-2"
                    rows="3"
                    required
                  ></textarea>
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-600 text-sm">Full Name</p>
                      <p className="font-medium">{formData.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Email</p>
                      <p className="font-medium">{formData.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Phone</p>
                      <p className="font-medium">{formData.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Address Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-600 text-sm">Address</p>
                      <p className="font-medium">{formData.address || 'Not provided'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600 text-sm">City</p>
                        <p className="font-medium">{formData.city || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">State</p>
                        <p className="font-medium">{formData.state || 'Not provided'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Pincode</p>
                      <p className="font-medium">{formData.pincode || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Booking History Tab */}
        {activeTab === 'bookings' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Your Booking History</h2>
            
            {isLoadingBookings ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <div className="text-gray-500 mb-2">No bookings yet</div>
                <Link to="/" className="text-blue-600 font-medium hover:underline">Book your first ride</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking._id} className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold">{booking.pickup.city} to {booking.dropoff.city}</h3>
                        <p className="text-gray-600 text-sm">
                          {new Date(booking.date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })} • {booking.time || 'Time not specified'}
                        </p>
                      </div>
                      <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {booking.status || 'Completed'}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div>
                        <p className="text-gray-500 text-xs">Distance</p>
                        <p className="font-medium">{booking.distance || 0} km</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Cab Type</p>
                        <p className="font-medium">{booking.cab && booking.cab.name ? booking.cab.name : 'Standard'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Amount</p>
                        <p className="font-medium">₹{booking.amount || booking.totalAmount || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Payment</p>
                        <p className="font-medium">{booking.paymentMethod || 'COD'}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Link 
                        to={`/booking/${booking._id}`} 
                        className="text-blue-600 text-sm font-medium hover:underline"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div>
            <h2 className="text-xl font-bold mb-6">Your Travel Preferences</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Cab Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-1">Preferred Cab Type</label>
                    <select
                      name="preferredCabType"
                      value={preferences.preferredCabType}
                      onChange={handlePreferenceChange}
                      className="w-full border rounded p-2"
                    >
                      <option value="">No preference</option>
                      <option value="sedan">Sedan</option>
                      <option value="suv">SUV</option>
                      <option value="luxury">Luxury</option>
                      <option value="compact">Compact</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-1">Preferred Payment Method</label>
                    <select
                      name="preferredPaymentMethod"
                      value={preferences.preferredPaymentMethod}
                      onChange={handlePreferenceChange}
                      className="w-full border rounded p-2"
                    >
                      <option value="">No preference</option>
                      <option value="cod">Cash on Delivery</option>
                      <option value="card">Credit/Debit Card</option>
                      <option value="upi">UPI</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Communication Preferences</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="notifications"
                      name="notifications"
                      checked={preferences.notifications}
                      onChange={handlePreferenceChange}
                      className="mr-2"
                    />
                    <label htmlFor="notifications">
                      Receive push notifications for booking updates
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="emailUpdates"
                      name="emailUpdates"
                      checked={preferences.emailUpdates}
                      onChange={handlePreferenceChange}
                      className="mr-2"
                    />
                    <label htmlFor="emailUpdates">
                      Receive email updates about new offers and promotions
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={savePreferences}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
        
        {/* Travel Stats Tab */}
        {activeTab === 'stats' && (
          <div>
            <h2 className="text-xl font-bold mb-6">Your Travel Statistics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm mb-1">Total Trips</p>
                <p className="text-2xl font-bold text-blue-700">{stats.totalTrips}</p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm mb-1">Total Distance</p>
                <p className="text-2xl font-bold text-green-700">{stats.totalDistance} km</p>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm mb-1">Favorite Route</p>
                <p className="text-lg font-bold text-purple-700">{stats.favoriteRoute}</p>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm mb-1">Favorite Driver</p>
                <p className="text-lg font-bold text-yellow-700">{stats.favoriteDriver}</p>
              </div>
            </div>
            
            {bookings.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold mb-4">Monthly Travel History</h3>
                <div className="bg-gray-50 p-6 rounded-lg h-64 flex items-center justify-center">
                  <p className="text-gray-500">Travel history chart will be displayed here</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <div className="text-gray-500 mb-2">No travel data available yet</div>
                <Link to="/" className="text-blue-600 font-medium hover:underline">Book your first ride to see statistics</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
