import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { FaMapMarkerAlt, FaRegCalendarAlt, FaCar, FaMoneyBillWave, FaUserAlt, FaPhoneAlt, FaRegTimesCircle } from 'react-icons/fa';

// Import shared components and services
import CancellationModal from '../components/shared/CancellationModal';
import RatingModal from '../components/shared/RatingModal';
import refundService from '../services/refundService';
import ratingService from '../services/ratingService';
import socketService from '../utils/socketService';

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const [rawBookingData, setRawBookingData] = useState(null);
  
  // Extract query parameters for fallback data
  const queryParams = new URLSearchParams(window.location.search);
  const fromParam = queryParams.get('from');
  const toParam = queryParams.get('to');
  const paymentStatusParam = queryParams.get('paymentStatus');
  const cabNameParam = queryParams.get('cabName');
  const amountParam = queryParams.get('amount');
  const dateParam = queryParams.get('date');
  const timeParam = queryParams.get('time');
  const distanceParam = queryParams.get('distance');
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  
  // Get authentication state
  const { user: userInfo } = useSelector((state) => state.auth);
  
  // API URL
  // Import API URL from config
  const { API_URL } = require('../config/apiConfig');
  
  // Initialize socket connection for real-time updates
  useEffect(() => {
    if (userInfo) {
      // Connect to socket server
      socketService.connect();
      
      // Join user room to receive updates
      socketService.joinUserRoom(userInfo.id);
      
      // Listen for ride completion events
      socketService.onRideCompleted((data) => {
        if (booking && (data.bookingId === booking.id || data._id === id)) {
          toast.success('Your ride has been completed!');
          fetchBookingDetails(); // Refresh booking data
          
          // Show rating modal automatically
          setShowRatingModal(true);
        }
      });
      
      // Listen for rating submission events
      socketService.onRatingSubmitted((data) => {
        if (booking && (data.bookingId === booking.id || data._id === id)) {
          toast.info('A new rating has been submitted for your ride');
          fetchBookingDetails(); // Refresh booking data
        }
      });
    }
    
    return () => {
      // Disconnect socket when component unmounts
      socketService.disconnect();
    };
  }, [userInfo, id, booking]);
  
  // Define fetchBookingDetails function outside useEffect to make it accessible throughout the component
  const fetchBookingDetails = async () => {
    if (!id) {
      setError('No booking ID provided');
      setIsLoading(false);
      return;
    }
    
    try {
      // Check if the ID is a booking ID (starts with CB) or a MongoDB ID
      let endpoint;
      if (id.startsWith('CB')) {
        endpoint = `${API_URL}/booking/track/${id}`;
      } else {
        endpoint = `${API_URL}/booking/${id}`;
      }
      
      // Set up headers with auth token if available
      const config = {};
      
      // Check if user is logged in and has a valid token
      if (userInfo && userInfo.token) {
        config.headers = {
          Authorization: `Bearer ${userInfo.token}`
        };
      } else {
        console.log('No authentication token available - retrieving user from localStorage');
        // Try to get token from localStorage as fallback
        const localUser = JSON.parse(localStorage.getItem('user'));
        if (localUser && localUser.token) {
          config.headers = {
            Authorization: `Bearer ${localUser.token}`
          };
        } else {
          // If this is not a public booking tracking route, show appropriate message
          if (!id.startsWith('CB')) {
            setError('Authentication required to view booking details');
            setIsLoading(false);
            toast.error('Please log in to view this booking');
            navigate('/login', { state: { from: `/booking/${id}` } });
            return;
          }
          // For tracking IDs (CB prefixed), we'll try without authentication
        }
      }
      
      const response = await axios.get(endpoint, config);
      
      if (response.data.success) {
        const bookingData = response.data.data;
        
        // Get pickup and drop city names with state information
        let pickupCity = 'Unknown';
        let dropCity = 'Unknown';
        
        if (bookingData.pickupLocation && typeof bookingData.pickupLocation === 'object') {
          pickupCity = bookingData.pickupLocation.name || 'Unknown';
          // Add state information if available
          if (bookingData.pickupLocation.state) {
            pickupCity += `, ${bookingData.pickupLocation.state}`;
          }
        }
        
        if (bookingData.dropLocation && typeof bookingData.dropLocation === 'object') {
          dropCity = bookingData.dropLocation.name || 'Unknown';
          // Add state information if available
          if (bookingData.dropLocation.state) {
            dropCity += `, ${bookingData.dropLocation.state}`;
          }
        }
        
        // Get cab type name
        let cabTypeName = 'Standard Cab';
        if (bookingData.cabType && typeof bookingData.cabType === 'object') {
          cabTypeName = bookingData.cabType.name || 'Standard Cab';
        }
        
        // Process driver information
        let driverName = 'To be assigned';
        let driverContact = 'To be provided';
        let driverVehicle = '';
        let driverLicense = '';
        
        // Display driver information if a driver exists, regardless of booking status
        if (bookingData.driver) {
          // Check if driver is a populated object with data
          if (typeof bookingData.driver === 'object' && bookingData.driver !== null) {
            console.log('Driver data:', bookingData.driver);
            
            // Format the driver name - handle both formats (name or firstName/lastName)
            if (bookingData.driver.name) {
              driverName = bookingData.driver.name;
            } else if (bookingData.driver.firstName || bookingData.driver.lastName) {
              driverName = `${bookingData.driver.firstName || ''} ${bookingData.driver.lastName || ''}`.trim();
            } else {
              driverName = 'Driver'; // Fallback name
            }
            
            // Get contact information
            driverContact = bookingData.driver.phone || 'Not provided';
            
            // Get vehicle details directly from driver object
            // First check for direct vehicle properties
            if (bookingData.driver.vehicleModel || bookingData.driver.vehicleNumber) {
              const model = bookingData.driver.vehicleModel || '';
              const regNum = bookingData.driver.vehicleNumber || 'Unknown';
              driverVehicle = `${model} (${regNum})`.trim();
              if (driverVehicle === '()') driverVehicle = 'Vehicle details not available';
            } 
            // Fall back to vehicleDetails if available
            else if (bookingData.driver.vehicleDetails) {
              const make = bookingData.driver.vehicleDetails.make || '';
              const model = bookingData.driver.vehicleDetails.model || '';
              const regNum = bookingData.driver.vehicleDetails.registrationNumber || 'Unknown';
              driverVehicle = `${make} ${model} (${regNum})`.trim();
              if (driverVehicle === '()') driverVehicle = 'Vehicle details not available';
            } else {
              driverVehicle = 'Vehicle details not available';
            }
            
            // Get license number
            driverLicense = bookingData.driver.licenseNumber || 'Not provided';
            
            // Store driver info separately for potential additional use
            setDriverInfo(bookingData.driver);
          } else if (typeof bookingData.driver === 'string' && bookingData.driver) {
            // If driver is just a string ID, note this in the UI
            console.log('Driver ID (not populated):', bookingData.driver);
            driverName = 'Driver assigned but details unavailable';
            driverContact = 'Contact information unavailable';
          }
        }
        
        // Store raw booking data for later use with modals
        setRawBookingData(bookingData);
        
        // Format the booking data for display with fallbacks to query parameters
        setBooking({
          id: bookingData.bookingId || id,
          // Use query parameters as fallback for date/time information
          date: new Date(bookingData.pickupDate || dateParam || new Date()).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          time: bookingData.pickupTime || timeParam || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          // Use query parameters as fallback for location information
          from: pickupCity !== 'Unknown' ? pickupCity : (fromParam || 'Unknown'),
          to: dropCity !== 'Unknown' ? dropCity : (toParam || 'Unknown'),
          // Use query parameters as fallback for cab type
          cabType: cabTypeName !== 'Standard Cab' ? cabTypeName : (cabNameParam || 'Standard Cab'),
          // Use query parameters as fallback for price
          price: `₹${bookingData.totalAmount || amountParam || 0}`,
          // Use query parameters as fallback for distance - ensure we always show real distance
          distance: `${bookingData.distance || distanceParam || 0} km`,
          // Only include duration if it's actually specified
          ...(bookingData.duration ? { duration: `${bookingData.duration} hours` } : {}),
          status: bookingData.status || 'Pending',
          driverName: driverName,
          driverContact: driverContact,
          driverVehicle: driverVehicle,
          driverLicense: driverLicense,
          // Use query parameter as fallback for payment status
          paymentStatus: bookingData.paymentStatus ? 
            bookingData.paymentStatus.charAt(0).toUpperCase() + bookingData.paymentStatus.slice(1) : 
            (paymentStatusParam ? paymentStatusParam.charAt(0).toUpperCase() + paymentStatusParam.slice(1) : 'Pending'),
          // Flag to show/hide rating button - check multiple rating fields
          canRate: bookingData.status === 'completed' && 
            (!bookingData.rated && !bookingData.userRating && 
            !(bookingData.ratings && bookingData.ratings.user)),
          // Flag to show/hide cancel button
          canCancel: ['pending', 'confirmed', 'assigned'].includes(bookingData.status)
        });
        
        setIsLoading(false);
      } else {
        setError(response.data.message || 'Failed to fetch booking details');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      setError('Error fetching booking details: ' + (error.response?.data?.message || error.message));
      setIsLoading(false);
    }
  };

  // Use an effect to fetch booking details and set up socket listeners
  useEffect(() => {
    // Call the fetchBookingDetails function
    fetchBookingDetails();
    
    // Initialize socket connection for real-time updates
    if (userInfo && userInfo.id) {
      socketService.connect();
      socketService.joinUserRoom(userInfo.id);
      
      // Listen for booking update events
      socketService.listenForBookingUpdates((updatedBooking) => {
        console.log('Received booking update:', updatedBooking);
        if (updatedBooking._id === id || updatedBooking.bookingId === id) {
          toast.info('Booking information has been updated');
          fetchBookingDetails(); // Refresh the booking data
        }
      });
      
      // Listen for driver location updates
      socketService.listenForDriverLocationUpdates((location) => {
        console.log('Received driver location update:', location);
        // You could update a map component here if implemented
      });
      
      // Listen for payment/refund events
      socketService.listenForPaymentUpdates((paymentUpdate) => {
        console.log('Received payment update:', paymentUpdate);
        if (paymentUpdate.bookingId === id || (rawBookingData && paymentUpdate.bookingId === rawBookingData._id)) {
          toast.success('Refund has been processed for this booking');
          fetchBookingDetails(); // Refresh the booking data
        }
      });
      
      // Clean up socket listeners when component unmounts
      return () => {
        socketService.disconnect();
      };
    }
  }, [id, userInfo]); // Re-run effect when id or userInfo changes
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4"><FaRegTimesCircle /></div>
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => navigate(-1)} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Handle booking cancellation
  const handleCancelBooking = async (cancelData) => {
    try {
      setIsCancelling(true);
      
      if (!userInfo || !userInfo.token) {
        toast.error('You must be logged in to cancel a booking');
        return;
      }
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`
        }
      };
      
      const response = await axios.put(
        `${API_URL}/booking/${rawBookingData._id}/cancel`,
        {
          reason: cancelData.reason,
          isRefundEligible: cancelData.isRefundEligible
        },
        config
      );
      
      if (response.data.success) {
        toast.success('Booking cancelled successfully');
        fetchBookingDetails(); // Refresh booking data
      } else {
        toast.error(response.data.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setIsCancelling(false);
      setShowCancellationModal(false);
    }
  };
  
  // Handle rating submission
  const handleSubmitRating = async (ratingData) => {
    try {
      setIsSubmittingRating(true);
      
      if (!userInfo || !userInfo.token) {
        toast.error('You must be logged in to submit a rating');
        return;
      }
      
      if (!rawBookingData || !rawBookingData.driver) {
        toast.error('No driver information available to rate');
        return;
      }
      
      const response = await ratingService.submitUserRating(
        rawBookingData._id,
        rawBookingData.driver._id || rawBookingData.driver,
        ratingData.rating,
        ratingData.comment,
        userInfo.token
      );
      
      if (response.success) {
        toast.success('Rating submitted successfully');
        fetchBookingDetails(); // Refresh booking data
      } else {
        toast.error(response.message || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error(error.response?.data?.message || 'Failed to submit rating');
    } finally {
      setIsSubmittingRating(false);
      setShowRatingModal(false);
    }
  };
  
  // Determine status color for badge
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-indigo-100 text-indigo-800';
      case 'inprogress':
      case 'in progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Booking Details</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="border-b pb-4 mb-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Booking #{booking.id}</h2>
            <span className={`px-3 py-1 rounded font-medium ${getStatusColor(booking.status)}`}>
              {booking.status}
            </span>
          </div>
          <p className="text-gray-600">Booked for {booking.date}, {booking.time}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Trip Details</h3>
            <div className="space-y-2">
              <p><span className="font-medium">From:</span> {booking.from}</p>
              <p><span className="font-medium">To:</span> {booking.to}</p>
              <p><span className="font-medium">Distance:</span> {booking.distance}</p>
              <p><span className="font-medium">Duration:</span> {booking.duration}</p>
              <p><span className="font-medium">Cab Type:</span> {booking.cabType}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">Payment Details</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Total Fare:</span> {booking.price}</p>
              <p><span className="font-medium">Payment Status:</span> {booking.paymentStatus}</p>
            </div>
            
            <h3 className="text-lg font-medium mt-6 mb-3">Driver Details</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Name:</span> {booking.driverName}</p>
              <p><span className="font-medium">Contact:</span> {booking.driverContact}</p>
              {booking.driverVehicle && (
                <p><span className="font-medium">Vehicle:</span> {booking.driverVehicle}</p>
              )}
              {booking.driverLicense && (
                <p><span className="font-medium">License:</span> {booking.driverLicense}</p>
              )}
              {booking.status === 'assigned' && (
                <div className="mt-2 py-1 px-2 bg-green-100 text-green-800 rounded-md inline-block">
                  Driver assigned and ready
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t flex justify-end gap-2">
          {booking.status === 'completed' && (
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Download Invoice
            </button>
          )}
          
          {booking.canRate && (
            <button 
              onClick={() => setShowRatingModal(true)}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              Rate Driver
            </button>
          )}
          
          {booking.canCancel && (
            <button 
              onClick={() => setShowCancellationModal(true)}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              disabled={isCancelling}
            >
              {isCancelling ? 'Processing...' : 'Cancel Booking'}
            </button>
          )}
        </div>
        
        {/* Cancellation Modal */}
        <CancellationModal
          isOpen={showCancellationModal}
          onClose={() => setShowCancellationModal(false)}
          onConfirm={handleCancelBooking}
          booking={rawBookingData}
        />
        
        {/* Rating Modal */}
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          onSubmit={handleSubmitRating}
          recipientName={booking.driverName}
          recipientType="driver"
          bookingId={rawBookingData?._id}
        />
      </div>
    </div>
  );
};

export default BookingDetails;
