import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import { calculateCabPrice, calculateTaxesAndFees, calculateTotalAmount } from '../utils/priceCalculator';

const CustomerDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [cabDetails, setCabDetails] = useState(null);
  const [distance, setDistance] = useState(null);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [errors, setErrors] = useState({});
  
  // Extract query parameters
  const queryParams = new URLSearchParams(location.search);
  const fromCity = queryParams.get('from');
  const toCity = queryParams.get('to');
  const distanceParam = queryParams.get('distance') ? parseInt(queryParams.get('distance')) : null;
  const cabId = queryParams.get('cabId');
  const bookingType = queryParams.get('type');
  const travelDate = queryParams.get('travelDate');
  const travelTime = queryParams.get('travelTime');
  
  // API URL
  const API_URL = 'http://localhost:5000/api';

  // Auto-fill mobile from the booking form if available
  useEffect(() => {
    // Try to get saved user details from localStorage
    const savedName = localStorage.getItem('userName');
    const savedMobile = localStorage.getItem('userMobile');
    const savedEmail = localStorage.getItem('userEmail');
    
    if (savedName) setFullName(savedName);
    if (savedMobile) setMobile(savedMobile);
    if (savedEmail) setEmail(savedEmail);
    
    // Try to get mobile from query params (from home page form)
    const queryMobile = queryParams.get('mobile');
    if (queryMobile && !savedMobile) setMobile(queryMobile);
  }, []); // This effect only runs once on component mount
  
  // Separate useEffect for cab details to avoid dependency issues
  useEffect(() => {
    // Get cab details from the backend API
    const getCabDetails = async () => {
      if (!cabId) return;
      
      setIsLoading(true);
      
      try {
        // First, try to get data from localStorage (set in CarSelection page)
        const savedCabData = localStorage.getItem('selectedCabData');
        let parsedData = null;
        
        if (savedCabData) {
          try {
            parsedData = JSON.parse(savedCabData);
            // Don't log here to avoid console spam
          } catch (e) {
            console.error('Error parsing saved cab data:', e);
          }
        }
        
        // Fetch the cab details from the backend
        const response = await axios.get(`${API_URL}/cab/${cabId}`);
        
        if (response.data.success) {
          const cabData = response.data.data;
          // Log only once in development
          if (process.env.NODE_ENV === 'development') {
            console.log('Fetched cab details:', cabData);
          }
          
          // Get distance from URL params if available
          if (distanceParam && !distance) {
            setDistance(distanceParam);
          }
          
          // Calculate price dynamically based on cab and distance
          const cabPriceDynamic = distance ? calculateCabPrice(cabData, distance) : cabData.baseKmPrice;
          // Extract the price from URL params as fallback (it may include calculations from CarSelection)
          const amount = queryParams.get('amount');
          
          setCabDetails({
            _id: cabData._id,
            name: cabData.name,
            // Prefer dynamically calculated price, fallback to amount from URL, then to base price
            basePrice: cabPriceDynamic || (amount ? parseInt(amount) : cabData.baseKmPrice),
            imageUrl: cabData.imageUrl || (parsedData ? parsedData.imageUrl : ''),
            description: cabData.description,
            seatingCapacity: cabData.seatingCapacity,
            acType: cabData.acType,
            luggageCapacity: cabData.luggageCapacity,
            includedKm: cabData.includedKm,
            extraFarePerKm: cabData.extraFarePerKm,
            fuelChargesIncluded: cabData.fuelChargesIncluded,
            driverChargesIncluded: cabData.driverChargesIncluded,
            nightChargesIncluded: cabData.nightChargesIncluded
          });
        } else {
          toast.error('Could not retrieve cab details');
          // Fallback to URL parameters
          const cabName = queryParams.get('cabName');
          const amount = queryParams.get('amount');
          setCabDetails({
            _id: cabId,
            name: cabName || 'Selected Cab',
            basePrice: amount ? parseInt(amount) : 3000,
            imageUrl: parsedData?.imageUrl || ''
          });
        }
      } catch (error) {
        console.error('Error fetching cab details:', error);
        toast.error('Error fetching cab details. Using cached data.');
        
        // Fallback to URL parameters
        const cabName = queryParams.get('cabName');
        const amount = queryParams.get('amount');
        setCabDetails({
          _id: cabId,
          name: cabName || 'Selected Cab',
          basePrice: amount ? parseInt(amount) : 3000,
          imageUrl: ''
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    getCabDetails();
  }, [cabId]); // Only depend on cabId, not the entire queryParams object
  
  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    
    if (!mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(mobile.trim())) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
    }
    
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!pickupAddress.trim()) newErrors.pickupAddress = 'Pickup address is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill all required fields correctly');
      return;
    }
    
    // Save user details to localStorage for future bookings
    localStorage.setItem('userName', fullName);
    localStorage.setItem('userMobile', mobile);
    if (email) localStorage.setItem('userEmail', email);
    
    // Prepare all data needed for payment
    const params = new URLSearchParams();
    params.append('from', fromCity);
    params.append('to', toCity);
    params.append('cabId', cabId);
    params.append('type', bookingType);
    params.append('name', fullName);
    params.append('mobile', mobile);
    
    if (email) params.append('email', email);
    if (travelDate) params.append('travelDate', travelDate);
    if (travelTime) params.append('travelTime', travelTime);
    
    params.append('pickupAddress', pickupAddress);
    if (dropAddress) params.append('dropAddress', dropAddress);
    
    // Calculate amount from cab details
    if (cabDetails) {
      params.append('amount', cabDetails.basePrice);
    }
    
    // Navigate to payment page
    navigate(`/booking/payment?${params.toString()}`);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Customer Details</h1>
          <p className="text-gray-600">Please provide your contact information to proceed with the booking</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                    <div className="bg-gray-50 p-3 border-r">
                      <FaUser className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="flex-1 p-3 outline-none"
                    />
                  </div>
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                    <div className="bg-gray-50 p-3 border-r flex items-center">
                      <FaPhone className="text-gray-400 mr-1" />
                      <span className="text-gray-500">+91</span>
                    </div>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="flex-1 p-3 outline-none"
                      maxLength={10}
                    />
                  </div>
                  {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>}
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Email Address <span className="text-gray-500 text-sm">(optional)</span>
                  </label>
                  <div className="flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                    <div className="bg-gray-50 p-3 border-r">
                      <FaEnvelope className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="flex-1 p-3 outline-none"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  <p className="text-gray-500 text-sm mt-1">We'll send booking confirmation to this email</p>
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Pickup Address <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-start border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                    <div className="bg-gray-50 p-3 border-r h-full">
                      <FaMapMarkerAlt className="text-gray-400" />
                    </div>
                    <textarea
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      placeholder={`Enter complete pickup address in ${fromCity}`}
                      className="flex-1 p-3 outline-none min-h-[80px]"
                    />
                  </div>
                  {errors.pickupAddress && <p className="text-red-500 text-sm mt-1">{errors.pickupAddress}</p>}
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Drop Address <span className="text-gray-500 text-sm">(optional)</span>
                  </label>
                  <div className="flex items-start border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                    <div className="bg-gray-50 p-3 border-r h-full">
                      <FaMapMarkerAlt className="text-gray-400" />
                    </div>
                    <textarea
                      value={dropAddress}
                      onChange={(e) => setDropAddress(e.target.value)}
                      placeholder={`Enter drop address in ${toCity} (if known)`}
                      className="flex-1 p-3 outline-none min-h-[80px]"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <button 
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Proceed to Payment
                </button>
              </div>
            </form>
          </div>
          
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Booking Summary</h2>
              
              {cabDetails && (
                <div className="mb-4">
                  <img 
                    src={cabDetails.imageUrl || 'https://via.placeholder.com/300x200?text=Cab+Image'}
                    alt={cabDetails.name}
                    className="w-full h-auto rounded-lg object-cover mb-3"
                  />
                  <h3 className="font-bold">{cabDetails.name}</h3>
                  <p className="text-gray-600 text-sm">{cabDetails.description}</p>
                  
                  {cabDetails.seatingCapacity && (
                    <div className="flex items-center mt-2 text-sm text-gray-600">
                      <FaUser className="mr-1" />
                      <span>{cabDetails.seatingCapacity} Passengers</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Route:</span>
                  <span className="font-medium">{fromCity} → {toCity}</span>
                </div>
                
                {travelDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{new Date(travelDate).toLocaleDateString()}</span>
                  </div>
                )}
                
                {travelTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{travelTime}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Trip Type:</span>
                  <span className="font-medium capitalize">{bookingType || 'One Way'}</span>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Cab Fare:</span>
                  <span className="font-medium">₹{cabDetails?.basePrice || '0'}</span>
                </div>
                
                {/* Distance based info */}
                {queryParams.get('distance') && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Distance:</span>
                    <span className="font-medium">{queryParams.get('distance')} km</span>
                  </div>
                )}
                
                {/* Extra fare if applicable */}
                {cabDetails?.extraFarePerKm && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Extra fare/km:</span>
                    <span className="font-medium">₹{cabDetails.extraFarePerKm}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Taxes & Fees:</span>
                  <span className="font-medium">₹{calculateTaxesAndFees(cabDetails?.basePrice || 0)}</span>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t mt-2 text-lg">
                  <span className="font-bold">Total Amount:</span>
                  <span className="font-bold text-blue-600">₹{calculateTotalAmount(cabDetails?.basePrice || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;
