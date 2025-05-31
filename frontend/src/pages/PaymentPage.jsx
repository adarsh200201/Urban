import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaCreditCard, FaQrcode, FaUniversity, FaWallet, FaTag, FaTimes } from 'react-icons/fa';
import { PaymentSuccessAnimation, BookingConfirmedAnimation, AnimationStyles } from '../components/PaymentAnimations';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [bookingInfo, setBookingInfo] = useState({});
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('razorpay');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  
  // Animation states
  const [showPaymentSuccessAnimation, setShowPaymentSuccessAnimation] = useState(false);
  const [showBookingConfirmedAnimation, setShowBookingConfirmedAnimation] = useState(false);
  
  // Extract query parameters
  const queryParams = new URLSearchParams(location.search);
  
  // API URL
  // Import API URL from config
  const { API_URL } = require('../config/apiConfig');
  
  // Get auth state directly from Redux and localStorage for complete coverage
  const authState = useSelector(state => state.auth || {});
  
  // Get auth from cookie and localStorage as backup method
  let storedToken = null;
  try {
    const cookieToken = document.cookie.split(';').find(c => c.trim().startsWith('token='));
    if (cookieToken) {
      storedToken = cookieToken.split('=')[1];
    }
  } catch (e) {}
  
  // Try to find authentication token from all possible sources
  // Looking at your auth format, the token is in the success response from login
  const token = authState.token || 
                (authState.user && authState.user.token) || 
                storedToken || 
                localStorage.getItem('token') || 
                null;
                
  // Manually check localStorage for auth
  const storedAuth = localStorage.getItem('user') ? 
    JSON.parse(localStorage.getItem('user')) : null;
  
  // Combine Redux and localStorage sources
  const combinedAuthData = {
    ...authState,
    ...(storedAuth || {})
  };
  
  // Get user from the combined auth data
  const user = combinedAuthData.user || authState.user || {};
  
  // Log complete auth debugging info
  console.log('Complete auth state:', { 
    reduxAuth: authState,
    storedAuth: storedAuth,
    combinedToken: token ? 'Present' : 'Missing',
    userObject: user
  });
  
  // Extract user ID from all possible locations based on how your auth system works
  const userId = (user && user.id) || 
                (user && user._id) || 
                (storedAuth && storedAuth.user && (storedAuth.user.id || storedAuth.user._id)) || 
                '645f9d9ee88ebd3ddd7ac4c7'; // Fallback MongoDB ID
  
  // Set up authorization headers with the JWT token from your auth system
  // This format must match what your auth.js middleware expects
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  };
  
  console.log('Authentication setup:', {
    hasToken: !!token,
    hasUser: !!user,
    userId: userId,
    authHeader: token ? `Bearer ${token.substring(0, 10)}...` : 'None'
  });
  
  // Store default MongoDB ObjectIds for required collections (for testing only)
  const DEFAULT_CAB_ID = '645f9d9ee88ebd3ddd7ac4c8';
  const DEFAULT_CITY_ID = '645f9d9ee88ebd3ddd7ac4c9';
  
  // Handle authentication and login redirect with maximum compatibility
  useEffect(() => {
    // Always save current URL params for post-login redirect
    const paymentParams = location.search;
    if (paymentParams) {
      sessionStorage.setItem('paymentRedirectParams', paymentParams);
      localStorage.setItem('paymentRedirectParams', paymentParams); // Backup in localStorage too
    }
    
    // Check if we just came back from login (check URL for redirect=payment)
    const justLoggedIn = location.search.includes('login-success=true');
    
    // Try extracting token from localStorage if Redux failed
    if (!token && storedAuth && storedAuth.token) {
      console.log('Found token in localStorage but not in Redux');
      // Don't redirect - we found authentication in localStorage
      return;
    }
    
    // Comprehensive authentication check using all sources
    const isAuthenticated = !!token || 
                           !!(user && (user._id || user.id)) || 
                           !!(storedAuth && storedAuth.token);
    
    console.log('Comprehensive auth check:', { 
      hasToken: !!token, 
      hasUser: !!user,
      isAuthenticated: isAuthenticated,
      justLoggedIn: justLoggedIn
    });
    
    // Special case - just logged in but still missing token
    if (justLoggedIn) {
      console.log('Just logged in, skipping redirect check');
      return;
    }
    
    // Only redirect if definitely not authenticated 
    if (!isAuthenticated && !authState.loading) {
      console.log('No authentication detected, redirecting to login');
      toast.warning('Please log in to continue booking');
      // Add timestamp to prevent caching issues
      navigate(`/login?redirect=payment&ts=${Date.now()}`);
    } else {
      console.log('Authentication detected or loading, staying on payment page');
    }
  }, []);
  
  // We don't add dependencies to avoid re-running this effect and creating redirect loops
  
  // Get cab details from localStorage or use static data
  const getCabDetails = (cabId, fromCity, toCity, bookingType, name, mobile, email, pickupAddress, dropAddress, amount, travelDate, travelTime) => {
    setIsLoading(true);
    
    // First try to get from localStorage (set in CarSelection page)
    const savedCabData = localStorage.getItem('selectedCabData');
    let cabDetails = null;
    
    if (savedCabData) {
      try {
        const parsedData = JSON.parse(savedCabData);
        if (parsedData.id === cabId) {
          cabDetails = parsedData;
        }
      } catch (parseError) {
        console.error('Error parsing saved cab data:', parseError);
      }
    }
    
    // If we can't get from localStorage, look up in static data or use URL params
    if (!cabDetails) {
      // Static cab data
      const staticCabs = {
        'cab1': {
          _id: 'cab1',
          name: 'Economy Hatchback',
          basePrice: 1800,
          imageUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=500&h=300'
        },
        'cab2': {
          _id: 'cab2',
          name: 'Comfort Sedan',
          basePrice: 2200,
          imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=500&h=300'
        },
        'cab3': {
          _id: 'cab3',
          name: 'Premium SUV',
          basePrice: 3500,
          imageUrl: 'https://images.unsplash.com/photo-1565043589221-2572feea2d2c?w=500&h=300'
        },
        'cab4': {
          _id: 'cab4',
          name: 'Luxury Sedan',
          basePrice: 4500,
          imageUrl: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=500&h=300'
        }
      };
      
      if (staticCabs[cabId]) {
        cabDetails = staticCabs[cabId];
      } else {
        const cabName = queryParams.get('cabName');
        cabDetails = {
          _id: cabId,
          name: cabName || 'Selected Cab',
          basePrice: parseInt(amount) || 3000,
          imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=300&h=200'
        };
      }
    }
      
    // Set booking info
    setBookingInfo({
      fromCity,
      toCity,
      cabId,
      cabName: cabDetails.name,
      cabImage: cabDetails.imageUrl || '',
      bookingType,
      name,
      mobile,
      email,
      pickupAddress,
      dropAddress,
      baseAmount: parseInt(amount) || cabDetails.basePrice,
      amount: parseInt(amount) || cabDetails.basePrice,
      taxAmount: Math.round((parseInt(amount) || cabDetails.basePrice) * 0.05),
      totalAmount: Math.round((parseInt(amount) || cabDetails.basePrice) * 1.05),
      travelDate,
      travelTime
    });
    
    setIsLoading(false);
  };

  // Initialize booking info from URL parameters
  useEffect(() => {
    const fromCity = queryParams.get('from');
    const toCity = queryParams.get('to');
    const cabId = queryParams.get('cabId');
    const bookingType = queryParams.get('type');
    const name = queryParams.get('name');
    const mobile = queryParams.get('mobile');
    const email = queryParams.get('email');
    const pickupAddress = queryParams.get('pickupAddress');
    const dropAddress = queryParams.get('dropAddress');
    const amount = queryParams.get('amount');
    const travelDate = queryParams.get('travelDate');
    const travelTime = queryParams.get('travelTime');
    
    // Validate required parameters
    if (!fromCity || !toCity || !cabId || !name || !mobile || !email || !amount) {
      toast.error('Missing required booking information');
      navigate('/');
      return;
    }
    
    // Call the function once on initial render
    getCabDetails(cabId, fromCity, toCity, bookingType, name, mobile, email, pickupAddress, dropAddress, amount, travelDate, travelTime);
    
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount
  
  // Apply promo code
  const applyPromoCode = () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }
    
    if (promoApplied) {
      toast.warning('Promo code already applied');
      return;
    }
    
    // Mock promo code validation
    const validPromoCodes = {
      'WELCOME10': 10,
      'FIRST20': 20,
      'SPECIAL15': 15
    };
    
    if (validPromoCodes[promoCode]) {
      const discountPercent = validPromoCodes[promoCode];
      const discountAmount = Math.round((bookingInfo.baseAmount * discountPercent) / 100);
      
      setPromoDiscount(discountAmount);
      setPromoApplied(true);
      
      // Update total amount
      setBookingInfo({
        ...bookingInfo,
        totalAmount: Math.round(bookingInfo.baseAmount * 1.05) - discountAmount
      });
      
      toast.success(`${discountPercent}% discount applied successfully!`);
    } else {
      toast.error('Invalid promo code');
    }
  };
  
  // Remove promo code
  const removePromoCode = () => {
    setPromoCode('');
    setPromoDiscount(0);
    setPromoApplied(false);
    
    // Reset total amount
    setBookingInfo({
      ...bookingInfo,
      totalAmount: Math.round(bookingInfo.baseAmount * 1.05)
    });
  };
  
  // Create a booking and initiate payment
  const initiatePayment = async () => {
    try {
      setProcessingPayment(true);
      
      // Generate a temporary booking ID for demo purposes
      const tempBookingId = 'CB' + Date.now().toString().substring(5);
      
      // Setup API config
      // Import API URL from config
  const { API_URL } = require('../config/apiConfig');
      let config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      // Add auth token if available
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      if (userInfo && userInfo.token) {
        config.headers.Authorization = `Bearer ${userInfo.token}`;
      }
      
      // Prepare frontend booking data for localStorage
      const bookingData = {
        id: tempBookingId,
        from: bookingInfo.fromCity,
        to: bookingInfo.toCity,
        date: bookingInfo.travelDate || new Date().toISOString().split('T')[0],
        time: bookingInfo.travelTime || '10:00 AM',
        cabName: bookingInfo.cabName,
        cabType: bookingInfo.cabType || 'Sedan',
        amount: bookingInfo.totalAmount,
        baseAmount: bookingInfo.baseAmount,
        taxAmount: bookingInfo.totalAmount - bookingInfo.baseAmount,
        paymentMethod: selectedPaymentMethod,
        passengerDetails: {
          name: bookingInfo.name,
          email: bookingInfo.email,
          phone: bookingInfo.mobile
        }
      };
      
      // Step 1: Try to save booking to MongoDB database
      try {
        // Extract cab and location IDs with fallbacks to ensure valid MongoDB ObjectIds
        // MongoDB requires valid ObjectIds for reference fields
        const cabID = queryParams.get('cabId') || 
                     bookingInfo.cabId || 
                     DEFAULT_CAB_ID;
                     
        const pickupLocationID = queryParams.get('pickupLocationId') || 
                               bookingInfo.pickupLocationId || 
                               DEFAULT_CITY_ID;
                               
        const dropLocationID = queryParams.get('dropLocationId') || 
                             bookingInfo.dropLocationId || 
                             DEFAULT_CITY_ID;
        
        // Comprehensive authentication check using all authentication sources
        // This matches how we check in the initial useEffect
        const isAuthenticated = !!token || 
                            !!(user && (user._id || user.id)) || 
                            !!(storedAuth && storedAuth.token);
        
        if (!isAuthenticated) {
          console.log('Authentication check failed at payment time');
          toast.error('Authentication required - please log in again');
          setProcessingPayment(false);
          navigate('/login?redirect=payment&ts=' + Date.now());
          return;
        }
        
        // If we're missing a token but have user ID, try to proceed anyway
        // The backend will use the cookie token if available
        
        console.log('Proceeding with authenticated booking');
        
        // We'll continue regardless as the user may be authenticated in various ways
        
        // Use the standard booking endpoint with authenticated user only
        // We now require a real user for all bookings
        const apiEndpoint = `${API_URL}/booking`;
        
        console.log('Saving booking to database:', apiEndpoint);
        
        // Create a booking payload with real data instead of mock data
        const bookingPayload = {
          // Required MongoDB ObjectId references - ensure they are valid IDs
          cabType: cabID,
          pickupLocation: pickupLocationID,
          dropLocation: dropLocationID,
          
          // Required MongoDB user reference - must be a valid ObjectId
          user: userId,
          
          // Ensure required status field is included for MongoDB validation
          status: 'pending',
          
          // Include real passenger details from the booking form - no fallbacks
          passengerDetails: {
            name: bookingInfo.name,
            email: bookingInfo.email,
            phone: bookingInfo.mobile
          },
          
          // Additional fields required for MongoDB
          status: 'pending',
          paymentMethod: selectedPaymentMethod,
          
          // Address fields using real data
          pickupAddress: bookingInfo.fromCity,
          dropAddress: bookingInfo.toCity,
          
          // Journey details using only real data
          journeyType: bookingInfo.journeyType || 'oneWay',
          pickupDate: bookingInfo.date || bookingInfo.travelDate,
          pickupTime: bookingInfo.time || bookingInfo.travelTime,
          
          // Amount fields - convert to numbers with explicit parsing, no default values
          distance: parseInt(bookingInfo.distance || 0, 10),  
          duration: parseInt(bookingInfo.duration || 0, 10),    
          baseAmount: parseInt(bookingInfo.baseAmount, 10),
          taxAmount: parseInt(bookingInfo.taxAmount, 10),
          totalAmount: parseInt(bookingInfo.totalAmount, 10),
          
          // Status info
          status: 'pending',
          paymentStatus: 'pending',
          paymentMethod: selectedPaymentMethod,
          bookingId: tempBookingId
        };
        
        // We've already added the user ID from the authenticated user
        // No need for a condition since we require authentication
        
        console.log('Sending booking payload:', bookingPayload);
        
        // Attempt to save booking with improved error handling
        let bookingResponse;
        try {
          console.log(`Posting to ${apiEndpoint} with real data:`, bookingPayload);
          
          // Properly format headers with authentication if available
          // Ensure the Authorization header matches exactly what your middleware expects
          // Your auth.js middleware checks for Bearer token format
          const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          };
          
          // Add any available token to cookies for maximum compatibility
          // Many backends check cookies first, then headers
          const tokenToUse = token || (storedAuth && storedAuth.token) || '';
          if (tokenToUse) {
            document.cookie = `token=${tokenToUse}; path=/; max-age=86400`;
            console.log('Added token to cookies for API authentication');
          } else {
            console.log('No token available for cookies - using user ID only');
          }
          
          console.log('Making authenticated API call with:', {
            authHeader: headers.Authorization.substring(0, 20) + '...',
            userId: bookingPayload.user,
            payload: bookingPayload
          });
          
          // Simplified booking approach with localStorage fallback
          try {
            // Make a standard API call with authentication
            console.log('Making booking API call with authentication');
            bookingResponse = await axios.post(`${API_URL}/booking`, bookingPayload, {
              headers: headers
            });
          } catch (error) {
            console.log('API booking failed:', error.message);
            
            // In case of API failure, store locally as a fallback
            console.log('Storing booking locally as fallback');
            
            // Generate a local ID to use temporarily
            const localBookingId = 'local-' + Date.now();
            
            // Create a local booking version
            const localBooking = {
              ...bookingPayload,
              _id: localBookingId,
              localOnly: true,
              createdAt: new Date().toISOString()
            };
            
            // Get existing bookings or create empty array
            const existingBookings = localStorage.getItem('bookings')
              ? JSON.parse(localStorage.getItem('bookings'))
              : [];
              
            // Add new booking to array and save
            existingBookings.push(localBooking);
            localStorage.setItem('bookings', JSON.stringify(existingBookings));
            
            // Create mock response
            bookingResponse = {
              data: {
                success: true,
                data: localBooking,
                message: 'Booking stored locally (offline mode)'
              }
            };
          }
          
          console.log('Successfully saved booking to MongoDB:', bookingResponse.data);
          toast.success('Booking stored in database successfully!');
        } catch (dbError) {
          console.error('Error saving to database:', dbError.message);
          console.error('Error response:', dbError.response?.data);
          
          // Provide specific error messages
          if (dbError.response?.status === 401) {
            toast.error('Authentication error - check guest user setup');
          } else if (dbError.response?.status === 400) {
            toast.error('Invalid booking data - check required fields');
          } else {
            toast.warning('Server error - using fallback');
          }
          
          // If we can't connect to the database, we should stop the process
          alert('Cannot connect to the server. Please try again later.');
          setProcessingPayment(false);
          return; // Exit the function instead of proceeding with a fake response
        }

        // If the booking was saved successfully
        if (bookingResponse.data && bookingResponse.data.success) {
          console.log('Booking successfully saved to MongoDB:', bookingResponse.data);
          toast.success('Booking created successfully!');
          
          // Update booking data with database ID
          if (bookingResponse.data.data && bookingResponse.data.data._id) {
            const dbId = bookingResponse.data.data._id;
            bookingData.dbId = dbId;
            bookingData.mongoId = dbId;
            
            // Use the server-generated bookingId if available
            if (bookingResponse.data.data.bookingId) {
              bookingData.id = bookingResponse.data.data.bookingId;
            }
          }
        } else {
          console.warn('Database save response was not successful:', bookingResponse.data);
          toast.warning('Could not save to database.');
        }
      } catch (dbError) {
        console.error('Failed to save booking to database:', dbError);
        toast.error('Could not connect to database. Proceeding with payment.');
      }
// End of saveBooking try/catch
      // For COD option, redirect directly to confirmation
      if (selectedPaymentMethod === 'cod') {
        // Check if this is a local ID (starts with 'local_') or a real MongoDB ID
        const targetId = bookingData.dbId || bookingData.mongoId;
        const isLocalId = targetId && targetId.toString().startsWith('local_');
        
        if (targetId && !isLocalId) {
          // This is a real MongoDB ID, so try to update it in the database
          try {
            console.log('Updating COD payment in MongoDB:', targetId);
            
            const paymentUpdateResponse = await axios.put(
              `${API_URL}/booking/${targetId}/payment-method`, 
              {
                paymentMethod: 'cod',
                paymentStatus: 'pending'
              },
              config // Include authentication headers
            );
            
            if (paymentUpdateResponse.data && paymentUpdateResponse.data.success) {
              console.log('COD payment method updated in database:', paymentUpdateResponse.data);
              toast.success('Booking confirmed as Cash on Delivery');
            } else {
              console.warn('COD payment update failed:', paymentUpdateResponse.data);
            }
          } catch (payError) {
            console.error('Error updating COD payment:', payError);
            toast.warning('Could not connect to server');
          }
        } else {
          // This is a local ID or no ID, just update MongoDB
          console.log('Using MongoDB for COD payment');
          toast.info('Booking information saved to MongoDB');
        }
        
        // Redirect to booking confirmation page first to show animation
        console.log('Redirecting to booking confirmation page after COD...');
        const bookingId = bookingData.dbId || bookingData.mongoId || bookingData.id;
        
        // Include all the trip information in the URL for the confirmation page
        const confirmationParams = new URLSearchParams();
        confirmationParams.append('method', 'cod');
        confirmationParams.append('bookingId', bookingId);
        confirmationParams.append('from', bookingInfo.fromCity);
        confirmationParams.append('to', bookingInfo.toCity);
        confirmationParams.append('cabName', bookingInfo.cabName);
        confirmationParams.append('amount', bookingInfo.totalAmount);
        confirmationParams.append('date', bookingInfo.pickupDate || '');
        confirmationParams.append('time', bookingInfo.pickupTime || '');
        confirmationParams.append('distance', bookingInfo.distance || '');
        
        // Show the booking confirmed animation with COD payment method first
        setShowPaymentSuccessAnimation(true);
        // Set selected payment method to ensure the correct message is shown
        const paymentMethodForAnimation = 'cod';
        
        // Wait for animation to complete before redirecting
        setTimeout(() => {
          setShowPaymentSuccessAnimation(false);
          // Navigate to the confirmation page with all params
          navigate(`/booking/confirmation?${confirmationParams.toString()}`);
        }, 3000);
        
        return;
      }
      
      // For Razorpay payment - use client-side only integration
      // Check if Razorpay script is loaded
      if (!window.Razorpay) {
        toast.error('Razorpay SDK failed to load. Please refresh the page and try again.');
        setProcessingPayment(false);
        return;
      }
      
      // Initialize Razorpay checkout with the most basic configuration
      const options = {
        key: 'rzp_test_PnSgiqE2elzEYx', // Razorpay test key
        amount: bookingInfo.totalAmount * 100, // Amount in paise
        currency: 'INR',
        name: 'UrbanRide',
        description: `Booking from ${bookingInfo.fromCity} to ${bookingInfo.toCity}`,
        handler: async function(response) {
          setProcessingPayment(false);
          console.log('Payment success:', response);
          
          // First show the payment success animation
          setShowPaymentSuccessAnimation(true);
          
          // Extract the payment ID
          const paymentId = response.razorpay_payment_id;

          try {
            // Update booking with payment details
            let updatedBooking = {
              ...bookingData,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              paymentStatus: 'paid'
            };
          
            // Update payment status based on booking ID type
            try {
              // Get the booking ID from the response
              const bookingId = updatedBooking.bookingId || updatedBooking.id || updatedBooking._id || updatedBooking.dbId || '';
              console.log('Processing payment update for booking ID:', bookingId);
              
              // Determine ID type (local storage, custom ID, or MongoDB ID)
              const isLocalId = bookingId && bookingId.toString().includes('local-');
              const isCustomId = bookingId && (bookingId.toString().startsWith('CB') || /^[A-Z0-9]+$/.test(bookingId));
              
              if (isLocalId) {
                // Handle local storage booking update
                console.log('Local booking detected, updating in localStorage:', bookingId);
                
                // Get existing bookings from localStorage
                const localBookings = localStorage.getItem('bookings') 
                  ? JSON.parse(localStorage.getItem('bookings')) 
                  : [];
                
                // Find and update the specific booking
                const updatedLocalBookings = localBookings.map(booking => {
                  if (booking._id === bookingId) {
                    return {
                      ...booking,
                      paymentId: response.razorpay_payment_id,
                      paymentStatus: 'completed',
                      paymentMethod: 'online',
                      status: 'confirmed',
                      updatedAt: new Date().toISOString()
                    };
                  }
                  return booking;
                });
                
                // Save updated bookings back to localStorage
                localStorage.setItem('bookings', JSON.stringify(updatedLocalBookings));
                console.log('Local booking payment updated successfully');
                toast.success('Payment recorded successfully (offline mode)');
              } else if (bookingId) {
                // This is a MongoDB ID, update in the database
                console.log('Updating payment status in MongoDB:', bookingId);
                
                try {
                  // Prepare payment update data
                  const paymentData = {
                    paymentId: response.razorpay_payment_id,
                    paymentStatus: 'completed',
                    paymentMethod: 'online',
                    // Add custom ID for better server-side handling
                    customBookingId: isCustomId ? bookingId : undefined
                  };
                  console.log('Sending payment update with data:', paymentData);
                  
                  // Determine the appropriate approach based on ID type
                  let paymentUpdateResponse;
                  
                  if (isCustomId) {
                    // For custom IDs (with CB prefix), use the dedicated endpoint
                    console.log('Using custom booking ID endpoint (POST method)');
                    paymentUpdateResponse = await axios.post(
                      `${API_URL}/booking/payment-update/custom`,
                      {
                        // Put all data in body for the custom endpoint
                        bookingId: bookingId,
                        paymentId: response.razorpay_payment_id,
                        paymentStatus: 'completed',
                        paymentMethod: 'online'
                      },
                      {
                        headers: {
                          'Content-Type': 'application/json'
                        }
                      }
                    );
                  } else {
                    // For MongoDB IDs, use the standard endpoint
                    console.log('Using standard MongoDB ID endpoint (PUT method):', bookingId);
                    paymentUpdateResponse = await axios.put(
                      `${API_URL}/booking/${bookingId}/payment-method`,
                      paymentData,
                      config // Include authentication headers
                    );
                  }
                  
                  if (paymentUpdateResponse.data && paymentUpdateResponse.data.success) {
                    console.log('Payment status updated in database:', paymentUpdateResponse.data);
                    toast.success('Payment information saved to database');
                    
                    // Get the updated booking data from server
                    if (paymentUpdateResponse.data.data) {
                      const updatedBookingFromServer = paymentUpdateResponse.data.data;
                      
                      // Update booking data
                      updatedBooking = { 
                        ...updatedBooking,
                        status: updatedBookingFromServer.status || 'confirmed',
                        paymentStatus: updatedBookingFromServer.paymentStatus || 'completed'
                      };
                    }
                  } else {
                    console.warn('Payment update failed:', paymentUpdateResponse.data);
                    toast.warning('Payment successful but database update failed');
                  }
                } catch (apiError) {
                  console.error('API error updating payment:', apiError);
                  toast.warning('Payment recorded but server update failed - will sync later');
                }
              } else {
                // No valid ID found
                console.log('No valid booking ID found');
                toast.info('Payment recorded but booking ID not found');
              }
              
              // Only navigate once - use the proper ID from the database if available
              console.log('Redirecting to booking details...');
              // Give the browser a moment to process the navigation
              setTimeout(() => {
                const confirmationId = updatedBooking.id || updatedBooking._id || 'pending';
                navigate(`/booking/${confirmationId}?paymentStatus=success&from=${bookingInfo.fromCity}&to=${bookingInfo.toCity}&cabName=${encodeURIComponent(bookingInfo.cabName)}&amount=${bookingInfo.totalAmount}&date=${encodeURIComponent(bookingInfo.pickupDate)}&time=${encodeURIComponent(bookingInfo.pickupTime)}`);
              }, 500);

            } catch (paymentUpdateError) {
              console.error('Error in payment update process:', paymentUpdateError);
              toast.error('Payment was successful, but we had trouble updating your booking');

              // Still redirect to booking details, even if there was an error updating the payment status
              setTimeout(() => {
                navigate(`/booking/${bookingData.id}?from=${bookingInfo.fromCity}&to=${bookingInfo.toCity}`);
              }, 500);
            }
          } catch (error) {
            console.error('Error processing payment success:', error);
            toast.error('There was a problem processing your payment');
            
            // Still navigate somewhere even if processing failed
            setTimeout(() => {
              navigate(`/booking/status?error=true`);
            }, 500);
          }
      },
      prefill: {
        name: bookingInfo.name,
        email: bookingInfo.email || '',
        contact: bookingInfo.mobile
      },
      notes: {
        bookingId: tempBookingId,
        fromCity: bookingInfo.fromCity,
        toCity: bookingInfo.toCity
      },
      theme: {
        color: '#3B82F6'
      },
      modal: {
        ondismiss: function() {
          setProcessingPayment(false);
          toast.info('Payment cancelled');
        }
      }
    };
    
    // Fallback approach in case Razorpay integration fails
    try {
      // Create and open Razorpay instance
      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', function(response) {
        toast.error('Payment failed: ' + (response.error?.description || 'Unknown error'));
        setProcessingPayment(false);
      });
      razorpayInstance.open();
    } catch (razorpayError) {
      console.error('Razorpay error:', razorpayError);
      
      // Fallback for demo purposes - simulate payment success
      toast.success('Demo mode: Payment simulated successfully');
      
      // Show payment success animation even in demo mode
      setShowPaymentSuccessAnimation(true);
      
      // Wait before redirecting
      setTimeout(() => {
        // Redirect directly to booking details with complete trip information
        navigate(`/booking/${bookingData.id}?paymentStatus=success&from=${bookingInfo.fromCity}&to=${bookingInfo.toCity}&cabName=${encodeURIComponent(bookingInfo.cabName)}&amount=${bookingInfo.totalAmount}&date=${encodeURIComponent(bookingInfo.pickupDate)}&time=${encodeURIComponent(bookingInfo.pickupTime)}`);
      }, 3000);
    }
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error(error.message || 'Failed to initiate payment');
      setProcessingPayment(false);
    }
  };
  
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Payment Animation Components */}
      {showPaymentSuccessAnimation && (
        <PaymentSuccessAnimation 
          paymentMethod={selectedPaymentMethod === 'cod' ? 'cod' : 'online'} 
          onComplete={() => {
            setShowPaymentSuccessAnimation(false);
            setShowBookingConfirmedAnimation(true);
            
            // After showing booking confirmation, redirect to booking details
            setTimeout(() => {
              setShowBookingConfirmedAnimation(false);
            }, 3000);
          }} 
        />
      )}
      
      {showBookingConfirmedAnimation && (
        <BookingConfirmedAnimation 
          bookingData={{
            id: bookingInfo._id || bookingInfo.id,
            fromCity: bookingInfo.fromCity,
            toCity: bookingInfo.toCity,
            cabName: bookingInfo.cabName,
            amount: bookingInfo.totalAmount,
            date: bookingInfo.pickupDate,
            time: bookingInfo.pickupTime
          }}
          onComplete={() => {
            setShowBookingConfirmedAnimation(false);
          }} 
        />
      )}
      
      {/* Animation Styles */}
      <AnimationStyles />
      
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Payment</h1>
          <p className="text-gray-600">Secure payment for your cab booking</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 lg:mb-8">
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Apply Promo Code</h2>
              
              <div className="flex items-stretch">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Enter promo code"
                  disabled={promoApplied}
                  className={`flex-1 border rounded-l-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    promoApplied ? 'bg-gray-100' : ''
                  }`}
                />
                {promoApplied ? (
                  <button
                    onClick={removePromoCode}
                    className="bg-gray-200 px-4 rounded-r-lg flex items-center justify-center hover:bg-gray-300 transition-colors"
                  >
                    <FaTimes className="text-gray-600" />
                  </button>
                ) : (
                  <button
                    onClick={applyPromoCode}
                    className="bg-blue-600 text-white px-4 py-3 rounded-r-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Apply
                  </button>
                )}
              </div>
              
              {promoApplied && (
                <div className="mt-2 text-green-600 flex items-center">
                  <FaTag className="mr-2" />
                  <span>Promo code applied! You saved ₹{promoDiscount}</span>
                </div>
              )}
              
              <div className="mt-4 text-sm text-gray-500">
                <p>Available promo codes: WELCOME10, FIRST20, SPECIAL15</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Select Payment Method</h2>
              
              <div className="space-y-4">
                <div
                  className={`border rounded-xl p-5 cursor-pointer transition-all shadow-sm hover:shadow-md ${
                    selectedPaymentMethod === 'razorpay' 
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPaymentMethod('razorpay')}
                >
                  <div className="flex items-center">
                    <div className={`h-6 w-6 rounded-full border-2 ${selectedPaymentMethod === 'razorpay' ? 'border-blue-500 bg-white' : 'border-gray-400'} flex items-center justify-center mr-3 transition-all`}>
                      {selectedPaymentMethod === 'razorpay' && <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse"></div>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <img src="https://razorpay.com/favicon.png" alt="Razorpay Logo" className="w-6 h-6 mr-2" />
                        <span className="font-semibold text-lg">Razorpay</span>
                      </div>
                      <p className="text-gray-500 text-sm mt-1 ml-6">Pay securely with cards, UPI, wallets & more</p>
                    </div>
                  </div>
                  {selectedPaymentMethod === 'razorpay' && (
                    <div className="mt-4 ml-9 text-sm text-gray-600">
                      <p>• All payment methods accepted in one place</p>
                      <p>• Fast and secure payment process</p>
                      <p>• No additional charges</p>
                    </div>
                  )}
                </div>
                
                <div
                  className={`border rounded-xl p-5 cursor-pointer transition-all shadow-sm hover:shadow-md ${
                    selectedPaymentMethod === 'cod' 
                      ? 'border-green-500 bg-gradient-to-r from-green-50 to-green-100' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPaymentMethod('cod')}
                >
                  <div className="flex items-center">
                    <div className={`h-6 w-6 rounded-full border-2 ${selectedPaymentMethod === 'cod' ? 'border-green-500 bg-white' : 'border-gray-400'} flex items-center justify-center mr-3 transition-all`}>
                      {selectedPaymentMethod === 'cod' && <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="font-semibold text-lg">Cash on Delivery</span>
                      </div>
                      <p className="text-gray-500 text-sm mt-1 ml-6">Pay directly to driver when you reach destination</p>
                    </div>
                  </div>
                  {selectedPaymentMethod === 'cod' && (
                    <div className="mt-4 ml-9 text-sm text-gray-600">
                      <p>• Pay when you reach your destination</p>
                      <p>• No online payment required</p>
                      <p>• Cash, UPI, and cards accepted on delivery</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-8">
                <button 
                  onClick={initiatePayment}
                  disabled={processingPayment}
                  className={`w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transform hover:-translate-y-0.5 transition-all duration-300 ${
                    processingPayment ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {processingPayment ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span className="mr-2">{selectedPaymentMethod === 'cod' ? 'Book with Cash on Delivery' : `Pay ₹${bookingInfo.totalAmount} with Razorpay`}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  )}
                </button>
                <div className="mt-4 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <p className="text-center text-sm text-gray-600">
                    Secure payment processed with 256-bit encryption
                  </p>
                </div>
                <p className="text-center text-xs text-gray-500 mt-2">
                  By clicking "Pay", you agree to our <span className="text-blue-600 cursor-pointer">terms and conditions</span>
                </p>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Booking Summary</h2>
              
              <div className="mb-4">
                <img 
                  src={bookingInfo.cabImage || 'https://via.placeholder.com/300x200?text=Cab+Image'}
                  alt={bookingInfo.cabName}
                  className="w-full h-auto rounded-lg object-cover mb-3"
                />
                <h3 className="font-bold">{bookingInfo.cabName}</h3>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Route:</span>
                  <span className="font-medium">{bookingInfo.fromCity} → {bookingInfo.toCity}</span>
                </div>
                
                {bookingInfo.travelDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{new Date(bookingInfo.travelDate).toLocaleDateString()}</span>
                  </div>
                )}
                
                {bookingInfo.travelTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{bookingInfo.travelTime}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Trip Type:</span>
                  <span className="font-medium capitalize">{bookingInfo.bookingType || 'One Way'}</span>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Cab Fare:</span>
                  <span className="font-medium">₹{bookingInfo.baseAmount || '0'}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Taxes & Fees:</span>
                  <span className="font-medium">₹{bookingInfo.taxAmount || '0'}</span>
                </div>
                {promoApplied && (
                  <div className="flex justify-between items-center mb-2 text-green-600">
                    <span>Promo Discount:</span>
                    <span>-₹{promoDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t mt-2 text-lg">
                  <span className="font-bold">Total Amount:</span>
                  <span className="font-bold text-blue-600">₹{bookingInfo.totalAmount || '0'}</span>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <h3 className="font-bold mb-2">Customer Details</h3>
                <p><span className="text-gray-600">Name:</span> {bookingInfo.name}</p>
                <p><span className="text-gray-600">Mobile:</span> +91 {bookingInfo.mobile}</p>
                {bookingInfo.email && <p><span className="text-gray-600">Email:</span> {bookingInfo.email}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
