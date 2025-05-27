import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { FaCarAlt, FaRoute, FaCalendarAlt, FaUserCheck, FaMapMarkerAlt, FaUser, FaMoneyBillWave, FaChartLine, FaWallet } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import DriverLayout from '../../layouts/DriverLayout';
import { getDriverProfile, getBookingHistory, updateDriverLocation, reset } from '../../features/driver/driverSlice';
import socketService from '../../utils/socketService';

// Helper function to get date ranges
const getStartOfWeek = () => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const diff = now.getDate() - dayOfWeek;
  return new Date(now.setDate(diff));
};

const getStartOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

const DriverDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { driver: driverAuth } = useSelector((state) => state.driverAuth);
  const { driver, bookingHistory, loading, error, success, message } = useSelector((state) => state.driver);
  const [locationWatcher, setLocationWatcher] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [historyRequested, setHistoryRequested] = useState(false);

  // Only log on development environment
  if (process.env.NODE_ENV === 'development' && false) { // disabled for now
    console.log('Current driver auth state:', driverAuth);
    console.log('Current driver profile state:', driver);
  }

  // Initialize socket connection for real-time updates - separated into connect and event listener phases
  // Socket initialization - only runs once when component mounts
  useEffect(() => {
    console.log('Driver Dashboard socket initialization');
    
    // Connect to socket server - this is a singleton now and will only connect once
    socketService.connect();
    
    // We'll handle the event listeners in a separate useEffect
    // No cleanup here - we want to keep the socket alive for the entire app session
  }, []); // Empty dependency array means this only runs once
  
  // State for current assignment moved to the top level of the component
  
  // Set up event listeners when driver auth changes
  useEffect(() => {
    
    if (driverAuth) {
      // Get the driver ID
      const driverId = driverAuth._id || (driverAuth.driver && driverAuth.driver._id);
      
      if (driverId) {
        console.log(`Joining driver room for driver: ${driverId}`);
        
        // Join driver room to receive updates
        socketService.joinDriverRoom(driverId);
        
        // Listen for driver assignments with a specific handler for this component
        const driverAssignmentHandler = (data) => {
          console.log('Received real-time assignment:', data);
          
          // Verify this assignment is for the current driver
          if (data.driver._id === driverId) {
            setCurrentAssignment(data);
            
            // Show notification
            toast.success('You have been assigned a new ride!', {
              onClick: () => navigate('/driver/current-ride')
            });
          }
        };
        
        // Register the event handler
        socketService.onDriverAssigned(driverAssignmentHandler);
      }
    }
    
    // No socket disconnection here - only remove event listeners when component unmounts
  }, [driverAuth, navigate]);

  useEffect(() => {
    // First check if we already have driver profile data
    if (driver && driver._id) {
      // Profile already loaded
      setLoadingProfile(false);
      
      // Load booking history when driver profile is loaded
      if (!bookingHistory) {
        dispatch(getBookingHistory(driver._id));
      }
      return;
    }

    // Check if we have driver auth and it contains the proper driver object
    if (driverAuth) {
      // Try to get the driver ID from various possible locations in the auth object
      const driverId = 
        // Check direct ID on driver object
        (driverAuth._id) || 
        // Check nested driver object ID
        (driverAuth.driver && driverAuth.driver._id) || 
        // Check for ID property instead of _id
        (driverAuth.id) || 
        // Check nested driver object with id property
        (driverAuth.driver && driverAuth.driver.id);
      
      if (driverId) {
        // Load the driver profile silently (no logs)
        dispatch(getDriverProfile(driverId));
      } else {
        toast.error('Unable to load driver profile. Please try logging in again.');
        setLoadingProfile(false);
      }
    } else {
      setLoadingProfile(false);
    }

    // Clean up on unmount - only remove event listeners, don't disconnect the socket
    return () => {
      // Socket disconnection is now handled at the App level
      console.log('Cleaning up event listeners in DriverDashboard');
      // No need to disconnect socket here
      dispatch(reset());
      
      // Clean up location watcher if it exists
      if (locationWatcher) {
        clearInterval(locationWatcher);
        setLocationWatcher(null);
      }
    };
  }, [dispatch, driverAuth, driver]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(reset());
      setLoadingProfile(false);
    }

    if (success) {
      toast.success(message);
      dispatch(reset());
    }
    
    // Set loading to false when we get the driver profile
    if (driver && driver._id) {
      setLoadingProfile(false);
    }
  }, [error, success, message, dispatch, driver]);

  useEffect(() => {
    // Start watching location if driver is available
    if (driver && driver._id && driver.isAvailable) {
      startLocationTracking();
    } else if (locationWatcher) {
      // Stop watching if driver becomes unavailable
      navigator.geolocation.clearWatch(locationWatcher);
      setLocationWatcher(null);
    }
  }, [driver]);

  // Use state to track last update time to throttle location updates
  const [lastUpdateTime, setLastUpdateTime] = useState(0);
  const LOCATION_UPDATE_INTERVAL = 60000; // 60 seconds between updates (increased to reduce load)
  
  // State for current assignment (populated by socket)
  const [currentAssignment, setCurrentAssignment] = useState(null);
  // We'll calculate revenue from actual booking data later
  
  // Make sure booking history is fetched if not already loaded
  useEffect(() => {
    if (driver && driver._id && !historyRequested) {
      console.log('Fetching booking history for driver:', driver._id);
      dispatch(getBookingHistory(driver._id));
      setHistoryRequested(true);
    }
  }, [dispatch, driver, historyRequested]);
  
  // Calculate revenue metrics based on actual booking data
  const calculateTotalEarnings = () => {
    if (!bookingHistory || bookingHistory.length === 0) return 0;
    return bookingHistory.reduce((total, booking) => {
      if (booking.status === 'completed' && booking.fare) {
        return total + Number(booking.fare);
      }
      return total;
    }, 0);
  };
  
  const calculateWeeklyEarnings = () => {
    if (!bookingHistory || bookingHistory.length === 0) return 0;
    const startOfWeek = getStartOfWeek();
    
    return bookingHistory.reduce((total, booking) => {
      if (
        booking.status === 'completed' && 
        booking.fare && 
        new Date(booking.updatedAt) >= startOfWeek
      ) {
        return total + Number(booking.fare);
      }
      return total;
    }, 0);
  };
  
  const calculateMonthlyEarnings = () => {
    if (!bookingHistory || bookingHistory.length === 0) return 0;
    const startOfMonth = getStartOfMonth();
    
    return bookingHistory.reduce((total, booking) => {
      if (
        booking.status === 'completed' && 
        booking.fare && 
        new Date(booking.updatedAt) >= startOfMonth
      ) {
        return total + Number(booking.fare);
      }
      return total;
    }, 0);
  };
  
  const calculatePendingPayments = () => {
    if (!bookingHistory || bookingHistory.length === 0) return 0;
    return bookingHistory.reduce((total, booking) => {
      if (
        (booking.status === 'assigned' || booking.status === 'confirmed' || booking.status === 'in-progress') && 
        booking.fare
      ) {
        return total + Number(booking.fare);
      }
      return total;
    }, 0);
  };
  
  const getBookingsThisWeek = () => {
    if (!bookingHistory || bookingHistory.length === 0) return 0;
    const startOfWeek = getStartOfWeek();
    
    return bookingHistory.filter(booking => 
      new Date(booking.createdAt) >= startOfWeek
    ).length;
  };
  
  const getBookingsThisMonth = () => {
    if (!bookingHistory || bookingHistory.length === 0) return 0;
    const startOfMonth = getStartOfMonth();
    
    return bookingHistory.filter(booking => 
      new Date(booking.createdAt) >= startOfMonth
    ).length;
  };
  
  // Only allow one active location tracking instance
  const startLocationTracking = () => {
    // If we already have an active interval, don't start another one
    if (locationWatcher) {
      return;
    }
    
    if (navigator.geolocation) {
      try {
        // Set up a simple interval to check location periodically
        const intervalId = setInterval(() => {
          // Only proceed if driver data is available
          if (!driver || !driver._id) return;
          
          // Check if enough time has passed since last update
          const now = Date.now();
          if (now - lastUpdateTime < LOCATION_UPDATE_INTERVAL) return;
          
          // Get current position
          navigator.geolocation.getCurrentPosition(
            (position) => {
              // Update driver location
              dispatch(updateDriverLocation({
                driverId: driver._id,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              }));
              
              // Update timestamp
              setLastUpdateTime(now);
            },
            // Silent error handling - no logs, no toasts
            () => {},
            { 
              enableHighAccuracy: false,
              maximumAge: 30000,
              timeout: 20000
            }
          );
        }, LOCATION_UPDATE_INTERVAL);
        
        // Store the interval ID
        setLocationWatcher(intervalId);
      } catch (e) {
        // Silent error - just show toast to user
        toast.error('Unable to track location');
      }
    } else {
      toast.error('Geolocation is not supported by this browser');
    }
  };

  return (
    <DriverLayout>
      {(loading || loadingProfile) ? (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
          <div className="ml-4 text-gray-700 font-medium">Loading driver dashboard...</div>
        </div>
      ) : !driver || !driver._id ? (
        <div className="flex flex-col justify-center items-center h-96">
          <div className="text-red-500 text-xl mb-4">Unable to load driver profile</div>
          <button 
            onClick={() => window.location.href = '/driver/login'}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            Return to Login
          </button>
        </div>
      ) : (
        <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-6">Driver Dashboard</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold">
                {driverAuth?.driver?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold">{driverAuth?.driver?.name}</h2>
                <p className="text-gray-600">{driverAuth?.driver?.phone}</p>
                <p className="text-gray-600">{driverAuth?.driver?.email}</p>
              </div>
            </div>
            
            <div className="flex flex-col">
              <span 
                className={`px-4 py-2 rounded-full text-white text-sm font-medium ${
                  driver?.isAvailable ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                {driver?.isAvailable ? 'Available' : 'Unavailable'}
              </span>
              
              {driver?.currentBooking && (
                <span className="mt-2 px-4 py-2 rounded-full bg-yellow-500 text-white text-sm font-medium">
                  On Trip
                </span>
              )}
            </div>
          </div>
          
          {driver && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Vehicle Information</h3>
                <p><span className="text-gray-600">Vehicle Type:</span> {driver.vehicleType ? 
                    (typeof driver.vehicleType === 'object' ? driver.vehicleType.name : driver.vehicleType) : 
                    'Not specified'}</p>
                <p><span className="text-gray-600">Vehicle Model:</span> {driver.vehicleModel}</p>
                <p><span className="text-gray-600">Vehicle Number:</span> {driver.vehicleNumber}</p>
                <p><span className="text-gray-600">License Number:</span> {driver.licenseNumber}</p>
                <p>
                  <span className="text-gray-600">License Expiry:</span> {' '}
                  {new Date(driver.licenseExpiry).toLocaleDateString()}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Performance</h3>
                <p><span className="text-gray-600">Total Rides:</span> {driver.totalRides}</p>
                <p>
                  <span className="text-gray-600">Average Rating:</span> {' '}
                  {driver.ratings ? driver.ratings.toFixed(1) + ' / 5.0' : 'No ratings yet'}
                </p>
                <p>
                  <span className="text-gray-600">Documents Verified:</span> {' '}
                  <span className={driver.documentsVerified ? 'text-green-500' : 'text-red-500'}>
                    {driver.documentsVerified ? 'Yes' : 'No'}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6 transition-transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500">Total Rides</p>
                  <h3 className="text-2xl font-bold">{bookingHistory ? bookingHistory.length : 0}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <FaCarAlt className="text-blue-500 text-xl" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 transition-transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500">This Month</p>
                  <h3 className="text-2xl font-bold">{getBookingsThisMonth()}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <FaRoute className="text-green-500 text-xl" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 transition-transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500">This Week</p>
                  <h3 className="text-2xl font-bold">{getBookingsThisWeek()}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <FaCalendarAlt className="text-yellow-500 text-xl" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 transition-transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500">Rating</p>
                  <h3 className="text-2xl font-bold">{driver?.ratings ? driver.ratings.toFixed(1) : '2.0'}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <FaUserCheck className="text-purple-500 text-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Revenue Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500 transition-transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500">Total Earnings</p>
                  <h3 className="text-2xl font-bold">₹{calculateTotalEarnings()}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <FaMoneyBillWave className="text-green-500 text-xl" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 transition-transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500">Weekly Earnings</p>
                  <h3 className="text-2xl font-bold">₹{calculateWeeklyEarnings()}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <FaChartLine className="text-blue-500 text-xl" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500 transition-transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500">Monthly Earnings</p>
                  <h3 className="text-2xl font-bold">₹{calculateMonthlyEarnings()}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <FaWallet className="text-indigo-500 text-xl" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500 transition-transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500">Pending</p>
                  <h3 className="text-2xl font-bold">₹{calculatePendingPayments()}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <FaMoneyBillWave className="text-yellow-500 text-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Show current assignment if received via socket */}
        {currentAssignment && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-green-500">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-green-600">New Ride Assignment!</h2>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Just Assigned
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Pickup Location</h3>
                <div className="flex items-start">
                  <FaMapMarkerAlt className="text-red-500 mt-1 mr-2" />
                  <p>{currentAssignment.booking.pickupLocation?.name || 'Location details not available'}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Drop Location</h3>
                <div className="flex items-start">
                  <FaMapMarkerAlt className="text-blue-500 mt-1 mr-2" />
                  <p>{currentAssignment.booking.dropLocation?.name || 'Location details not available'}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Passenger</h3>
                <div className="flex items-start">
                  <FaUser className="text-gray-500 mt-1 mr-2" />
                  <p>{currentAssignment.booking.user?.name || 'Customer'}</p>
                </div>
                {currentAssignment.booking.user?.phone && (
                  <p className="text-sm text-gray-500 ml-6">{currentAssignment.booking.user.phone}</p>
                )}
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Vehicle Type</h3>
                <div className="flex items-start">
                  <FaCarAlt className="text-gray-500 mt-1 mr-2" />
                  <p>{currentAssignment.booking.cabType?.name || 'Standard'}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => navigate('/driver/current-ride')} 
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
              >
                View Details
              </button>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          {bookingHistory && bookingHistory.length > 0 ? (
            <div className="space-y-4">
              {bookingHistory.slice(0, 3).map((booking, index) => {
                // Get the appropriate icon and style based on booking status
                let icon, iconClass, borderClass, title, subtitle;
                if (booking.status === 'completed') {
                  icon = <FaRoute className="text-blue-600" />;
                  iconClass = 'bg-blue-100';
                  borderClass = 'border-blue-500';
                  title = 'Trip Completed';
                  subtitle = `${booking.pickupLocation?.name || 'Pickup'} to ${booking.dropLocation?.name || 'Destination'}`;
                } else if (booking.status === 'cancelled') {
                  icon = <FaUser className="text-red-600" />;
                  iconClass = 'bg-red-100';
                  borderClass = 'border-red-500';
                  title = 'Booking Cancelled';
                  subtitle = `${booking.pickupLocation?.name || 'Pickup'} to ${booking.dropLocation?.name || 'Destination'}`;
                } else if (booking.status === 'confirmed' || booking.status === 'assigned') {
                  icon = <FaUserCheck className="text-green-600" />;
                  iconClass = 'bg-green-100';
                  borderClass = 'border-green-500';
                  title = 'New Booking';
                  subtitle = `${booking.pickupLocation?.name || 'Pickup'} to ${booking.dropLocation?.name || 'Destination'}`;
                } else {
                  icon = <FaMoneyBillWave className="text-purple-600" />;
                  iconClass = 'bg-purple-100';
                  borderClass = 'border-purple-500';
                  title = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
                  subtitle = `${booking.pickupLocation?.name || 'Pickup'} to ${booking.dropLocation?.name || 'Destination'}`;
                }
                
                // Format the date
                const date = new Date(booking.createdAt);
                const formattedDate = new Intl.DateTimeFormat('en-US', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                }).format(date);
                
                return (
                  <div key={index} className={`flex items-start p-3 border-l-4 ${borderClass} bg-gray-50 rounded`}>
                    <div className={`${iconClass} p-2 rounded-full mr-3`}>
                      {icon}
                    </div>
                    <div>
                      <p className="font-medium">{title}</p>
                      <p className="text-sm text-gray-600">{subtitle}</p>
                      <p className="text-xs text-gray-500">{formattedDate}</p>
                      {booking.fare && (
                        <p className="text-sm font-medium text-green-600 mt-1">₹{booking.fare}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">No recent activities found</p>
            </div>
          )}
        </div>
      </div>)}
    </DriverLayout>
  );
};

export default DriverDashboard;
