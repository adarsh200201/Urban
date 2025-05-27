const FixedRoute = require('../models/FixedRoute');
const City = require('../models/City');
const CabType = require('../models/CabType');
const asyncHandler = require('express-async-handler');

// @desc    Create a new fixed route
// @route   POST /api/fixed-routes
// @access  Admin
const createFixedRoute = asyncHandler(async (req, res) => {
  const { fromCityId, toCityId, cabTypeId, price, estimatedTime, distance } = req.body;

  // Validate required fields
  if (!fromCityId || !toCityId || !cabTypeId || !price) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Check if cities and cab type exist
  const fromCity = await City.findById(fromCityId);
  const toCity = await City.findById(toCityId);
  const cabType = await CabType.findById(cabTypeId);

  if (!fromCity || !toCity) {
    res.status(400);
    throw new Error('One or both cities not found');
  }

  if (!cabType) {
    res.status(400);
    throw new Error('Cab type not found');
  }

  // Check if fixed route already exists
  const existingRoute = await FixedRoute.findOne({
    fromCity: fromCityId,
    toCity: toCityId,
    cabType: cabTypeId
  });

  if (existingRoute) {
    res.status(400);
    throw new Error('A fixed route with these parameters already exists');
  }

  // Create new fixed route
  const fixedRoute = await FixedRoute.create({
    fromCity: fromCityId,
    toCity: toCityId,
    cabType: cabTypeId,
    price,
    estimatedTime,
    distance
  });

  if (fixedRoute) {
    res.status(201).json({
      success: true,
      data: fixedRoute
    });
  } else {
    res.status(400);
    throw new Error('Invalid fixed route data');
  }
});

// @desc    Get all fixed routes
// @route   GET /api/fixed-routes
// @access  Admin/Public
const getAllFixedRoutes = asyncHandler(async (req, res) => {
  const fixedRoutes = await FixedRoute.find({})
    .populate('fromCity', 'name')
    .populate('toCity', 'name')
    .populate('cabType', 'name imageUrl');

  res.status(200).json({
    success: true,
    count: fixedRoutes.length,
    data: fixedRoutes
  });
});

// @desc    Get fixed route by ID
// @route   GET /api/fixed-routes/:id
// @access  Admin
const getFixedRouteById = asyncHandler(async (req, res) => {
  const fixedRoute = await FixedRoute.findById(req.params.id)
    .populate('fromCity', 'name')
    .populate('toCity', 'name')
    .populate('cabType', 'name imageUrl');

  if (!fixedRoute) {
    res.status(404);
    throw new Error('Fixed route not found');
  }

  res.status(200).json({
    success: true,
    data: fixedRoute
  });
});

// @desc    Update fixed route
// @route   PUT /api/fixed-routes/:id
// @access  Admin
const updateFixedRoute = asyncHandler(async (req, res) => {
  const { price, estimatedTime, distance, active } = req.body;

  const fixedRoute = await FixedRoute.findById(req.params.id);

  if (!fixedRoute) {
    res.status(404);
    throw new Error('Fixed route not found');
  }

  // Update fields
  fixedRoute.price = price || fixedRoute.price;
  fixedRoute.estimatedTime = estimatedTime || fixedRoute.estimatedTime;
  fixedRoute.distance = distance || fixedRoute.distance;
  fixedRoute.active = active !== undefined ? active : fixedRoute.active;
  fixedRoute.updatedAt = Date.now();

  const updatedFixedRoute = await fixedRoute.save();

  res.status(200).json({
    success: true,
    data: updatedFixedRoute
  });
});

// @desc    Delete fixed route
// @route   DELETE /api/fixed-routes/:id
// @access  Admin
const deleteFixedRoute = asyncHandler(async (req, res) => {
  const fixedRoute = await FixedRoute.findById(req.params.id);

  if (!fixedRoute) {
    res.status(404);
    throw new Error('Fixed route not found');
  }

  await fixedRoute.remove();

  res.status(200).json({
    success: true,
    message: 'Fixed route removed'
  });
});

// @desc    Check for fixed route between cities
// @route   POST /api/fixed-routes/check
// @access  Public
const checkFixedRoute = asyncHandler(async (req, res) => {
  const { fromCityId, toCityId } = req.body;

  if (!fromCityId || !toCityId) {
    res.status(400);
    throw new Error('Please provide both origin and destination city IDs');
  }

  // Find all fixed routes between these cities
  const fixedRoutes = await FixedRoute.find({
    fromCity: fromCityId,
    toCity: toCityId,
    active: true
  })
    .populate('fromCity', 'name')
    .populate('toCity', 'name')
    .populate('cabType');

  if (fixedRoutes && fixedRoutes.length > 0) {
    res.status(200).json({
      success: true,
      isFixedRoute: true,
      count: fixedRoutes.length,
      data: fixedRoutes
    });
  } else {
    res.status(200).json({
      success: true,
      isFixedRoute: false,
      message: 'No fixed routes found between these cities'
    });
  }
});

module.exports = {
  createFixedRoute,
  getAllFixedRoutes,
  getFixedRouteById,
  updateFixedRoute,
  deleteFixedRoute,
  checkFixedRoute
};
