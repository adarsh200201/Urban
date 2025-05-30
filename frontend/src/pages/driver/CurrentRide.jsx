import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { FaMapMarkerAlt, FaPhoneAlt, FaRupeeSign, FaCarAlt, FaClock, FaPlay, FaCheck, FaStar } from 'react-icons/fa';
import DriverLayout from '../../layouts/DriverLayout';
import { getCurrentBooking, startTrip, completeTrip, reset } from '../../features/driver/driverSlice';
import RatingModal from '../../components/shared/RatingModal';
import socketService from '../../utils/socketService';
import ratingService from '../../services/ratingService';
import axios from 'axios';

const CurrentRide = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { driver: driverAuth } = useSelector((state) => state.driverAuth);
  const { driver, currentBooking, loading, error, success, message } = useSelector((state) => state.driver);
  const [locationUpdateInterval, setLocationUpdateInterval] = useState(null);
  const [mapUrl, setMapUrl] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [completedBooking, setCompletedBooking] = useState(null);
  const [realTimeStatus, setRealTimeStatus] = useState('');
  
  // API URL for backend calls
  // Import API URL from config
  const { API_URL } = require('../../config/apiConfig');

  // Initialize socket connection - only once when component mounts
  useEffect(() => {
    let isActive = true;
    
    if (driver && driver._id) {
      // Connect to socket only once
      socketService.connect();
      
      // Log to debug
      console.log('Socket initialized in CurrentRide component');
      
      // Join driver's room
      socketService.joinDriverRoom(driver._id);
    }
    
    // Cleanup function
    return () => {
      isActive = false;
      
      // Only cleanup location interval here, don't disconnect socket
      if (locationUpdateInterval) {
        clearInterval(locationUpdateInterval);
      }
      
      console.log('CurrentRide component unmounting, clearing intervals');
    };
    // Empty dependency array ensures this only runs once when component mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Load current booking data and set up socket event listeners separately
  useEffect(() => {
    if (driver && driver._id) {
      // Fetch current booking data
      dispatch(getCurrentBooking(driver._id));
      
      // Set up event listeners for socket events
      const bookingStatusListener = (data) => {
        if (currentBooking && (data.bookingId === currentBooking.bookingId || data._id === currentBooking._id)) {
          toast.info(`Booking status updated to: ${data.status}`);
          setRealTimeStatus(data.status);
          dispatch(getCurrentBooking(driver._id)); // Refresh booking data
        }
      };
      
      const rideCompletedListener = (data) => {
        if (currentBooking && (data.bookingId === currentBooking.bookingId || data._id === currentBooking._id)) {
          toast.success('Ride completed successfully!');
          setCompletedBooking(data);
          setShowRatingModal(true);
          dispatch(getCurrentBooking(driver._id)); // Refresh booking data
        }
      };
      
      const rideCancelledListener = (data) => {
        if (currentBooking && (data.bookingId === currentBooking.bookingId || data._id === currentBooking._id)) {
          toast.info('This ride has been cancelled by the user');
          dispatch(getCurrentBooking(driver._id)); // Refresh booking data
        }
      };
      
      // Add event listeners
      socketService.onBookingStatusChanged(bookingStatusListener);
      socketService.onRideCompleted(rideCompletedListener);
      socketService.onRideCancelled(rideCancelledListener);
      
      // Cleanup function to remove the specific listeners we added
      return () => {
        // We'll handle socket disconnection in a separate useEffect
        // Just clean up state here
        dispatch(reset());
      };
    }
  }, [dispatch, driver]);
  
  // Handle component unmount - only clean up event listeners, not the socket connection
  useEffect(() => {
    return () => {
      console.log('CurrentRide component fully unmounting, cleaning up resources');
      // We no longer disconnect the socket here - it's handled at the App level
      // Just clean up any intervals or timers
    };
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(reset());
    }

    if (success) {
      toast.success(message);
      dispatch(reset());
    }
  }, [error, success, message, dispatch]);

  useEffect(() => {
    if (currentBooking) {
      // Create Google Maps URL for directions
      const pickupAddress = encodeURIComponent(currentBooking.pickupAddress);
      const dropAddress = encodeURIComponent(currentBooking.dropAddress);
      setMapUrl(`https://www.google.com/maps/dir/?api=1&origin=${pickupAddress}&destination=${dropAddress}&travelmode=driving`);
    }
  }, [currentBooking]);

  const handleStartTrip = () => {
    if (currentBooking && driver) {
      dispatch(startTrip({
        driverId: driver._id,
        bookingId: currentBooking._id
      }));
    }
  };

  const handleCompleteTrip = () => {
    if (currentBooking && driver) {
      dispatch(completeTrip({
        driverId: driver._id,
        bookingId: currentBooking._id
      }));
      
      // Store the completed booking data for the rating modal
      setCompletedBooking(currentBooking);
      
      // Show rating modal after a short delay to ensure the ride is marked as completed
      setTimeout(() => {
        setShowRatingModal(true);
        toast.info('Please rate your passenger to complete the trip');
      }, 1000);
    }
  };
  
  // Handle submission of passenger rating
  const handleSubmitRating = async (ratingData) => {
    try {
      setIsSubmittingRating(true);
      
      // Using driverAuth from component scope (already fetched with useSelector at the top level)
      if (!driverAuth || !driverAuth.token) {
        toast.error('You must be logged in as a driver to submit a rating');
        return;
      }
      
      if (!completedBooking || !completedBooking.user) {
        toast.error('No passenger information available to rate');
        return;
      }
      
      // Get user ID - handling both object references and string IDs
      const userId = typeof completedBooking.user === 'object' ? 
        completedBooking.user._id : completedBooking.user;
      
      console.log('Submitting rating as driver:', {
        bookingId: completedBooking._id,
        userId,
        rating: ratingData.rating
      });
      
      // Use the rating service to submit the driver's rating for the user
      const response = await ratingService.submitDriverRating(
        completedBooking._id,
        userId,
        ratingData.rating,
        ratingData.comment,
        driverAuth.token
      );
      
      if (response.success) {
        toast.success('Thank you for rating your passenger!');
        setShowRatingModal(false);
      } else {
        toast.error(response.message || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error(error.response?.data?.message || 'Failed to submit rating');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  if (loading && !currentBooking) {
    return (
      <DriverLayout>
        <div className="flex justify-center items-center h-96 page-container">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        </div>
      </DriverLayout>
    );
  }

  return (
    <DriverLayout>
      <div className="container mx-auto px-4 py-6 page-container">
        <h1 className="text-2xl font-bold mb-6 mt-2">Current Ride</h1>
        
        {currentBooking ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden card-hover">
            <div className="bg-primary text-white p-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Booking #{currentBooking.bookingId}</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${                  
                  (realTimeStatus || currentBooking.status) === 'assigned' ? 'bg-yellow-500' : 
                  (realTimeStatus || currentBooking.status) === 'inProgress' ? 'bg-blue-500' : 
                  (realTimeStatus || currentBooking.status) === 'completed' ? 'bg-green-500' :
                  (realTimeStatus || currentBooking.status) === 'cancelled' ? 'bg-red-500' :
                  'bg-gray-500'
                }`}>
                  {(realTimeStatus || currentBooking.status) === 'assigned' ? 'Assigned' : 
                   (realTimeStatus || currentBooking.status) === 'inProgress' ? 'In Progress' : 
                   (realTimeStatus || currentBooking.status) === 'completed' ? 'Completed' :
                   (realTimeStatus || currentBooking.status) === 'cancelled' ? 'Cancelled' :
                   currentBooking.status}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 responsive-grid">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Trip Details</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="mt-1 flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <FaMapMarkerAlt className="text-green-500" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-500">Pickup Location</p>
                        <p className="font-medium">{currentBooking.pickupLocation?.name || 'Unknown'}</p>
                        <p className="text-sm">{currentBooking.pickupAddress}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="mt-1 flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                          <FaMapMarkerAlt className="text-red-500" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-500">Drop Location</p>
                        <p className="font-medium">{currentBooking.dropLocation?.name || 'Unknown'}</p>
                        <p className="text-sm">{currentBooking.dropAddress}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="mt-1 flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <FaClock className="text-blue-500" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-500">Pickup Date & Time</p>
                        <p className="font-medium">
                          {new Date(currentBooking.pickupDate).toLocaleDateString()} at {currentBooking.pickupTime}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="mt-1 flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <FaCarAlt className="text-purple-500" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-500">Cab Type</p>
                        <p className="font-medium">{currentBooking.cabType?.name || 'Standard'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="mt-1 flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                          <FaRupeeSign className="text-yellow-500" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-500">Trip Fare</p>
                        <p className="font-medium">₹{currentBooking.totalAmount?.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Passenger Information</h3>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium">
                        {currentBooking.passengerDetails?.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium">{currentBooking.passengerDetails?.name}</p>
                        <p className="text-sm text-gray-600">{currentBooking.journeyType === 'oneWay' ? 'One Way' : 'Round Trip'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center mt-4">
                      <FaPhoneAlt className="text-gray-500" />
                      <a 
                        href={`tel:${currentBooking.passengerDetails?.phone}`} 
                        className="ml-2 text-primary hover:underline"
                      >
                        {currentBooking.passengerDetails?.phone}
                      </a>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <a 
                      href={mapUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full block text-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition duration-200"
                    >
                      Open Navigation
                    </a>
                  </div>
                  
                  <div className="flex flex-col space-y-4 mt-4">
                    {((realTimeStatus || currentBooking.status) === 'assigned') && (
                      <button
                        onClick={handleStartTrip}
                        className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg flex items-center justify-center transition duration-200 btn-animated"
                      >
                        <FaPlay className="mr-2" />
                        Start Trip
                      </button>
                    )}
                    
                    {((realTimeStatus || currentBooking.status) === 'inProgress') && (
                      <button
                        onClick={handleCompleteTrip}
                        className="bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg flex items-center justify-center transition duration-200 btn-animated"
                      >
                        <FaCheck className="mr-2" />
                        Complete Trip
                      </button>
                    )}
                    
                    {((realTimeStatus || currentBooking.status) === 'completed') && !currentBooking.driverRating && (
                      <button
                        onClick={() => setShowRatingModal(true)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white py-3 px-4 rounded-lg flex items-center justify-center transition duration-200 btn-animated"
                      >
                        <FaStar className="mr-2" />
                        Rate Passenger
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {currentBooking.additionalNotes && (
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Additional Notes</h4>
                  <p className="text-yellow-700">{currentBooking.additionalNotes}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FaCarAlt className="text-gray-400 text-3xl" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No Active Ride</h2>
            <p className="text-gray-600 mb-4">You don't have any active ride at the moment.</p>
            <p className="text-gray-500">Please check back later or contact admin for assignment.</p>
          </div>
        )}
        
        {/* Rating Modal */}
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          onSubmit={handleSubmitRating}
          recipientName={completedBooking?.passengerDetails?.name || 'Passenger'}
          recipientType="user"
          bookingId={completedBooking?._id}
        />
      </div>
    </DriverLayout>
  );
};

export default CurrentRide;
