import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Slider from 'react-slick';
import { FaCalendarAlt, FaClock, FaTaxi, FaShieldAlt, FaUserTie, FaRupeeSign, FaPhoneAlt, FaPlus } from 'react-icons/fa';
import axios from 'axios';

// Custom components
import LocationInput from '../components/LocationInput';

// Components and Redux actions
import { updateBookingForm } from '../features/booking/bookingSlice';

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Form state
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [journeyType, setJourneyType] = useState('outstation'); // outstation, local
  const [tripType, setTripType] = useState('oneWay'); // oneWay, roundTrip
  const [multiCity, setMultiCity] = useState(false);
  const [pickupDate, setPickupDate] = useState(new Date());
  const [pickupTime, setPickupTime] = useState('10:00');
  const [returnDate, setReturnDate] = useState(new Date(new Date().setDate(new Date().getDate() + 1)));
  const [returnTime, setReturnTime] = useState('10:00');
  const [mobileNumber, setMobileNumber] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Additional cities for multi-city bookings
  const [additionalCities, setAdditionalCities] = useState([]);
  const [cityCounter, setCityCounter] = useState(1);
  
  // API data
  const [popularCities, setPopularCities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // Import API URL from config
  const { API_URL } = require('../config/apiConfig');
  
  // Fetch data from backend
  useEffect(() => {
    const fetchPopularCities = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_URL}/city/popular`);
        if (response.data && response.data.success) {
          setPopularCities(response.data.cities || []);
        }
      } catch (error) {
        console.error('Error fetching popular cities:', error);
        setPopularCities([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPopularCities();
  }, [API_URL]);

  // Slider settings for popular cities
  const citySettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1
        }
      }
    ]
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!pickup || !dropoff) {
      setErrorMessage('Please enter pickup and drop-off locations');
      return;
    }
    
    if (multiCity && additionalCities.some(city => !city.value)) {
      setErrorMessage('Please enter all via cities or remove empty ones');
      return;
    }
    
    if (!mobileNumber) {
      setErrorMessage('Please enter your mobile number');
      return;
    }
    
    // Clear any error messages
    setErrorMessage('');
    
    // Prepare booking data
    const bookingData = {
      journeyType,
      tripType,
      pickup,
      dropoff,
      pickupDate: pickupDate.toISOString(),
      pickupTime,
      returnDate: tripType === 'roundTrip' ? returnDate.toISOString() : null,
      returnTime: tripType === 'roundTrip' ? returnTime : null,
      multiCity,
      additionalCities: multiCity ? additionalCities.map(city => city.value) : [],
      mobileNumber
    };
    
    // Dispatch to Redux store
    dispatch(updateBookingForm(bookingData));
    
    // Build query parameters including via cities if needed
    let queryParams = `?from=${pickup}&to=${dropoff}`;
    
    if (multiCity && additionalCities.length > 0) {
      const viaCities = additionalCities.map(city => city.value).join(',');
      queryParams += `&via=${viaCities}`;
    }
    
    queryParams += `&date=${pickupDate.toISOString()}`;
    queryParams += `&time=${pickupTime}`;
    
    if (tripType === 'roundTrip') {
      queryParams += `&returnDate=${returnDate.toISOString()}`;
      queryParams += `&returnTime=${returnTime}`;
    }
    
    queryParams += `&journeyType=${journeyType}`;
    queryParams += `&tripType=${tripType}`;
    queryParams += `&mobile=${mobileNumber}`;
    
    // Navigate to car selection page
    navigate(`/cabs${queryParams}`);
    
    // Skip analytics tracking since API is not working
    // Just log to console for debugging
    console.log('Search data:', bookingData);
  };

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'text-yellow-500' : 'text-gray-300'}>★</span>
      );
    }
    return stars;
  };

  return (
    <div className="page-container overflow-x-hidden pt-6 sm:pt-8 md:pt-10 w-full">
      {/* Hero Section */}
      <section className="py-2 sm:py-3 md:py-4 bg-gray-50 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ 
          backgroundImage: `url(${require('../assets/images/cab-bg.webp')})`,
          opacity: '0.8',
          zIndex: 0
        }}></div>
        
        <div className="container relative z-10">
          <div className="flex flex-col items-center sm:items-start">
            <h1 className="text-2xl md:text-3xl font-bold text-yellow-400 text-center mx-auto sm:mx-0 sm:ml-4 md:ml-10 lg:ml-20 mb-2 mt-0">All India Cab Service</h1>
            
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl overflow-hidden border border-gray-200 w-[95%] sm:w-[90%] md:w-[400px] lg:w-[440px] mx-auto sm:mx-0 sm:ml-4 md:ml-10 lg:ml-15 mb-4 sm:mb-8 md:mb-10 lg:mb-50 flex flex-col relative z-10" style={{ boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}>
              {/* Main Tabs */}
              <div className="flex border-b bg-gray-50">
                <button 
                  className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 text-sm sm:text-base font-medium text-center transition-all duration-200 ${journeyType === 'outstation' ? 'bg-primary text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setJourneyType('outstation')}
                >
                  Outstation
                </button>
                <button 
                  className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 text-sm sm:text-base font-medium text-center transition-all duration-200 ${journeyType === 'local' ? 'bg-primary text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setJourneyType('local')}
                >
                  Local / Airport
                </button>
              </div>
              
              {/* Sub Tabs - Only show for Outstation */}
              {journeyType === 'outstation' && (
                <div className="flex border-b bg-gray-50">
                  <button 
                    className={`flex-1 py-2 px-4 text-sm transition-all duration-200 ${tripType === 'oneWay' ? 'text-primary font-medium border-b-2 border-primary' : 'text-gray-700 hover:text-primary'}`}
                    onClick={() => setTripType('oneWay')}
                  >
                    One Way
                  </button>
                  <button 
                    className={`flex-1 py-2 px-4 text-sm transition-all duration-200 ${tripType === 'roundTrip' ? 'text-primary font-medium border-b-2 border-primary' : 'text-gray-700 hover:text-primary'}`}
                    onClick={() => setTripType('roundTrip')}
                  >
                    Round Trip
                  </button>
                </div>
              )}
              
              {/* Booking Form */}
              <form onSubmit={handleSubmit} className="p-3 sm:p-4 text-gray-800 bg-gradient-to-br from-white to-gray-50 flex-grow">
                <div className="space-y-2">
                  {/* Pickup Location */}
                  <LocationInput
                    label="Pickup City"
                    value={pickup}
                    onChange={setPickup}
                    placeholder="Enter pickup city"
                  />
                  
                  {/* Dropoff Location */}
                  <LocationInput
                    label="Destination City"
                    value={dropoff}
                    onChange={setDropoff}
                    placeholder="Enter destination city"
                  />
                  
                  {/* Add More City Button */}
                  <div>
                    <button
                      type="button"
                      className="text-primary hover:text-primary-dark flex items-center text-sm font-medium transition-transform duration-200 hover:scale-105"
                      onClick={() => {
                        // Add a new city input field
                        const newCityId = cityCounter + 1;
                        setAdditionalCities([...additionalCities, { id: newCityId, value: '' }]);
                        setCityCounter(newCityId);
                        setMultiCity(true);
                      }}
                    >
                      <FaPlus className="mr-1.5" /> Add More City
                    </button>
                  </div>
                  
                  {/* Additional City Fields */}
                  {additionalCities.length > 0 && (
                    <div className="space-y-3 mt-3">
                      {additionalCities.map((city, index) => (
                        <div key={city.id} className="relative group">
                          <div className="flex items-center">
                            <div className="relative flex-grow">
                              <LocationInput
                                label={`Via City ${index + 1}`}
                                value={city.value}
                                onChange={(newValue) => {
                                  const updatedCities = [...additionalCities];
                                  updatedCities[index].value = newValue;
                                  setAdditionalCities(updatedCities);
                                }}
                                placeholder="Enter via city"
                              />
                            </div>
                            <button 
                              type="button"
                              className="ml-2 text-red-500 hover:text-red-700"
                              onClick={() => {
                                const updatedCities = additionalCities.filter((_, i) => i !== index);
                                setAdditionalCities(updatedCities);
                                if (updatedCities.length === 0) {
                                  setMultiCity(false);
                                }
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Pickup Date and Time */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:space-x-3">
                    {/* Date Picker */}
                    <div className="flex-1">
                      <div className="relative">
                        <label className="block text-sm font-medium mb-1">Pickup Date</label>
                        <div className="relative">
                          <DatePicker
                            selected={pickupDate}
                            onChange={date => setPickupDate(date)}
                            minDate={new Date()}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                            dateFormat="dd/MM/yyyy"
                          />
                          <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Time Picker */}
                    <div className="flex-1">
                      <div className="relative">
                        <label className="block text-sm font-medium mb-1">Pickup Time</label>
                        <div className="relative">
                          <select
                            value={pickupTime}
                            onChange={(e) => setPickupTime(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                          >
                            {Array.from({ length: 24 }, (_, i) => {
                              const hour = i.toString().padStart(2, '0');
                              return (
                                <option key={`${hour}:00`} value={`${hour}:00`}>{`${hour}:00`}</option>
                              );
                            })}
                          </select>
                          <FaClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Return Date/Time (only for Round Trip) */}
                  {journeyType === 'outstation' && tripType === 'roundTrip' && (
                    <div className="flex flex-col sm:flex-row gap-3 sm:space-x-3">
                      {/* Return Date Picker */}
                      <div className="flex-1">
                        <div className="relative">
                          <label className="block text-sm font-medium mb-1">Return Date</label>
                          <div className="relative">
                            <DatePicker
                              selected={returnDate}
                              onChange={date => setReturnDate(date)}
                              minDate={pickupDate || new Date()}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                              dateFormat="dd/MM/yyyy"
                            />
                            <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Return Time Picker */}
                      <div className="flex-1">
                        <div className="relative">
                          <label className="block text-sm font-medium mb-1">Return Time</label>
                          <div className="relative">
                            <select
                              value={returnTime}
                              onChange={(e) => setReturnTime(e.target.value)}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                            >
                              {Array.from({ length: 24 }, (_, i) => {
                                const hour = i.toString().padStart(2, '0');
                                return (
                                  <option key={`${hour}:00`} value={`${hour}:00`}>{`${hour}:00`}</option>
                                );
                              })}
                            </select>
                            <FaClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Mobile Number */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Mobile Number</label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="Enter your mobile number"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                        maxLength="10"
                        pattern="[0-9]{10}"
                      />
                      <FaPhoneAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                  
                  {/* Error Message */}
                  {errorMessage && (
                    <div className="text-red-500 text-sm mb-4 p-2 bg-red-50 rounded-md border border-red-100">{errorMessage}</div>
                  )}
                  
                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-primary text-white rounded-md py-3 px-5 font-medium hover:bg-amber-600 transition-colors duration-200 flex items-center justify-center shadow-md"
                  >
                    <FaTaxi className="mr-2" />
                    Search Cabs
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        {/* Benefits Section */}
        <div className="container mt-16 md:mt-24 relative z-10">
          <h2 className="text-xl md:text-2xl font-bold text-center mb-8">Why Choose Us</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Benefit 1 */}
            <div className="bg-white rounded-xl shadow-md p-5 transition-transform hover:scale-105 flex flex-col items-center text-center">
              <div className="bg-amber-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <FaTaxi className="text-primary text-xl" />
              </div>
              <h3 className="font-semibold mb-2">Verified Cabs</h3>
              <p className="text-gray-500 text-sm">All cabs are regularly inspected to ensure your comfort and safety.</p>
            </div>
            
            {/* Benefit 2 */}
            <div className="bg-white rounded-xl shadow-md p-5 transition-transform hover:scale-105 flex flex-col items-center text-center">
              <div className="bg-amber-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <FaShieldAlt className="text-primary text-xl" />
              </div>
              <h3 className="font-semibold mb-2">Safe Travel</h3>
              <p className="text-gray-500 text-sm">Your safety is our priority with GPS tracking and 24/7 customer support.</p>
            </div>
            
            {/* Benefit 3 */}
            <div className="bg-white rounded-xl shadow-md p-5 transition-transform hover:scale-105 flex flex-col items-center text-center">
              <div className="bg-amber-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <FaUserTie className="text-primary text-xl" />
              </div>
              <h3 className="font-semibold mb-2">Professional Drivers</h3>
              <p className="text-gray-500 text-sm">Experienced, verified drivers who know the best routes.</p>
            </div>
            
            {/* Benefit 4 */}
            <div className="bg-white rounded-xl shadow-md p-5 transition-transform hover:scale-105 flex flex-col items-center text-center">
              <div className="bg-amber-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <FaRupeeSign className="text-primary text-xl" />
              </div>
              <h3 className="font-semibold mb-2">Clear Pricing</h3>
              <p className="text-gray-500 text-sm">Transparent fare estimates with no hidden charges.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Popular Destinations */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="container">
          <h2 className="text-xl md:text-2xl font-bold text-center mb-8">Popular Destinations</h2>
          
          {popularCities.length > 0 ? (
            <Slider {...citySettings} className="popular-cities-slider">
              {popularCities.map((city) => (
                <div key={city._id} className="px-2">
                  <div className="bg-white rounded-xl shadow-md overflow-hidden h-64 sm:h-80 relative group">
                    <img 
                      src={city.imageUrl || 'https://via.placeholder.com/300x200?text=City'} 
                      alt={city.name} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                      <h3 className="text-white text-lg font-semibold">{city.name}</h3>
                      <div className="flex items-center mt-1">{renderStars(city.rating || 4)}</div>
                      <p className="text-white text-opacity-80 text-sm mt-1">{city.tripCount || '100+'} trips booked</p>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="bg-white rounded-xl shadow-md overflow-hidden h-64 sm:h-80 relative">
                  <div className="animate-pulse">
                    <div className="bg-gray-300 h-full w-full"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                      <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Testimonials section would go here */}
    </div>
  );
};

export default Home;
