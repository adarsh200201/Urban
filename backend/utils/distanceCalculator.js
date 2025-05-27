/**
 * Distance and fare calculation utilities
 */

// Constant for Earth's radius in kilometers
const EARTH_RADIUS_KM = 6371;

// Road factors for different regions (can be expanded)
const ROAD_FACTORS = {
  'default': 1.3,  // Default road factor for India
  'urban': 1.4,    // Urban areas with more winding roads
  'highway': 1.2,  // Highway connections between cities
};

/**
 * Calculate the straight-line (haversine) distance between two points
 * @param {Number} lat1 - Latitude of point 1 in degrees
 * @param {Number} lon1 - Longitude of point 1 in degrees
 * @param {Number} lat2 - Latitude of point 2 in degrees
 * @param {Number} lon2 - Longitude of point 2 in degrees
 * @returns {Number} Distance in kilometers
 */
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  // Convert degrees to radians
  const radLat1 = (lat1 * Math.PI) / 180;
  const radLon1 = (lon1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;
  const radLon2 = (lon2 * Math.PI) / 180;

  // Haversine formula
  const dLat = radLat2 - radLat1;
  const dLon = radLon2 - radLon1;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Distance in kilometers
  return EARTH_RADIUS_KM * c;
};

/**
 * Calculate the approximate road distance based on straight-line distance
 * @param {Number} straightLineDistance - Straight-line distance in kilometers
 * @param {String} roadType - Type of road (urban, highway, default)
 * @returns {Number} Approximate road distance in kilometers
 */
const calculateRoadDistance = (straightLineDistance, roadType = 'default') => {
  const factor = ROAD_FACTORS[roadType] || ROAD_FACTORS.default;
  return straightLineDistance * factor;
};

/**
 * Calculate approximate road distance between two cities using coordinates
 * @param {Object} city1 - First city with lat and lng properties
 * @param {Object} city2 - Second city with lat and lng properties
 * @param {String} roadType - Type of road (urban, highway, default)
 * @returns {Number} Approximate road distance in kilometers
 */
const calculateDistanceBetweenCities = (city1, city2, roadType = 'default') => {
  if (!city1 || !city2 || !city1.lat || !city1.lng || !city2.lat || !city2.lng) {
    throw new Error('Invalid city coordinates');
  }
  
  // Check if we have the actual road distance for these cities
  let city1Name = '';
  let city2Name = '';
  
  // Find city names by matching coordinates
  for (const [name, coords] of Object.entries(CITY_COORDINATES)) {
    if (coords.lat === city1.lat && coords.lng === city1.lng) {
      city1Name = name;
    }
    if (coords.lat === city2.lat && coords.lng === city2.lng) {
      city2Name = name;
    }
  }
  
  // Check if we have actual road distance for this city pair
  if (city1Name && city2Name) {
    const key1 = `${city1Name}-${city2Name}`;
    const key2 = `${city2Name}-${city1Name}`;
    
    if (ACTUAL_ROAD_DISTANCES[key1]) {
      return ACTUAL_ROAD_DISTANCES[key1];
    } else if (ACTUAL_ROAD_DISTANCES[key2]) {
      return ACTUAL_ROAD_DISTANCES[key2];
    }
  }
  
  // If no actual distance is available, calculate using the formula
  const straightLineDistance = calculateHaversineDistance(
    city1.lat, city1.lng, city2.lat, city2.lng
  );
  
  return calculateRoadDistance(straightLineDistance, roadType);
};

/**
 * Calculate fare based on distance and cab type
 * @param {Number} distance - Distance in kilometers
 * @param {Object} cabType - Cab type object with pricing details
 * @param {Boolean} isNightTime - Whether the journey is during night hours
 * @returns {Object} Fare details including base fare, additional charges, and total
 */
const calculateFare = (distance, cabType, isNightTime = false) => {
  if (!cabType || !distance) {
    throw new Error('Cab type and distance are required');
  }
  
  // Base fare calculation
  let baseFare = cabType.baseKmPrice * distance;
  
  // Additional kilometers beyond included kilometers
  const extraKm = Math.max(0, distance - (cabType.includedKm || 0));
  const extraFare = extraKm * (cabType.extraFarePerKm || 0);
  
  // Additional charges
  const fuelCharge = cabType.fuelCharges?.included ? 0 : (cabType.fuelCharges?.charge || 0);
  const driverCharge = cabType.driverCharges?.included ? 0 : (cabType.driverCharges?.charge || 0);
  let nightCharge = 0;
  
  if (isNightTime && !cabType.nightCharges?.included) {
    nightCharge = cabType.nightCharges?.charge || 0;
  }
  
  // Total fare
  const totalFare = baseFare + extraFare + fuelCharge + driverCharge + nightCharge;
  
  return {
    baseFare: Math.round(baseFare),
    extraKmFare: Math.round(extraFare),
    fuelCharge: Math.round(fuelCharge),
    driverCharge: Math.round(driverCharge),
    nightCharge: Math.round(nightCharge),
    totalFare: Math.round(totalFare),
    distance: Math.round(distance)
  };
};

/**
 * Example data for major city coordinates for distance calculations
 */
const CITY_COORDINATES = {
  'rajkot': { lat: 22.3039, lng: 70.8022 },
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'delhi': { lat: 28.7041, lng: 77.1025 },
  'ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'surat': { lat: 21.1702, lng: 72.8311 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'jaipur': { lat: 26.9124, lng: 75.7873 },
  'chennai': { lat: 13.0827, lng: 80.2707 },
  'kolkata': { lat: 22.5726, lng: 88.3639 }
};

/**
 * Actual road distances between major cities in kilometers
 * These values are used as a reference to calculate more accurate distances
 */
const ACTUAL_ROAD_DISTANCES = {
  'rajkot-delhi': 1140,
  'rajkot-mumbai': 660,
  'rajkot-ahmedabad': 220,
  'rajkot-surat': 325,
  'rajkot-jaipur': 790,
  'delhi-mumbai': 1400,
  'delhi-bangalore': 2150,
  'ahmedabad-mumbai': 520
};

/**
 * Calculate distance from Rajkot to Mumbai
 * @returns {Object} Distance and fare details
 */
const calculateRajkotToMumbaiDistance = (cabType) => {
  const rajkot = CITY_COORDINATES.rajkot;
  const mumbai = CITY_COORDINATES.mumbai;
  
  // Calculate using highway road factor since it's intercity
  const straightLineDistance = calculateHaversineDistance(
    rajkot.lat, rajkot.lng, mumbai.lat, mumbai.lng
  );
  
  const roadDistance = calculateRoadDistance(straightLineDistance, 'highway');
  
  // Return distance information
  return {
    straightLineDistance: Math.round(straightLineDistance),
    roadDistance: Math.round(roadDistance),
    fare: cabType ? calculateFare(roadDistance, cabType) : null
  };
};

/**
 * Calculate distance from Rajkot to Delhi
 * @returns {Object} Distance and fare details
 */
const calculateRajkotToDelhiDistance = (cabType) => {
  const rajkot = CITY_COORDINATES.rajkot;
  const delhi = CITY_COORDINATES.delhi;
  
  // Get the actual road distance from our reference data
  const actualRoadDistance = ACTUAL_ROAD_DISTANCES['rajkot-delhi'];
  
  // Calculate straight-line distance for reference
  const straightLineDistance = calculateHaversineDistance(
    rajkot.lat, rajkot.lng, delhi.lat, delhi.lng
  );
  
  // Return distance information using the actual road distance
  return {
    straightLineDistance: Math.round(straightLineDistance),
    roadDistance: actualRoadDistance,
    fare: cabType ? calculateFare(actualRoadDistance, cabType) : null
  };
};

module.exports = {
  calculateHaversineDistance,
  calculateRoadDistance,
  calculateDistanceBetweenCities,
  calculateFare,
  calculateRajkotToMumbaiDistance,
  calculateRajkotToDelhiDistance,
  CITY_COORDINATES
};
