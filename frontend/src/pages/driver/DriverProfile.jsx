import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { FaUser, FaCar, FaIdCard, FaPhoneAlt, FaEnvelope, FaCalendarAlt, FaStar, FaRoute } from 'react-icons/fa';
import DriverLayout from '../../layouts/DriverLayout';
import { getDriverProfile, getBookingHistory, reset } from '../../features/driver/driverSlice';

const DriverProfile = () => {
  const dispatch = useDispatch();
  const { driver: driverAuth } = useSelector((state) => state.driverAuth);
  const { driver, bookingHistory, loading, error } = useSelector((state) => state.driver);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyRequested, setHistoryRequested] = useState(false);

  useEffect(() => {
    // First check if we already have driver profile data
    if (driver && driver._id) {
      // Profile already loaded
      setLoadingProfile(false);
    } else {
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
          // Load the driver profile
          dispatch(getDriverProfile(driverId));
        } else {
          toast.error('Unable to load driver profile. Please try logging in again.');
          setLoadingProfile(false);
        }
      } else {
        setLoadingProfile(false);
      }
    }

    return () => {
      dispatch(reset());
    };
  }, [dispatch, driverAuth, driver]);

  // Load booking history when driver profile is loaded
  useEffect(() => {
    if (driver && driver._id && !historyRequested) {
      dispatch(getBookingHistory(driver._id));
      setHistoryRequested(true);
    }
    
    if (bookingHistory) {
      setLoadingHistory(false);
    }
  }, [dispatch, driver, historyRequested, bookingHistory]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(reset());
      setLoadingProfile(false);
    }
    
    // Set loading to false when we get the driver profile
    if (driver && driver._id) {
      setLoadingProfile(false);
    }
  }, [error, dispatch, driver]);

  if (loadingProfile || loading) {
    return (
      <DriverLayout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
          <div className="ml-4 text-gray-700 font-medium">Loading driver profile...</div>
        </div>
      </DriverLayout>
    );
  }

  if (!driver) {
    return (
      <DriverLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Profile Not Found</h2>
          <p className="text-gray-600">Please log in to view your profile</p>
        </div>
      </DriverLayout>
    );
  }

  // Get driver name - handle different possible structures
  const getDriverName = () => {
    if (driver && driver.name) return driver.name;
    if (driverAuth && driverAuth.name) return driverAuth.name;
    if (driverAuth && driverAuth.driver && driverAuth.driver.name) return driverAuth.driver.name;
    return 'Driver';
  };

  // Calculate joining date
  const joiningDate = driver && driver.createdAt ? new Date(driver.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Not available';

  // Calculate experience (months since joining)
  const calculateExperience = () => {
    if (!driver || !driver.createdAt) return 0;
    const joinDate = new Date(driver.createdAt);
    const currentDate = new Date();
    const diffInMonths = (currentDate.getFullYear() - joinDate.getFullYear()) * 12 + 
                         (currentDate.getMonth() - joinDate.getMonth());
    return diffInMonths;
  };
  
  const experience = calculateExperience();
  
  // Get driver availability status
  const isAvailable = driver && driver.isAvailable ? true : false;
  
  // Get driver rating
  const driverRating = driver && driver.ratings ? driver.ratings.toFixed(1) : '2.0';
  
  // Calculate total earnings from bookings
  const calculateTotalEarnings = () => {
    if (!bookingHistory || bookingHistory.length === 0) return 0;
    return bookingHistory.reduce((total, booking) => {
      if (booking.status === 'completed' && booking.fare) {
        return total + Number(booking.fare);
      }
      return total;
    }, 0);
  };
  
  const totalEarnings = calculateTotalEarnings();
  
  // Calculate completed trips count
  const completedTrips = bookingHistory ? bookingHistory.filter(booking => booking.status === 'completed').length : 0;

  return (
    <DriverLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header/Banner */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-40 md:h-56 relative">
            <div className="absolute bottom-0 left-0 w-full transform translate-y-1/2 px-6 flex justify-between items-end">
              <div className="flex items-end">
                <div className="bg-white p-1 rounded-full h-24 w-24 md:h-32 md:w-32 shadow-lg">
                  <div className="bg-gradient-to-r from-blue-400 to-indigo-500 h-full w-full rounded-full flex items-center justify-center">
                    <span className="text-3xl md:text-4xl font-bold text-white">{getDriverName().charAt(0).toUpperCase()}</span>
                  </div>
                </div>
                <div className="ml-4 mb-4 md:mb-6">
                  <h1 className="text-xl md:text-3xl font-bold text-white">{getDriverName()}</h1>
                  <div className="flex items-center">
                    <div className="bg-green-500 h-3 w-3 rounded-full mr-2"></div>
                    <span className="text-white text-sm md:text-base font-bold bg-green-600 px-2 py-0.5 rounded-md">
                      {isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center mb-6">
                <div className="bg-indigo-700 px-4 py-2 rounded-lg flex items-center mb-2 md:mb-0 md:mr-3 shadow-md">
                  <div className="flex items-center mr-4">
                    <FaStar className="text-yellow-400 mr-1 text-xl" />
                    <span className="text-white font-bold text-lg">{driverRating}</span>
                  </div>
                  <div className="text-white font-medium">
                    <span className="font-bold">{experience}</span> months experience
                  </div>
                </div>
                
                <div className="flex items-center bg-indigo-700 px-4 py-2 rounded-lg shadow-md">
                  <FaRoute className="text-yellow-400 mr-1 text-xl" />
                  <span className="text-white font-bold text-lg">{completedTrips}</span>
                  <span className="text-white ml-1 font-medium">rides completed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Body */}
          <div className="pt-16 md:pt-20 px-6 pb-8">
            {/* Total Earnings Card */}
            <div className="mb-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl p-6 shadow-lg text-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-2">Total Earnings</h2>
                  <p className="text-white/80 text-sm">Your lifetime earnings with UrbanRide</p>
                </div>
                <div className="mt-4 md:mt-0">
                  <p className="text-4xl font-bold">₹{totalEarnings}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-white/90 text-sm">From {completedTrips} completed trips</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Personal Information */}
              <div className="bg-gray-50 rounded-xl p-6 shadow">
                <h2 className="text-xl font-bold text-gray-800 border-b pb-3 mb-4">Personal Information</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <FaUser className="text-blue-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium">{driver.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FaEnvelope className="text-blue-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{driver.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FaPhoneAlt className="text-blue-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{driver.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FaCalendarAlt className="text-blue-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Joined On</p>
                      <p className="font-medium">{joiningDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="bg-gray-50 rounded-xl p-6 shadow">
                <h2 className="text-xl font-bold text-gray-800 border-b pb-3 mb-4">Vehicle Information</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <FaCar className="text-blue-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Vehicle Model</p>
                      <p className="font-medium">{driver.vehicleModel}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FaCar className="text-blue-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Vehicle Type</p>
                      <p className="font-medium">{typeof driver.vehicleType === 'object' ? driver.vehicleType.name : (driver.vehicleType || 'Sedan')}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FaCar className="text-blue-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Vehicle Number</p>
                      <p className="font-medium">{driver.vehicleNumber ? driver.vehicleNumber.split('-')[0] : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* License Information */}
              <div className="bg-gray-50 rounded-xl p-6 shadow">
                <h2 className="text-xl font-bold text-gray-800 border-b pb-3 mb-4">License Information</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <FaIdCard className="text-blue-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">License Number</p>
                      <p className="font-medium">{driver.licenseNumber ? driver.licenseNumber.split('-')[0] : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FaCalendarAlt className="text-blue-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">License Expiry</p>
                      <p className="font-medium">
                        {driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats/Performance */}
              <div className="bg-gray-50 rounded-xl p-6 shadow">
                <h2 className="text-xl font-bold text-gray-800 border-b pb-3 mb-4">Performance</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Rating</p>
                    <div className="flex items-center mt-1">
                      <span className="text-2xl font-bold mr-2">{driverRating}</span>
                      <FaStar className="text-yellow-400 text-xl" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Trips Completed</p>
                    <p className="text-2xl font-bold">{completedTrips}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Acceptance Rate</p>
                    <p className="text-2xl font-bold">{driver.acceptanceRate || '95'}%</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Experience</p>
                    <p className="text-2xl font-bold">{experience} <span className="text-sm font-normal">months</span></p>
                  </div>
                </div>
              </div>

              {/* Earnings Information */}
              <div className="bg-gray-50 rounded-xl p-6 shadow">
                <h2 className="text-xl font-bold text-gray-800 border-b pb-3 mb-4">Earnings</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                      <FaStar className="text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Earnings</p>
                      <p className="text-xl font-bold">₹{totalEarnings}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <FaRoute className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Average Per Trip</p>
                      <p className="text-xl font-bold">₹{completedTrips > 0 ? Math.round(totalEarnings/completedTrips) : 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DriverLayout>
  );
};

export default DriverProfile;
