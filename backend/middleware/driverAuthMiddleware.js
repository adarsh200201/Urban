const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const Driver = require('../models/Driver');

// Protect driver routes
exports.protectDriver = asyncHandler(async (req, res, next) => {
  let token;

  // Check if token exists in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Get token from header
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    res.status(401);
    throw new Error('Not authorized to access this route');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get driver from token
    req.driver = await Driver.findById(decoded.id).select('-password');

    if (!req.driver) {
      res.status(401);
      throw new Error('Driver not found');
    }

    next();
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized to access this route');
  }
});

// Check if driver is verified
exports.verifiedDriver = (req, res, next) => {
  if (req.driver && req.driver.documentsVerified) {
    next();
  } else {
    res.status(403);
    throw new Error('Access denied: Your account is not verified yet');
  }
};
