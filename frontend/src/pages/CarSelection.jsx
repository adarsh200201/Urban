import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaUsers, FaSuitcase, FaSnowflake, FaCar, FaTaxi, FaRupeeSign, FaMapMarkerAlt, FaArrowRight, FaCheck } from 'react-icons/fa';
import { checkFixedRoute } from '../services/routesService';
import { calculateCabPrice } from '../utils/priceCalculator';

const CarSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [cabOptions, setCabOptions] = useState([]);
  const [selectedCab, setSelectedCab] = useState(null);
  const [distance, setDistance] = useState(null);
  const [cabPrices, setCabPrices] = useState({});
  const [error, setError] = useState(null);
  const [isFixedRoute, setIsFixedRoute] = useState(false);
  const [fixedRouteData, setFixedRouteData] = useState(null);
  
  // Extract query parameters from URL
  const queryParams = new URLSearchParams(location.search);
  const fromCity = queryParams.get('from');
  const toCity = queryParams.get('to');
  const dateStr = queryParams.get('date');
  const timeStr = queryParams.get('time');
  const journeyType = queryParams.get('journeyType') || 'outstation';
  const tripType = queryParams.get('tripType') || 'oneWay';
  
  // API URL
  const API_URL = 'http://localhost:5000/api';
  
  // Function to calculate distance between locations
  const calculateDistance = async (fromLocation, toLocation) => {
    try {
      const response = await axios.post(`${API_URL}/distance/calculate`, {
        fromCity: fromLocation,
        toCity: toLocation,
        journeyType: journeyType
      });
      
      if (response.data.success) {
        return response.data.data.distance;
      } else {
        throw new Error(response.data.message || 'Failed to calculate distance');
      }
    } catch (error) {
      console.error('Error calculating distance:', error);
      throw error;
    }
  };

  // Using the centralized price calculation function from utils
  const calculatePrice = (cab, dist) => {
    return calculateCabPrice(cab, dist);
  };

  // Function to process fixed route cabs
  const processFixedRouteCabs = (fixedRoutes) => {
    const fixedCabs = fixedRoutes.map(route => {
      const cabDetails = route.cabType;
      
      return {
        _id: cabDetails._id,
        name: cabDetails.name,
        description: cabDetails.description || 'Fixed route cab',
        category: cabDetails.category || 'sedan',
        basePrice: route.price,
        price: route.price, // Same price for fixed routes
        totalPrice: route.price, // All inclusive price
        includedKm: 0, // No included kilometers as per simplified approach
        seatingCapacity: cabDetails.seatingCapacity || 4,
        luggageCapacity: cabDetails.luggageCapacity || 2,
        imageUrl: cabDetails.imageUrl || 'https://via.placeholder.com/300x200?text=Cab+Image',
        acType: cabDetails.acType || 'AC',
        isFixedRoute: true,
        fixedRouteId: route._id,
        estimatedTime: route.estimatedTime,
        distance: route.distance,
        // Calculate price breakdown for display purposes
        priceBreakdown: {
          basePrice: route.price,
          taxes: 0, // Already included in fixed price
          tollCharges: 0, // Already included
          stateCharges: 0, // Already included
          total: route.price
        }
      };
    });
    
    setCabOptions(fixedCabs);
    if (fixedCabs.length > 0) {
      setSelectedCab(fixedCabs[0]);
    }
  };

  // Note: We're using a simplified pricing model: price = distance * rate
  // No additional fees or calculations are needed

  // Helper function to get cab price - uses cached price if available, otherwise calculates dynamically
  const getCabPrice = (cab) => {
    if (cab.isFixedRoute) return cab.price;
    // Use the cached price if available, otherwise calculate it on-demand
    return cabPrices[cab._id] ? cabPrices[cab._id] : calculateCabPrice(cab, distance);
  };
  
  // Shared handler for booking button clicks
  const handleCabBooking = (e, cab) => {
    e.stopPropagation();
    setSelectedCab(cab);
    handleBookNow();
  };

  // Function to fetch real cab data from the database
  const fetchCabData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsFixedRoute(false);
      setFixedRouteData(null);
      
      // No special route handling - all routes should be handled uniformly
      // Fixed routes will be handled by the fixed routes API

      // Check if this is a fixed route
      try {
        // First, get city IDs from names
        const cityResponse = await axios.get(`${API_URL}/city`);
        if (cityResponse.data.success) {
          const cities = cityResponse.data.data;
          const fromCityObj = cities.find(city => city.name.toLowerCase() === fromCity.toLowerCase());
          const toCityObj = cities.find(city => city.name.toLowerCase() === toCity.toLowerCase());
          
          if (fromCityObj && toCityObj) {
            // Check for fixed route
            const fixedRoutes = await checkFixedRoute(fromCityObj._id, toCityObj._id);
            
            if (fixedRoutes && fixedRoutes.length > 0) {
              // We have fixed routes!
              setIsFixedRoute(true);
              setFixedRouteData(fixedRoutes);
              
              // Process the fixed routes into cab options
              processFixedRouteCabs(fixedRoutes);
              setIsLoading(false);
              return;
            }
          }
        }
      } catch (fixedRouteError) {
        console.error('Error checking for fixed route:', fixedRouteError);
        // Continue with normal flow if fixed route check fails
      }

      // Always calculate the distance to ensure we have the latest value
      try {
        // For Rajkot to Delhi, we know this is a special route with fixed distance of 1140 km
        let dist;
        if ((fromCity.toLowerCase() === 'rajkot' && toCity.toLowerCase() === 'delhi') || 
            (fromCity.toLowerCase() === 'delhi' && toCity.toLowerCase() === 'rajkot')) {
          dist = 1140; // Actual road distance from Rajkot to Delhi in km
          console.log(`Using known distance for Rajkot-Delhi route: ${dist}km`);
        } else {
          // For other routes, calculate distance from API
          dist = await calculateDistance(fromCity, toCity);
          console.log(`Successfully calculated distance from ${fromCity} to ${toCity}: ${dist}km`);
        }
        
        // Always update the distance state
        setDistance(dist);
      } catch (distError) {
        console.error('Error calculating distance:', distError);
        setError('Could not calculate distance between locations.');
        setIsLoading(false);
        return;
      }

      console.log(`Searching for cabs in ${fromCity}`);
      
      // Fetch all available cabs
      const response = await axios.post(`${API_URL}/cab/available`, {
        journeyType: journeyType,
        pickupLocation: fromCity,
        dropLocation: toCity,
        pickupDate: dateStr,
        returnDate: tripType === 'roundTrip' ? dateStr : null
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch cabs');
      }
      
      let cabs = response.data.data;
      console.log(`Found ${cabs.length} cabs from backend in ${fromCity}`);
      
      // Handle no cabs found situation
      if (cabs.length === 0) {
        setError(`No cabs are currently available in ${fromCity}. Please try again later.`);
      }
      
      return cabs;
    } catch (error) {
      console.error('Error fetching cab data:', error);
      throw error;
    }
  };
  
  useEffect(() => {
    // If essential parameters are missing, redirect to home
    if (!fromCity || !toCity) {
      toast.error('Missing location information');
      navigate('/');
      return;
    }
    
    const loadRealCabData = async () => {
      try {
        setIsLoading(true);
        
        // 1. Fetch real cab data from the API
        const cabs = await fetchCabData();
        
        // 2. Calculate pricing for each cab based on distance using our utility function
        const prices = {};
        cabs.forEach(cab => {
          prices[cab._id] = calculateCabPrice(cab, distance);
        });
        
        setCabPrices(prices);
        setCabOptions(cabs);
      } catch (error) {
        console.error('Error loading cab data:', error);
        setError('Failed to load cab options. Please try again.');
        
        // Try to fetch from local storage cache if API fails
        try {
          const cachedCabs = JSON.parse(localStorage.getItem('cabTypes') || '[]');
          if (cachedCabs && cachedCabs.length > 0) {
            console.log('Using cached cab data from localStorage');
            setCabOptions(cachedCabs);
          } else {
            // No cached data available either
            setCabOptions([]);
            setError('No cab data available. Please try again later.');
          }
        } catch (cacheError) {
          console.error('Error reading from cache:', cacheError);
          setCabOptions([]);
          setError('Failed to load cab options. Please try again later.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRealCabData();
  }, [fromCity, toCity, journeyType, tripType, dateStr, navigate]);
  
  // Handle cab selection
  const handleSelectCab = (cab) => {
    setSelectedCab(cab);
  };
  
  // Handle booking button click
  const handleBookNow = () => {
    if (!selectedCab) {
      toast.warning('Please select a cab first');
      return;
    }
    
    // Construct query parameters to pass to the next page
    const params = new URLSearchParams();
    params.append('from', fromCity);
    params.append('to', toCity);
    params.append('cabId', selectedCab._id);
    params.append('cabName', selectedCab.name);
    params.append('type', tripType);
    params.append('amount', cabPrices[selectedCab._id] || selectedCab.baseKmPrice);
    params.append('distance', distance);
    if (selectedCab.vehicleLocation) {
      params.append('pickupLocation', selectedCab.vehicleLocation);
    }
    
    if (dateStr) params.append('travelDate', dateStr);
    if (timeStr) params.append('travelTime', timeStr);
    
    // Store selected cab data in local storage for persistence
    localStorage.setItem('selectedCabData', JSON.stringify({
      id: selectedCab._id,
      name: selectedCab.name,
      basePrice: selectedCab.basePrice,
      imageUrl: selectedCab.imageUrl
    }));
    
    // Navigate to customer details page
    navigate(`/booking/customer-details?${params.toString()}`);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Finding the best cabs for you...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Select Your Cab</h1>
        <div className="flex flex-wrap md:flex-nowrap items-center justify-between bg-white rounded-lg shadow-sm p-4 mb-4">
          {/* Route Details */}
          <div className="flex items-center mb-3 md:mb-0">
            <div className="bg-blue-50 p-2 rounded-full mr-3">
              <FaMapMarkerAlt className="text-blue-500" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Route</div>
              <div className="font-semibold flex items-center">
                <span>{fromCity}</span>
                <svg className="h-3 w-3 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <span>{toCity}</span>
              </div>
            </div>
          </div>
          
          {/* Trip Type Details */}
          <div className="flex items-center mb-3 md:mb-0">
            <div className="bg-green-50 p-2 rounded-full mr-3">
              <FaTaxi className="text-green-500" />
            </div>
            <div>
              <div className="text-xs text-gray-500">{journeyType === 'outstation' ? 'Outstation' : 'Local'}</div>
              <div className="font-semibold">{tripType === 'oneWay' ? 'One Way Trip' : 'Round Trip'}</div>
            </div>
          </div>
          
          {/* Departure Details */}
          <div className="flex items-center mb-3 md:mb-0">
            <div className="bg-purple-50 p-2 rounded-full mr-3">
              <FaCar className="text-purple-500" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Departure</div>
              <div className="font-semibold">
                {dateStr && new Date(dateStr).toLocaleDateString('en-US', {day: '2-digit', month: 'short', year: 'numeric'})}
              </div>
              <div className="text-sm">{timeStr}</div>
              {distance && <div className="text-sm font-bold text-green-600 mt-1">Distance: {distance} km</div>}
            </div>
          </div>
          
          {/* Return Details (only for round trip) */}
          {tripType === 'roundTrip' && (
            <div className="flex items-center">
              <div className="bg-yellow-50 p-2 rounded-full mr-3">
                <FaCar className="text-yellow-500" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Return</div>
                <div className="font-semibold">
                  {/* If you have a return date, use it here */}
                  {/* Otherwise show a placeholder or omit */}
                  {/* {returnDateStr ? new Date(returnDateStr).toLocaleDateString('en-US', {day: '2-digit', month: 'short', year: 'numeric'}) : 'Not Specified'} */}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {cabOptions.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-yellow-800">No cabs available</h3>
          <p className="text-yellow-600 mt-2">Sorry, we couldn't find any cabs for your selected route and date.</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Another Route
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* No cabs message */}
          {cabOptions.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-lg text-center">
              <h3 className="font-bold text-lg mb-2">No Cabs Available</h3>
              <p>Sorry, there are no cabs available for your selected route and date.</p>
              <p className="mt-4">Try changing your search criteria or contact customer support for assistance.</p>
            </div>
          )}
          
          {/* Cab listing header */}
          {cabOptions.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">Available Cabs ({cabOptions.length})</h3>
              <p className="text-gray-600">Select the cab that best suits your needs</p>
            </div>
          )}
          
          {/* Cab list - Grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cabOptions.map(cab => (
              <div key={cab._id} 
                className={`bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow ${selectedCab && selectedCab._id === cab._id ? 'border-2 border-blue-500' : 'border border-gray-200'}`}
                onClick={() => handleSelectCab(cab)}
              >
              {/* Mobile View */}
              <div className="block md:hidden p-4 w-full">
                <div className="flex items-center mb-3">
                  <img 
                    src={cab.imageUrl || 'https://via.placeholder.com/80x80?text=Cab'} 
                    alt={cab.name}
                    className="h-16 w-16 rounded-lg object-cover mr-4"
                  />
                  <div>
                    <h2 className="font-bold text-lg">{cab.name}</h2>
                    <div className="flex items-center text-sm text-gray-600">
                      <FaUsers className="mr-1" />
                      <span>{cab.seatingCapacity} Seats</span>
                      <FaSuitcase className="ml-2 mr-1" />
                      <span>{cab.luggageCapacity} Bags</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-3">{cab.description}</p>
                <div className="flex justify-between items-center text-sm">
                  <div className="text-gray-600">
                    <span className="font-medium">Distance:</span> {distance || 0} km
                  </div>
                  <div className="text-gray-600">
                    <span className="font-medium">Rate:</span> ₹{cab.extraFarePerKm || 0}/km
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <div className="text-xl font-bold text-blue-600 flex items-center">
                    <FaRupeeSign className="text-sm" />
                    {getCabPrice(cab)}
                  </div>
                  <button
                    onClick={(e) => handleCabBooking(e, cab)}
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Book Now
                  </button>
                </div>
              </div>
              
              {/* Desktop View - Vertical Card Style */}
              <div className="hidden md:block p-6 w-full h-full flex flex-col">
                {/* Car Image */}
                <div className="flex justify-center mb-4">
                  <img 
                    src={cab.imageUrl || 'https://via.placeholder.com/400x250?text=Cab'} 
                    alt={cab.name}
                    className="h-48 w-auto object-cover rounded-lg shadow-md"
                  />
                </div>
                
                {/* Price */}
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-blue-600 flex items-center justify-center">
                    <FaRupeeSign className="text-2xl" />
                    <span>{getCabPrice(cab)}</span>
                  </div>
                </div>
                
                {/* Cab Type & Model */}
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold uppercase mb-1">{cab.name}</h2>
                  <p className="text-gray-600">{cab.description} <span className="font-medium">({cab.acType})</span></p>
                </div>
                
                {/* Features Section */}
                <div className="border-t border-gray-200 pt-4 pb-2">
                  {/* Included Km */}
                  <div className="flex justify-between mb-3">
                    <div className="text-gray-600 font-medium">Distance</div>
                    <div className="font-semibold">{distance || 0} km</div>
                  </div>
                  
                  {/* Extra Fare */}
                  <div className="flex justify-between mb-3">
                    <div className="text-gray-600 font-medium">Extra fare/Km</div>
                    <div className="font-semibold">₹ {cab.extraFarePerKm || 0}/Km</div>
                  </div>
                  
                  {/* Included Km */}
                  <div className="flex justify-between mb-3">
                    <div className="text-gray-600 font-medium">Included Km</div>
                    <div className="font-semibold">{cab.includedKm || 0} km</div>
                  </div>
                  
                  {/* Fuel Charges */}
                  <div className="flex justify-between mb-3">
                    <div className="text-gray-600 font-medium">Fuel Charges</div>
                    <div className="font-semibold">{cab.fuelChargesIncluded ? 'Included' : 'Extra'}</div>
                  </div>
                  
                  {/* Driver Charges */}
                  <div className="flex justify-between mb-3">
                    <div className="text-gray-600 font-medium">Driver Charges</div>
                    <div className="font-semibold">{cab.driverChargesIncluded ? 'Included' : 'Extra'}</div>
                  </div>
                  
                  {/* Night Charges */}
                  <div className="flex justify-between mb-4">
                    <div className="text-gray-600 font-medium">Night Charges</div>
                    <div className="font-semibold">{cab.nightChargesIncluded ? 'Included' : 'Extra'}</div>
                  </div>
                </div>
                
                {/* Book Now Button */}
                <div className="mt-auto pt-4">
                  <button
                    onClick={(e) => handleCabBooking(e, cab)}
                    className="bg-blue-600 text-white py-3 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors w-full flex items-center justify-center"
                  >
                    <span className="mr-2">Book Now</span>
                    <FaArrowRight />
                  </button>
                </div>
                
                {/* Cab Location */}
                {cab.vehicleLocation && (
                  <div className="flex items-center justify-center text-sm text-gray-600 mt-3">
                    <FaMapMarkerAlt className="mr-1 text-red-500" />
                    <span>Located in {cab.vehicleLocation}</span>
                  </div>
                )}
              </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Display error if any */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {/* Trip summary has been moved to the top header */}

      {selectedCab && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-md border-t p-4 z-10">
          <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center mb-4 sm:mb-0">
              <img 
                src={selectedCab.imageUrl || 'https://via.placeholder.com/80x80?text=Cab'}
                alt={selectedCab.name}
                className="w-16 h-16 rounded-lg object-cover mr-4"
              />
              <div>
                <h3 className="font-bold text-lg">{selectedCab.name}</h3>
                <p className="text-gray-600">{fromCity} → {toCity}</p>
                {selectedCab.vehicleLocation && (
                  <p className="text-sm text-gray-500">Pickup from: {selectedCab.vehicleLocation}</p>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <div className="mr-6">
                <p className="text-gray-600">Total Fare</p>
                <p className="text-2xl font-bold text-blue-600">₹{cabPrices[selectedCab._id] || selectedCab.baseKmPrice}</p>
              </div>
              <button
                onClick={handleBookNow}
                className="bg-blue-600 text-white py-3 px-8 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarSelection;
