import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaChevronDown, FaChevronUp, FaClock, FaCalendarAlt, FaExchangeAlt } from 'react-icons/fa';
import { MdArrowForwardIos } from 'react-icons/md';
import { getDistanceBetweenCities, calculatePricesByDistance, getEstimatedTime } from '../utils/distanceCalculator';
import { checkFixedRoute } from '../services/routesService';

import axios from 'axios';

const OneWay = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [cities, setCities] = useState([]);

  // API URLs - Updated to use port 5000
  // Import API URL from config
  const { API_URL } = require('../config/apiConfig');

  // Get current date in DD-MMM-YYYY format
  const getCurrentDate = () => {
    const date = new Date();
    const day = date.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // State for cab options from API
  const [cabOptions, setCabOptions] = useState([]);

  // Fetch cities on component mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await axios.get(`${API_URL}/city`);
        if (response.data.success) {
          setCities(response.data.data);
        } else {
          toast.error('Failed to fetch cities');
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
        toast.error('Error loading cities. Please try again.');
      }
    };

    fetchCities();
  }, []);

  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [distance, setDistance] = useState(1122);
  const [availableCabs, setAvailableCabs] = useState([]);
  const [selectedCabId, setSelectedCabId] = useState(null);
  const [departureDate, setDepartureDate] = useState(getCurrentDate());
  const [departureTime, setDepartureTime] = useState('6:00 AM');
  const [showDetails, setShowDetails] = useState({});
  const [selectedPriceOption, setSelectedPriceOption] = useState('bestPrice'); // 'bestPrice' or 'inclusivePrice'
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [isFixedRoute, setIsFixedRoute] = useState(false);
  const [fixedRouteData, setFixedRouteData] = useState(null);

  // Extract query parameters from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const from = params.get('from');
    const to = params.get('to');

    if (from) setFromCity(from);
    if (to) setToCity(to);

    if (from && to) {
      fetchRouteDetails(from, to);
    } else {
      // If no query params, fetch default cab options
      fetchCabOptions();
    }
  }, [location]);

  // Fetch all available cab types
  const fetchCabOptions = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/cab/types`);
      if (response.data.success) {
        // Format the cab data for our use with full pricing details
        const cabs = response.data.data.map(cab => {
          // Calculate initial pricing
          const basePrice = cab.baseKmPrice || 2000;
          const discountedPrice = Math.round(basePrice * 0.9); // 10% discount
          const bestPrice = Math.round(basePrice * 0.85);      // 15% discount
          
          // Calculate taxes
          const gstAmount = Math.round(bestPrice * 0.05);       // 5% GST
          const tollTaxAmount = Math.round(basePrice * 0.03);   // 3% toll tax
          const stateTaxAmount = Math.round(basePrice * 0.04);  // 4% state tax
          
          // Calculate all-inclusive price
          const taxInclusivePrice = bestPrice + gstAmount;
          const allInclusivePrice = taxInclusivePrice + tollTaxAmount + stateTaxAmount;
          
          return {
            id: cab._id,
            name: cab.name,
            description: cab.description,
            category: cab.category || 'sedan',
            basePrice: basePrice,
            discountedPrice: discountedPrice,
            bestPrice: bestPrice,
            taxInclusivePrice: taxInclusivePrice,
            allInclusivePrice: allInclusivePrice,
            discount: 10,
            bestDiscount: 15,
            includedKm: cab.includedKm || 100,
            extraKmFare: cab.extraFarePerKm || 0,
            capacity: cab.seatingCapacity || 4,
            luggage: cab.luggageCapacity || 2,
            imageUrl: cab.imageUrl || 'https://via.placeholder.com/300x200?text=Cab+Image',
            fuelIncluded: cab.fuelChargesIncluded || true,
            driverIncluded: cab.driverChargesIncluded || true,
            nightIncluded: cab.nightChargesIncluded || true,
            active: cab.active || true,
            gstAmount,
            tollTaxAmount,
            stateTaxAmount
          };
        });
        setCabOptions(cabs);
        setAvailableCabs(cabs.filter(cab => cab.active));
      } else {
        toast.error('Failed to fetch cab options');
      }
    } catch (error) {
      console.error('Error fetching cab options:', error);
      toast.error('Error loading cab options. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch route details (distance, estimated time)
  const fetchRouteDetails = async (from, to) => {
    setIsLoading(true);
    setIsFixedRoute(false);
    setFixedRouteData(null);

    try {
      // First, check if this is a fixed route
      if (from && to) {
        // Find the city IDs based on names
        const fromCityObj = cities.find(city => city.name.toLowerCase() === from.toLowerCase());
        const toCityObj = cities.find(city => city.name.toLowerCase() === to.toLowerCase());
        
        if (fromCityObj && toCityObj) {
          // Check for fixed route
          const fixedRoutes = await checkFixedRoute(fromCityObj._id, toCityObj._id);
          
          if (fixedRoutes && fixedRoutes.length > 0) {
            // We have fixed routes!
            setIsFixedRoute(true);
            setFixedRouteData(fixedRoutes);
            
            // Set distance and estimated time from fixed route
            setDistance(fixedRoutes[0].distance);
            setEstimatedTime(fixedRoutes[0].estimatedTime);
            
            // Process the fixed route data to match our cab options format
            const fixedCabs = fixedRoutes.map(route => {
              const cabDetails = route.cabType;
              
              return {
                id: cabDetails._id,
                name: cabDetails.name,
                description: cabDetails.description || 'Fixed route cab',
                category: cabDetails.category || 'sedan',
                basePrice: route.price,
                discountedPrice: route.price, // Same price for fixed routes
                bestPrice: route.price,
                taxInclusivePrice: route.price, // Tax included in fixed price
                allInclusivePrice: route.price, // All inclusive price
                discount: 0, // No discount for fixed routes
                bestDiscount: 0,
                includedKm: route.distance,
                extraKmFare: 0, // No extra km charges for fixed routes
                capacity: cabDetails.seatingCapacity || 4,
                luggage: cabDetails.luggageCapacity || 2,
                imageUrl: cabDetails.imageUrl || 'https://via.placeholder.com/300x200?text=Cab+Image',
                fuelIncluded: true,
                driverIncluded: true,
                nightIncluded: true,
                active: true,
                isFixedRoute: true,
                fixedRouteId: route._id,
                estimatedTime: route.estimatedTime
              };
            });
            
            setAvailableCabs(fixedCabs);
            
            if (fixedCabs.length > 0) {
              setSelectedCabId(fixedCabs[0].id);
            }
            
            setIsLoading(false);
            return;
          }
        }
      }
      
      // If not a fixed route, continue with dynamic pricing
      const calculatedDistance = getDistanceBetweenCities(from, to);
      setDistance(calculatedDistance);

      // Fetch available cabs for the route
      const routeData = {
        journeyType: 'oneWay',
        pickupLocation: from,
        dropLocation: to,
        distance: calculatedDistance
      };

      // Try to get real data from API if available
      try {
        const response = await axios.post(`${API_URL}/cab/available`, routeData);

        if (response.data.success) {
          // Process the real data from API
          const cabs = response.data.data.map(cab => {
            // Get dynamic pricing based on distance and cab model
            const pricing = calculatePricesByDistance(calculatedDistance, cab, 'oneWay');

            return {
              id: cab._id,
              name: cab.name,
              description: cab.description,
              category: cab.category || 'sedan',
              basePrice: pricing.basePrice,
              discountedPrice: pricing.discountedPrice,
              bestPrice: pricing.bestPrice,
              taxInclusivePrice: pricing.taxInclusivePrice,
              discount: pricing.discount,
              bestDiscount: pricing.bestDiscount,
              includedKm: pricing.includedKm,
              extraKmFare: pricing.extraKmFare,
              perKmRate: pricing.perKmRate,
              estimatedTime: pricing.estimatedTime,
              capacity: cab.seatingCapacity || cab.capacity || 4,
              luggage: cab.luggageCapacity || cab.luggage || 2,
              imageUrl: cab.imageUrl || 'https://via.placeholder.com/300x200?text=Cab+Image',
              fuelIncluded: cab.fuelChargesIncluded || true,
              driverIncluded: cab.driverChargesIncluded || true,
              nightIncluded: cab.nightChargesIncluded || true,
              active: cab.active || true
            };
          });

          setAvailableCabs(cabs.filter(cab => cab.active));

          if (cabs.length > 0) {
            setSelectedCabId(cabs[0].id);
          }
        } else {
          throw new Error('API call successful but returned failure status');
        }
      } catch (apiError) {
        console.log('API call failed, using local calculations', apiError);
        // If API call fails, calculate locally using our cab options
        const adjustedCabs = cabOptions.map(cab => {
          // Calculate dynamic pricing based on distance and cab model
          const pricing = calculatePricesByDistance(calculatedDistance, cab, 'oneWay');

          return {
            ...cab,
            basePrice: pricing.basePrice,
            discountedPrice: pricing.discountedPrice,
            bestPrice: pricing.bestPrice,
            taxInclusivePrice: pricing.taxInclusivePrice,
            discount: pricing.discount,
            bestDiscount: pricing.bestDiscount,
            includedKm: pricing.includedKm,
            extraKmFare: pricing.extraKmFare,
            perKmRate: pricing.perKmRate,
            estimatedTime: pricing.estimatedTime
          };
        });

        setAvailableCabs(adjustedCabs.filter(cab => cab.active));

        if (adjustedCabs.length > 0) {
          setSelectedCabId(adjustedCabs[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching route details:', error);
      toast.error('Error getting route details. Please try again later.');
      // Fallback to default cab options
      fetchCabOptions();
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle showing details for a cab
  const toggleDetails = (cabId) => {
    setShowDetails(prev => ({
      ...prev,
      [cabId]: !prev[cabId]
    }));
  };

  const handleSearch = () => {
    if (!fromCity || !toCity) {
      toast.error('Please select both pickup and drop locations');
      return;
    }

    if (fromCity === toCity) {
      toast.error('Pickup and drop locations cannot be the same');
      return;
    }

    // Update URL with search parameters
    navigate(`/city/one-way-cab?from=${fromCity}&to=${toCity}`);
    fetchRouteDetails(fromCity, toCity);
  };

  const handleCitySwap = () => {
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
  };

  const handleBookNow = () => {
    if (!selectedCabId) {
      toast.error('Please select a cab');
      return;
    }

    // Navigate to booking confirmation page
    navigate(`/booking-confirmation?from=${fromCity}&to=${toCity}&cabId=${selectedCabId}&type=oneway`);
  };

  // Handle price option change
  const handlePriceOptionChange = (option) => {
    // Only allow changing price option if not a fixed route
    if (!isUsingFixedPricing()) {
      setSelectedPriceOption(option);
    } else {
      toast.info('Price options cannot be changed for fixed routes');
    }
  };

  // Handler for selecting a different cab
  const handleCabSelect = (cabId) => {
    setSelectedCabId(cabId);
  };

  // Function to check if we're using fixed pricing
  const isUsingFixedPricing = () => {
    return isFixedRoute && fixedRouteData && fixedRouteData.length > 0;
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-6 md:pb-12 mt-50">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8  mt-50">
        {/* Back button and trip info */}
        <div className="flex flex-col sm:flex-row items-start justify-between mb-4 sm:mb-6">
          <div>
            <a href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-2  mt-50">
              <FaArrowLeft className="mr-1" />
              <span className="font-medium">BACK</span>
            </a>
            <div className="mt-4">
              <div className="flex items-center text-xl md:text-2xl font-bold text-gray-800">
                <span>{fromCity || 'Delhi'}</span>
                <button
                  className="mx-2 text-blue-600 hover:text-blue-800"
                  onClick={handleCitySwap} // define this function to swap cities
                  title="Swap Cities"
                >
                  <FaExchangeAlt />
                </button>
                <span className="flex items-center">
                  <MdArrowForwardIos className="mx-1 text-gray-500" />
                  {toCity || 'Mumbai'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
                <div className="bg-blue-600 text-white px-3 py-1 rounded-full">
                  One Way Trip
                </div>
                <div className="flex items-center text-gray-600">
                  <FaClock className="mr-1 text-blue-500" />
                  <span className="font-medium">Departure:</span>
                  <span className="ml-1">{departureDate}</span>
                </div>
                <div className="text-gray-600">
                  <span className="font-medium">Time:</span> {departureTime}
                </div>
              </div>
            </div>
          </div>

          {/* Search form - only show when clicked on NEW SEARCH or initially needed */}
          {(fromCity === '' || toCity === '') && (
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-4 sm:mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="fromCity" className="block text-sm font-medium text-gray-700">
                    From City
                  </label>
                  <select
                    id="fromCity"
                    value={fromCity}
                    onChange={(e) => setFromCity(e.target.value)}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select City</option>
                    {cities.map(city => (
                      <option key={city.name} value={city.name}>{city.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="toCity" className="block text-sm font-medium text-gray-700">
                    To City
                  </label>
                  <select
                    id="toCity"
                    value={toCity}
                    onChange={(e) => setToCity(e.target.value)}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select City</option>
                    {cities.map(city => (
                      <option key={city.name} value={city.name}>{city.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1 flex items-center justify-center">
                  <button
                    onClick={handleSearch}
                    className="px-6 py-2 mt-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition duration-200 w-full"
                  >
                    Search Cabs
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Available Cabs */}
        <div className="text-center mt-6">
          <h3 className="text-2xl font-semibold text-gray-800">Available Cabs</h3>
          
          {/* Price Toggle Buttons - Outside card listings */}
          {availableCabs.length > 0 && (
            <div className="max-w-xl mx-auto my-4">
              <div className="flex border rounded-lg overflow-hidden mb-4 shadow-sm">
                <button
                  onClick={() => handlePriceOptionChange('bestPrice')}
                  className={`flex-1 py-3 text-sm font-medium text-center transition-colors duration-200 ${selectedPriceOption === 'bestPrice' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Best Price
                </button>
                <button
                  onClick={() => handlePriceOptionChange('inclusivePrice')}
                  className={`flex-1 py-3 text-sm font-medium text-center transition-colors duration-200 ${selectedPriceOption === 'inclusivePrice' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Toll & State Tax Inclusive
                </button>
              </div>
            </div>
          )}
          <div className="mt-4 grid grid-cols-3 gap-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : availableCabs.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border">
                <p className="text-lg text-gray-600">No cabs available for this route. Please try another route or date.</p>
              </div>
            ) : (
              availableCabs.map(cab => (
                <div
                  key={cab.id}
                  className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-4 md:p-6">
                    <div className="mt-3">
                      <div className="flex-shrink-0">
                        <img 
                          src={cab.imageUrl} 
                          alt={cab.name}
                          className="w-24 h-16 object-cover rounded-lg" 
                        />
                      </div>
                      {selectedPriceOption === 'bestPrice' && (
                        <div className="p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="flex flex-wrap justify-between items-center mb-1">
                            <span className="font-medium text-blue-800">Best Price</span>
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{cab.bestDiscount || 15}% OFF</span>
                          </div>
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="text-xl md:text-2xl font-bold text-blue-600">₹{cab.bestPrice ? cab.bestPrice.toFixed(2) : (cab.basePrice * 0.85).toFixed(2)}</span>
                            <span className="line-through text-sm text-gray-500">₹{cab.basePrice.toFixed(2)}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">+ 5% GST extra</div>
                        </div>
                      )}
                      
                      {selectedPriceOption === 'inclusivePrice' && (
                        <div className="p-3 md:p-4 bg-green-50 rounded-lg border border-green-100">
                          <div className="flex flex-wrap justify-between items-center mb-1">
                            <span className="font-medium text-green-800 text-sm md:text-base">Toll & State Tax Inclusive</span>
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded whitespace-nowrap ml-auto md:ml-0 mt-1 md:mt-0">All Taxes Included</span>
                          </div>
                          <div className="text-xl md:text-2xl font-bold text-green-600">₹{cab.allInclusivePrice ? cab.allInclusivePrice.toFixed(2) : (cab.bestPrice * 1.12).toFixed(2)}</div>
                          <div className="text-xs text-green-600 mt-1">GST + Toll Tax + State Tax Included</div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-row sm:flex-row justify-between items-start mb-4 gap-3">
                      <div className="flex flex-col">
                        <h3 className="text-lg font-bold">{cab.name}</h3>
                        <p className="text-sm text-gray-600">{cab.description || "Spacious SUV ideal for long distance travel"}</p>
                      </div>
                    </div>
                    {/* Price Section based on selected option */}
                   
                    
                    {/* Cab Details */}
                    <div className="mt-4 text-sm text-gray-600">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="text-gray-600">Capacity</div>
                          <div className="font-medium">{cab.capacity} people</div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="text-gray-600">Luggage</div>
                          <div className="font-medium">{cab.luggage} bags</div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="text-gray-600">Included km</div>
                          <div className="font-medium">{cab.includedKm} km</div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="text-gray-600">Extra km fare</div>
                          <div className="font-medium">₹{cab.extraKmFare}/km</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Features */}
                    <div className="mt-3 text-sm text-green-600">
                      <div>✓ Fuel charges included</div>
                      <div>✓ Driver charges included</div>
                      <div>✓ {distance}km journey, approx {cab.estimatedTime || Math.ceil(distance/60)}hrs</div>
                      <div>✓ ₹{cab.perKmRate || cab.extraKmFare} per km rate</div>
                      <div className="mt-1 font-medium">Choose All-Inclusive option to include:</div>
                      <div>✓ Toll taxes for entire journey</div>
                      <div>✓ State permit/taxes</div>
                    </div>
                    
                    {/* Toggle Details Button */}
                    <div className="mt-3 flex items-center justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDetails(cab.id);
                        }}
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        {showDetails[cab.id] ? "Hide Details" : "Show Details"} 
                        {showDetails[cab.id] ? <FaChevronUp className="ml-1" /> : <FaChevronDown className="ml-1" />}
                      </button>
                    </div>
                    
                    {/* Extra Details */}
                    {showDetails[cab.id] && (
                      <div className="mt-3 text-sm text-gray-600 border-t pt-3">
                        {cab.features && cab.features.length > 0 && (
                          <div className="mb-2">
                            <div className="font-medium">Features:</div>
                            <ul className="list-disc pl-4 mt-1">
                              {cab.features.map((feature, idx) => (
                                <li key={idx}>{feature}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">Price Breakdown:</p>
                          <ul className="list-disc pl-4 text-xs text-gray-500">
                            <li>Best Price: ₹{cab.bestPrice ? cab.bestPrice.toFixed(2) : (cab.basePrice * 0.85).toFixed(2)}</li>
                            <li>GST (5%): ₹{cab.gstAmount ? cab.gstAmount.toFixed(2) : Math.round(cab.bestPrice * 0.05).toFixed(2)}</li>
                            <li>Toll Tax (3%): ₹{cab.tollTaxAmount ? cab.tollTaxAmount.toFixed(2) : Math.round(cab.basePrice * 0.03).toFixed(2)}</li>
                            <li>State Tax (4%): ₹{cab.stateTaxAmount ? cab.stateTaxAmount.toFixed(2) : Math.round(cab.basePrice * 0.04).toFixed(2)}</li>
                            <li>Parking charges, if any, are extra.</li>
                          </ul>
                        </div>
                      </div>
                    )}
                    
                    {/* Book Now Button */}
                    <div className="mt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookNow();
                        }}
                        className="w-full py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition duration-200 flex items-center justify-center"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OneWay;
