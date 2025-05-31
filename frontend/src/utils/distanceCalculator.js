/**
 * Distance calculator utility for UrbanRide
 * This module handles distance calculations between cities and pricing based on distance
 */

// City coordinate mapping (demo data - in a real app this would come from a database or API)
const cityCoordinates = {
  "delhi": { lat: 28.6139, lng: 77.2090 },
  "mumbai": { lat: 19.0760, lng: 72.8777 },
  "bangalore": { lat: 12.9716, lng: 77.5946 },
  "hyderabad": { lat: 17.3850, lng: 78.4867 },
  "chennai": { lat: 13.0827, lng: 80.2707 },
  "kolkata": { lat: 22.5726, lng: 88.3639 },
  "jaipur": { lat: 26.9124, lng: 75.7873 },
  "ahmedabad": { lat: 23.0225, lng: 72.5714 },
  "pune": { lat: 18.5204, lng: 73.8567 },
  "lucknow": { lat: 26.8467, lng: 80.9462 },
  "rajkot": { lat: 22.3039, lng: 70.8022 },
  "surat": { lat: 21.1702, lng: 72.8311 },
  "patna": { lat: 25.5941, lng: 85.1376 },
  "kochi": { lat: 9.9312, lng: 76.2673 },
  "indore": { lat: 22.7196, lng: 75.8577 },
  "bhopal": { lat: 23.2599, lng: 77.4126 },
  "nagpur": { lat: 21.1458, lng: 79.0882 },
  "chandigarh": { lat: 30.7333, lng: 76.7794 },
  "goa": { lat: 15.2993, lng: 74.1240 },
  "amritsar": { lat: 31.6340, lng: 74.8723 }
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} - Distance in kilometers
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return Math.round(distance);
};

/**
 * Convert degrees to radians
 * @param {number} deg - Degrees
 * @returns {number} - Radians
 */
const deg2rad = (deg) => {
  return deg * (Math.PI/180);
};

/**
 * Fixed accurate distances for popular routes (in km)
 */
const FIXED_DISTANCES = {
  // Format: 'from-to': distance in km
  'rajkot-ahmedabad': 220,
  'ahmedabad-rajkot': 220,
  'mumbai-pune': 150,
  'pune-mumbai': 150,
  'delhi-jaipur': 281,
  'jaipur-delhi': 281,
  'bangalore-chennai': 346,
  'chennai-bangalore': 346,
  'delhi-chandigarh': 243,
  'chandigarh-delhi': 243,
  'mumbai-surat': 294,
  'surat-mumbai': 294,
  'jaipur-ahmedabad': 648,
  'ahmedabad-jaipur': 648
};

/**
 * Get distance between two cities
 * @param {string} city1 - Origin city name (lowercase)
 * @param {string} city2 - Destination city name (lowercase)
 * @returns {number} - Distance in kilometers or fallback value if cities not found
 */
export const getDistanceBetweenCities = (city1, city2) => {
  // Normalize city names to lowercase
  const from = city1.toLowerCase();
  const to = city2.toLowerCase();
  
  // Check if we have a fixed accurate distance for this route pair
  const routeKey = `${from}-${to}`;
  if (FIXED_DISTANCES[routeKey]) {
    return FIXED_DISTANCES[routeKey];
  }
  
  // If we have coordinates for both cities, calculate distance
  if (cityCoordinates[from] && cityCoordinates[to]) {
    return calculateDistance(
      cityCoordinates[from].lat,
      cityCoordinates[from].lng,
      cityCoordinates[to].lat,
      cityCoordinates[to].lng
    );
  }
  
  // Fallback - in a real app you might want to call an external API here
  // like Google Maps Distance Matrix API
  return 500; // Default fallback distance in km
};

/**
 * Calculate estimated travel time based on distance
 * @param {number} distance - Distance in kilometers
 * @returns {number} - Time in hours
 */
export const getEstimatedTime = (distance) => {
  // Average speed of 60 km/h with rest stops
  return Math.ceil(distance / 60);
};

/**
 * Calculate cab prices based on distance and cab type
 * @param {number} distance - Distance in kilometers
 * @param {object} cabModel - Cab model details
 * @param {string} journeyType - 'oneWay' or 'roundTrip'
 * @returns {object} - Calculated prices
 */
export const calculatePricesByDistance = (distance, cabModel, journeyType) => {
  // Base per km rates by category
  const basePricePerKm = {
    'sedan': 12,    // Economy
    'suv': 16,      // Premium 
    'luxury': 25,   // Luxury
    'mini': 10      // Budget
  };
  
  // Get the correct category rate or default to sedan
  const categoryKey = cabModel.category ? cabModel.category.toLowerCase() : 'sedan';
  const perKmRate = basePricePerKm[categoryKey] || 12;
  
  // Calculate base price based on distance and per km rate
  const basePrice = Math.round(distance * perKmRate);
  
  // Apply journey type multiplier
  const multiplier = journeyType === 'roundTrip' ? 1.8 : 1;
  const journeyBasePrice = Math.round(basePrice * multiplier);
  
  // Calculate special pricing
  const discountedPrice = Math.round(journeyBasePrice * 0.9); // 10% discount
  const bestPrice = Math.round(journeyBasePrice * 0.85);      // 15% discount
  
  // Calculate taxes and additional charges
  const gstRate = 0.05; // 5% GST
  const gstAmount = Math.round(bestPrice * gstRate);
  
  // Toll tax and state permit calculation (typically varies by route and state)
  // Using a simplified formula for demo purposes
  const tollTaxRate = 0.03; // 3% of base price
  const stateTaxRate = 0.04; // 4% of base price
  const tollTaxAmount = Math.round(journeyBasePrice * tollTaxRate);
  const stateTaxAmount = Math.round(journeyBasePrice * stateTaxRate);
  
  // All Inclusive Price (Best Price + GST)
  const taxInclusivePrice = bestPrice + gstAmount;
  
  // All Inclusive Price with Toll & State Tax (Best Price + GST + Toll + State Tax)
  const allInclusivePrice = taxInclusivePrice + tollTaxAmount + stateTaxAmount;
  
  // Calculate included kilometers
  const includedKm = journeyType === 'roundTrip' ? distance * 2 : distance;
  
  return {
    basePrice: journeyBasePrice,
    discountedPrice,
    bestPrice,
    taxInclusivePrice,
    allInclusivePrice,
    discount: 10,
    bestDiscount: 15,
    includedKm,
    distanceInKm: distance,
    estimatedTime: getEstimatedTime(distance),
    extraKmFare: perKmRate,
    perKmRate,
    gstAmount,
    tollTaxAmount,
    stateTaxAmount,
    taxes: {
      gst: {
        rate: gstRate * 100,
        amount: gstAmount
      },
      toll: {
        rate: tollTaxRate * 100,
        amount: tollTaxAmount
      },
      state: {
        rate: stateTaxRate * 100,
        amount: stateTaxAmount
      }
    }
  };
};
