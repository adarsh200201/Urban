import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaChevronDown, FaChevronUp, FaClock, FaCalendarAlt, FaExchangeAlt } from 'react-icons/fa';
import { MdArrowForwardIos } from 'react-icons/md';
import { getDistanceBetweenCities, calculatePricesByDistance, getEstimatedTime } from '../utils/distanceCalculator';
import axios from 'axios';

const RoundTrip = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [cities, setCities] = useState([]);

  // API URLs
  // Import API URL from config
  const { API_URL } = require('../config/apiConfig');

  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  };

  // Get tomorrow's date for min date attribute
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
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
  const [departureDate, setDepartureDate] = useState(getCurrentDate());
  const [departureTime, setDepartureTime] = useState('10:00');
  const [returnDate, setReturnDate] = useState(getTomorrowDate());
  const [returnTime, setReturnTime] = useState('10:00');
  const [distance, setDistance] = useState(1122);
  const [availableCabs, setAvailableCabs] = useState([]);
  const [selectedCabId, setSelectedCabId] = useState(null);
  const [showDetails, setShowDetails] = useState({});
  const [selectedPriceOption, setSelectedPriceOption] = useState('bestPrice'); // 'bestPrice' or 'inclusivePrice'
  
  // Generate time options
  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      timeOptions.push(`${formattedHour}:${formattedMinute}`);
    }
  }

  // Extract query parameters from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const from = params.get('from');
    const to = params.get('to');
    const deptDate = params.get('departureDate');
    const deptTime = params.get('departureTime');
    const retDate = params.get('returnDate');
    const retTime = params.get('returnTime');
    
    if (from) setFromCity(from);
    if (to) setToCity(to);
    if (deptDate) setDepartureDate(deptDate);
    if (deptTime) setDepartureTime(deptTime);
    if (retDate) setReturnDate(retDate);
    if (retTime) setReturnTime(retTime);
    
    if (from && to && deptDate && retDate) {
      fetchRouteDetails(from, to, deptDate, retDate);
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
          const basePrice = cab.baseKmPrice || cab.basePrice || 2000;
          const discountedPrice = Math.round(basePrice * 0.9); // 10% discount
          const bestPrice = Math.round(basePrice * 0.85);      // 15% discount
          
          // Calculate taxes
          const gstAmount = Math.round(bestPrice * 0.05);       // 5% GST
          const tollTaxAmount = Math.round(basePrice * 0.03);   // 3% toll tax
          const stateTaxAmount = Math.round(basePrice * 0.04);  // 4% state tax
          
          // Calculate all-inclusive price
          const taxInclusivePrice = bestPrice + gstAmount;
          const allInclusivePrice = taxInclusivePrice + tollTaxAmount + stateTaxAmount;
          
          // For round trips, we multiply by 1.8
          const multiplier = 1.8;
          
          return {
            id: cab._id,
            name: cab.name,
            description: cab.description,
            category: cab.category || 'sedan',
            basePrice: Math.round(basePrice * multiplier),
            discountedPrice: Math.round(discountedPrice * multiplier),
            bestPrice: Math.round(bestPrice * multiplier),
            taxInclusivePrice: Math.round(taxInclusivePrice * multiplier),
            allInclusivePrice: Math.round(allInclusivePrice * multiplier),
            discount: 10,
            bestDiscount: 15,
            includedKm: (cab.includedKm || 100) * 2, // Double for round trip
            extraKmFare: cab.extraFarePerKm || cab.perKMCharge || 12,
            capacity: cab.seatingCapacity || cab.capacity || 4,
            luggage: cab.luggageCapacity || cab.luggage || 2,
            imageUrl: cab.imageUrl || 'https://via.placeholder.com/300x200?text=Cab+Image',
            features: cab.features || [],
            fuelIncluded: cab.fuelChargesIncluded || true,
            driverIncluded: cab.driverChargesIncluded || true,
            nightIncluded: cab.nightChargesIncluded || true,
            active: cab.active || true,
            gstAmount: Math.round(gstAmount * multiplier),
            tollTaxAmount: Math.round(tollTaxAmount * multiplier),
            stateTaxAmount: Math.round(stateTaxAmount * multiplier),
            roundTripMultiplier: multiplier
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
  const fetchRouteDetails = async (from, to, deptDate, retDate) => {
    setIsLoading(true);
    
    try {
      // Calculate the distance between cities using our utility
      const calculatedDistance = getDistanceBetweenCities(from, to);
      setDistance(calculatedDistance);
      
      // Calculate estimated travel time
      const estimatedHours = getEstimatedTime(calculatedDistance);
      
      // Fetch available cabs for the round trip route
      const routeData = {
        journeyType: 'roundTrip',
        pickupLocation: from,
        dropLocation: to,
        departureDate: deptDate,
        departureTime: departureTime,
        returnDate: retDate,
        returnTime: returnTime,
        distance: calculatedDistance
      };
      
      // Try to get real data from API if available
      try {
        const response = await axios.post(`${API_URL}/cab/available`, routeData);
        
        if (response.data.success) {
          // Process the real data from API
          const cabs = response.data.data.map(cab => {
            // Get dynamic pricing based on distance and cab model
            const pricing = calculatePricesByDistance(calculatedDistance, cab, 'roundTrip');
            
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
          const pricing = calculatePricesByDistance(calculatedDistance, cab, 'roundTrip');
          
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
    if (!fromCity || !toCity || !departureDate || !returnDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (fromCity === toCity) {
      toast.error('Pickup and drop locations cannot be the same');
      return;
    }
    
    // Validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deptDate = new Date(departureDate);
    const retDate = new Date(returnDate);
    
    if (deptDate < today) {
      toast.error('Departure date cannot be in the past');
      return;
    }
    
    if (retDate < deptDate) {
      toast.error('Return date cannot be before departure date');
      return;
    }
    
    // Update URL with search parameters
    navigate(`/city/round-trip-cab?from=${fromCity}&to=${toCity}&departureDate=${departureDate}&departureTime=${departureTime}&returnDate=${returnDate}&returnTime=${returnTime}`);
    fetchRouteDetails(fromCity, toCity, departureDate, returnDate);
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
    navigate(`/booking-confirmation?from=${fromCity}&to=${toCity}&cabId=${selectedCabId}&type=roundtrip&departureDate=${departureDate}&departureTime=${departureTime}&returnDate=${returnDate}&returnTime=${returnTime}`);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="container mx-auto px-4 py-8">
        {/* Back button and trip info */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <a href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-2">
              <FaArrowLeft className="mr-1" />
              <span className="font-medium">BACK</span>
            </a>
            
            <div className="mt-4">
              <h2 className="text-xl font-bold">{fromCity || 'Your City'} to {toCity || 'Destination'} Round Trip</h2>
              <div className="flex items-center mt-1">
                <div className="text-sm bg-blue-600 text-white px-2 py-0.5 rounded mr-2">Round Trip</div>
                <div className="flex items-center text-sm text-gray-600">
                  <FaCalendarAlt className="mr-1" />
                  <span>Departure: {departureDate}</span>
                </div>
                <div className="ml-2 text-sm text-gray-600">
                  <FaClock className="inline-block mr-1" />
                  {departureTime}
                </div>
              </div>
              <div className="flex items-center mt-1">
                <div className="flex items-center text-sm text-gray-600 ml-24">
                  <FaCalendarAlt className="mr-1" />
                  <span>Return: {returnDate}</span>
                </div>
                <div className="ml-2 text-sm text-gray-600">
                  <FaClock className="inline-block mr-1" />
                  {returnTime}
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <button 
              onClick={() => navigate('/')}
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <span className="font-medium">NEW SEARCH</span>
            </button>
          </div>
        </div>

        {/* Date/Time edit section */}
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departure</label>
                <div className="grid grid-cols-5 gap-2">
                  <div className="col-span-3">
                    <input 
                      type="date" 
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      min={getTomorrowDate()}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <select
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {timeOptions.map(time => (
                        <option key={`dept-${time}`} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Return</label>
                <div className="grid grid-cols-5 gap-2">
                  <div className="col-span-3">
                    <input 
                      type="date" 
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      min={departureDate}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <select
                      value={returnTime}
                      onChange={(e) => setReturnTime(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {timeOptions.map(time => (
                        <option key={`ret-${time}`} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <button 
              onClick={handleSearch}
              className="w-full md:w-auto bg-blue-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-blue-700 transition duration-200"
            >
              Update Search
            </button>
          </div>
        </div>

        {/* Results section */}
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
          <h3 className="text-xl font-semibold mb-4">Available Cabs for Round Trip</h3>
          
          {/* Price Toggle Buttons - Outside card listings */}
          {availableCabs.length > 0 && (
            <div className="max-w-xl mx-auto my-4">
              <div className="flex border rounded-lg overflow-hidden mb-4 shadow-sm">
                <button
                  onClick={() => setSelectedPriceOption('bestPrice')}
                  className={`flex-1 py-3 text-sm font-medium text-center transition-colors duration-200 ${selectedPriceOption === 'bestPrice' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Best Price
                </button>
                <button
                  onClick={() => setSelectedPriceOption('inclusivePrice')}
                  className={`flex-1 py-3 text-sm font-medium text-center transition-colors duration-200 ${selectedPriceOption === 'inclusivePrice' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Toll & State Tax Inclusive
                </button>
              </div>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {availableCabs.map(cab => (
                <div key={cab.id} className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-3">
                      <div>
                        <h3 className="text-lg font-bold">{cab.name}</h3>
                        <p className="text-sm text-gray-600">{cab.description}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <img 
                          src={cab.imageUrl} 
                          alt={cab.name}
                          className="w-24 h-16 object-cover rounded-lg" 
                        />
                      </div>
                    </div>
                    
                    {/* Price Section based on selected option */}
                    <div className="mt-4">
                      {selectedPriceOption === 'bestPrice' && (
                        <div className="p-3 md:p-4 bg-blue-50 border border-blue-100 rounded-lg">
                          <div className="flex flex-wrap justify-between items-center mb-1">
                            <span className="font-medium text-blue-800">Best Price</span>
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{cab.bestDiscount || 15}% OFF</span>
                          </div>
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="text-xl md:text-2xl font-bold text-blue-600">₹{cab.bestPrice ? cab.bestPrice.toFixed(2) : (cab.basePrice * 0.85).toFixed(2)}</span>
                            <span className="line-through text-sm text-gray-500">₹{cab.basePrice.toFixed(2)}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">+ 5% GST extra</div>
                          <div className="text-xs text-blue-600 mt-1">₹{cab.perKmRate || (cab.extraKmFare || 12)}/km x {distance*2}km (round trip)</div>
                        </div>
                      )}
                      
                      {selectedPriceOption === 'inclusivePrice' && (
                        <div className="p-3 md:p-4 bg-green-50 border border-green-100 rounded-lg">
                          <div className="flex flex-wrap justify-between items-center mb-1">
                            <span className="font-medium text-green-800 text-sm md:text-base">Toll & State Tax Inclusive</span>
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded whitespace-nowrap ml-auto md:ml-0 mt-1 md:mt-0">All Taxes Included</span>
                          </div>
                          <div className="text-xl md:text-2xl font-bold text-green-600">₹{cab.allInclusivePrice ? cab.allInclusivePrice.toFixed(2) : (cab.bestPrice * 1.12).toFixed(2)}</div>
                          <div className="text-xs text-green-600 mt-1">GST + Toll Tax + State Tax Included</div>
                          <div className="text-xs text-green-600 mt-1">Approx {cab.estimatedTime ? (cab.estimatedTime * 2) : Math.ceil(distance/30)}hrs round trip</div>
                        </div>
                      )}
                    </div>
                    
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        <div>✓ Fuel charges included</div>
                        <div>✓ Driver charges included</div>
                        <div>✓ {distance}km each way ({distance*2}km total)</div>
                        <div>✓ Rate: {cab.perKmRate || (cab.extraKmFare || 12)}/km</div>
                      </div>
                      <div className="mt-2 font-medium">Toll & State Tax Inclusive benefits:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        <div>✓ Toll taxes (both ways)</div>
                        <div>✓ State border permits</div>
                        <div>✓ All taxes bundled</div>
                        <div>✓ No hidden charges</div>
                      </div>
                    </div>
                    
                    {/* Toggle Details Button */}
                    <div className="mt-3 flex items-center justify-between">
                      <button
                        onClick={() => toggleDetails(cab.id)}
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        {showDetails[cab.id] ? "Hide Details" : "Show Details"} 
                        {showDetails[cab.id] ? <FaChevronUp className="ml-1" /> : <FaChevronDown className="ml-1" />}
                      </button>
                    </div>
                    
                    {/* Extra Details */}
                    {showDetails[cab.id] && (
                      <div className="mt-3 text-sm text-gray-600 border-t pt-3">
                        <div className="mb-2">
                          <div className="font-medium">Price Breakdown:</div>
                          <ul className="list-disc pl-4 mt-1 text-gray-600">
                            <li>Best Price: ₹{cab.bestPrice ? cab.bestPrice.toFixed(2) : (cab.basePrice * 0.85).toFixed(2)}</li>
                            <li>GST (5%): ₹{cab.gstAmount ? cab.gstAmount.toFixed(2) : Math.round(cab.bestPrice * 0.05).toFixed(2)}</li>
                            <li>Toll Tax (3%): ₹{cab.tollTaxAmount ? cab.tollTaxAmount.toFixed(2) : Math.round(cab.basePrice * 0.03).toFixed(2)}</li>
                            <li>State Tax (4%): ₹{cab.stateTaxAmount ? cab.stateTaxAmount.toFixed(2) : Math.round(cab.basePrice * 0.04).toFixed(2)}</li>
                          </ul>
                          
                          <div className="font-medium mt-2">Terms & Conditions:</div>
                          <ul className="list-disc pl-4 mt-1 text-gray-600">
                            <li>Toll & State Tax Inclusive option includes all taxes and fees</li>
                            <li>Parking charges, if any, are extra and need to be paid by you as per actuals</li>
                            <li>Driver allowance is included for the entire round trip</li>
                            <li>Return journey is included in the price (approximately {cab.roundTripMultiplier || 1.8}x one-way fare)</li>
                          </ul>
                        </div>
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">Cancellation charges may apply if cancelled less than 24 hours before departure.</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Book Now Button */}
                    <div className="mt-4">
                      <button
                        onClick={() => handleBookNow()}
                        className="w-full py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition duration-200 flex items-center justify-center"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {availableCabs.length === 0 && !isLoading && (
                <div className="bg-white rounded-xl p-8 text-center border">
                  <p className="text-lg text-gray-600">No cabs available for this route. Please try another route or date.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoundTrip;
