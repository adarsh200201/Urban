const CabType = require('../models/CabType');
const City = require('../models/City');
const { 
  calculateDistanceBetweenCities, 
  calculateFare, 
  calculateRajkotToMumbaiDistance,
  calculateRajkotToDelhiDistance,
  CITY_COORDINATES 
} = require('../utils/distanceCalculator');

// @desc    Calculate Rajkot to Delhi distance
// @route   GET /api/distance/rajkot-to-delhi
// @access  Public
exports.getRajkotToDelhiDistance = async (req, res) => {
  try {
    const { cabTypeId } = req.query;
    
    let cabType = null;
    if (cabTypeId) {
      cabType = await CabType.findById(cabTypeId);
      if (!cabType) {
        // Use default parameters for fare calculation if cab type not found
        cabType = {
          baseKmPrice: 12,  // Rs. per km
          extraFarePerKm: 10,
          includedKm: 100,
          fuelCharges: { included: false, charge: 500 },
          driverCharges: { included: false, charge: 800 },
          nightCharges: { included: true, charge: 0 }
        };
      }
    }
    
    const distanceData = calculateRajkotToDelhiDistance(cabType);
    
    res.status(200).json({
      success: true,
      data: {
        fromCity: 'Rajkot',
        toCity: 'Delhi',
        distance: distanceData.roadDistance,
        straightLineDistance: distanceData.straightLineDistance,
        fare: distanceData.fare,
        journeyType: 'outstation',
        roadType: 'highway'
      }
    });
    
  } catch (error) {
    console.error('Distance calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating Rajkot to Delhi distance',
      error: error.message
    });
  }
};

// @desc    Calculate distance and fare between two cities
// @route   POST /api/distance/calculate
// @access  Public
exports.calculateDistance = async (req, res) => {
  try {
    const { fromCityId, toCityId, fromCity: fromCityName, toCity: toCityName, cabTypeId, journeyType, isNightJourney } = req.body;

    let fromCityObj, toCityObj;

    // Support both ID-based and name-based lookups
    if (fromCityId && toCityId) {
      // Fetch city data from database by ID
      [fromCityObj, toCityObj] = await Promise.all([
        City.findById(fromCityId),
        City.findById(toCityId)
      ]);
    } else if (fromCityName && toCityName) {
      // Fetch city data from database by name
      [fromCityObj, toCityObj] = await Promise.all([
        City.findOne({ name: { $regex: new RegExp(fromCityName, 'i') } }),
        City.findOne({ name: { $regex: new RegExp(toCityName, 'i') } })
      ]);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide either city IDs or city names'
      });
    }

    if (!fromCityObj || !toCityObj) {
      // If cities aren't found in the database, use hardcoded values
      // This is a fallback for testing only
      if (fromCityName && toCityName) {
        // Create mock cities with estimated coordinates
        // In a production app, you would use geocoding here
        fromCityObj = {
          name: fromCityName,
          latitude: CITY_COORDINATES[fromCityName.toLowerCase()]?.lat || 22.3039, 
          longitude: CITY_COORDINATES[fromCityName.toLowerCase()]?.lng || 70.8022,
        };
        
        toCityObj = {
          name: toCityName,
          latitude: CITY_COORDINATES[toCityName.toLowerCase()]?.lat || 19.0760,
          longitude: CITY_COORDINATES[toCityName.toLowerCase()]?.lng || 72.8777,
        };
      } else {
        return res.status(404).json({
          success: false,
          message: 'One or both cities not found'
        });
      }
    }

    // Check if we have coordinates for both cities
    if (fromCityObj.latitude === undefined || fromCityObj.longitude === undefined || 
        toCityObj.latitude === undefined || toCityObj.longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'City coordinates not available'
      });
    }

    // Extract coordinates
    const city1 = { 
      lat: fromCityObj.latitude, 
      lng: fromCityObj.longitude 
    };
    
    const city2 = { 
      lat: toCityObj.latitude, 
      lng: toCityObj.longitude 
    };

    // Determine road type based on journey type
    const roadType = journeyType === 'local' ? 'urban' : 'highway';
    
    // Calculate distance
    const distance = calculateDistanceBetweenCities(city1, city2, roadType);

    // Calculate fare if cabTypeId is provided
    let fare = null;
    if (cabTypeId) {
      const cabType = await CabType.findById(cabTypeId);
      if (cabType) {
        fare = calculateFare(distance, cabType, isNightJourney || false);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        fromCity: fromCityObj.name,
        toCity: toCityObj.name,
        distance: Math.round(distance),
        fare,
        journeyType,
        roadType
      }
    });

  } catch (error) {
    console.error('Distance calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating distance',
      error: error.message
    });
  }
};

// @desc    Calculate Rajkot to Mumbai distance
// @route   GET /api/distance/rajkot-to-mumbai
// @access  Public
exports.getRajkotToMumbaiDistance = async (req, res) => {
  try {
    const { cabTypeId } = req.query;
    
    let cabType = null;
    if (cabTypeId) {
      cabType = await CabType.findById(cabTypeId);
      if (!cabType) {
        return res.status(404).json({
          success: false,
          message: 'Cab type not found'
        });
      }
    }
    
    const result = calculateRajkotToMumbaiDistance(cabType);
    
    res.status(200).json({
      success: true,
      data: {
        ...result,
        fromCity: 'Rajkot',
        toCity: 'Mumbai'
      }
    });
    
  } catch (error) {
    console.error('Rajkot to Mumbai calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating distance',
      error: error.message
    });
  }
};
