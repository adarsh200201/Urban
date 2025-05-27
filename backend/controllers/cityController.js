const City = require('../models/City');
const Route = require('../models/Route');

// @desc    Get all cities, supports search by name
// @route   GET /api/city
// @access  Public
exports.getAllCities = async (req, res) => {
  try {
    const { search } = req.query;
    let query = { active: true };
    
    // Add search functionality if search parameter is provided
    if (search) {
      query.name = { $regex: search, $options: 'i' }; // Case-insensitive search
    }
    
    const cities = await City.find(query).sort('name');

    res.status(200).json({
      success: true,
      count: cities.length,
      data: cities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cities',
      error: error.message
    });
  }
};

// @desc    Get popular cities
// @route   GET /api/city/popular
// @access  Public
exports.getPopularCities = async (req, res) => {
  try {
    const cities = await City.find({ isPopular: true, active: true }).sort('name');

    // Format response to match frontend expectations
    const formattedCities = cities.map(city => ({
      _id: city._id,
      name: city.name,
      state: city.state,
      image: city.image || `https://source.unsplash.com/300x400/?city,${city.name.replace(' ', '%20')}`,
      isPopular: city.isPopular
    }));

    res.status(200).json({
      success: true,
      count: formattedCities.length,
      cities: formattedCities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular cities',
      error: error.message
    });
  }
};

// @desc    Get single city
// @route   GET /api/city/:id
// @access  Public
exports.getCity = async (req, res) => {
  try {
    const city = await City.findById(req.params.id);

    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }

    res.status(200).json({
      success: true,
      data: city
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch city',
      error: error.message
    });
  }
};

// @desc    Create new city
// @route   POST /api/city
// @access  Private/Admin
exports.createCity = async (req, res) => {
  try {
    let {
      name,
      state,
      country,
      isPopular,
      imageUrl,
      latitude,
      longitude
    } = req.body;

    // Check required fields
    if (!name || !state) {
      return res.status(400).json({
        success: false,
        message: 'Please provide city name and state'
      });
    }
    
    // Format the city name (proper capitalization)
    name = name.trim();
    name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    
    // Check if city already exists (case insensitive)
    const existingCity = await City.findOne({ 
      name: { $regex: new RegExp('^' + name + '$', 'i') }
    });
    
    if (existingCity) {
      return res.status(400).json({
        success: false,
        message: `City with name '${name}' already exists`
      });
    }

    // Create city
    const city = await City.create({
      name,
      state,
      country: country || 'India',
      isPopular: isPopular || false,
      imageUrl,
      latitude,
      longitude,
      active: true
    });

    res.status(201).json({
      success: true,
      data: city
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create city',
      error: error.message
    });
  }
};

// @desc    Update city
// @route   PUT /api/city/:id
// @access  Private/Admin
exports.updateCity = async (req, res) => {
  try {
    // Find the city to update
    const city = await City.findById(req.params.id);

    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }
    
    // Get the update data
    let updateData = { ...req.body };
    
    // Handle name formatting if name is being updated
    if (updateData.name) {
      // Format city name (proper capitalization)
      updateData.name = updateData.name.trim();
      updateData.name = updateData.name.charAt(0).toUpperCase() + updateData.name.slice(1).toLowerCase();
      
      // Check if updated name conflicts with another city
      if (updateData.name.toLowerCase() !== city.name.toLowerCase()) {
        const existingCity = await City.findOne({
          _id: { $ne: req.params.id },
          name: { $regex: new RegExp('^' + updateData.name + '$', 'i') }
        });
        
        if (existingCity) {
          return res.status(400).json({
            success: false,
            message: `Another city with name '${updateData.name}' already exists`
          });
        }
      }
    }

    // Update the city
    const updatedCity = await City.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedCity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update city',
      error: error.message
    });
  }
};

// @desc    Delete city
// @route   DELETE /api/city/:id
// @access  Private/Admin
exports.deleteCity = async (req, res) => {
  try {
    const city = await City.findById(req.params.id);

    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }

    // Check if city is used in any routes
    const routes = await Route.find({
      $or: [
        { sourceCity: req.params.id },
        { destinationCity: req.params.id }
      ]
    });

    if (routes.length > 0) {
      // Instead of deleting, just set active to false
      city.active = false;
      await city.save();

      return res.status(200).json({
        success: true,
        message: 'City deactivated successfully (has routes associated with it)'
      });
    }

    // If no routes, we can delete it
    await city.remove();

    res.status(200).json({
      success: true,
      message: 'City deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete city',
      error: error.message
    });
  }
};

// @desc    Get all routes
// @route   GET /api/city/routes
// @access  Public
exports.getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find({ active: true })
      .populate('sourceCity', 'name state')
      .populate('destinationCity', 'name state');

    res.status(200).json({
      success: true,
      count: routes.length,
      data: routes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch routes',
      error: error.message
    });
  }
};

// @desc    Get popular routes
// @route   GET /api/city/routes/popular
// @access  Public
exports.getPopularRoutes = async (req, res) => {
  try {
    const routes = await Route.find({ isPopular: true, active: true })
      .populate('sourceCity', 'name state')
      .populate('destinationCity', 'name state');

    res.status(200).json({
      success: true,
      count: routes.length,
      data: routes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular routes',
      error: error.message
    });
  }
};

// @desc    Create new route
// @route   POST /api/city/route
// @access  Private/Admin
exports.createRoute = async (req, res) => {
  try {
    const {
      sourceCity,
      destinationCity,
      distance,
      estimatedTime,
      isPopular,
      basePrice,
      tollCharges,
      stateCharges
    } = req.body;

    // Check if both cities exist
    const source = await City.findById(sourceCity);
    const destination = await City.findById(destinationCity);
    
    if (!source || !destination) {
      return res.status(404).json({
        success: false,
        message: 'One or both cities not found'
      });
    }

    // Check if route already exists
    const existingRoute = await Route.findOne({
      sourceCity,
      destinationCity
    });

    if (existingRoute) {
      return res.status(400).json({
        success: false,
        message: 'Route already exists'
      });
    }

    // Create route
    const route = await Route.create({
      sourceCity,
      destinationCity,
      distance,
      estimatedTime,
      isPopular: isPopular || false,
      basePrice,
      tollCharges: tollCharges || 0,
      stateCharges: stateCharges || 0
    });

    res.status(201).json({
      success: true,
      data: route
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create route',
      error: error.message
    });
  }
};

// @desc    Get route by source and destination
// @route   GET /api/city/route/:sourceId/:destinationId
// @access  Public
exports.getRouteBySourceAndDestination = async (req, res) => {
  try {
    const { sourceId, destinationId } = req.params;

    const route = await Route.findOne({
      sourceCity: sourceId,
      destinationCity: destinationId,
      active: true
    })
      .populate('sourceCity', 'name state')
      .populate('destinationCity', 'name state');

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    res.status(200).json({
      success: true,
      data: route
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch route',
      error: error.message
    });
  }
};
