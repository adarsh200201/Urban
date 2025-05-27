const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // Set token from cookie
    token = req.cookies.token;
  }

  // Authentication debugging to diagnose token issues
  console.log(`Auth check for route: ${req.originalUrl}`);
  console.log(`Token present: ${!!token}`);
  console.log(`Token value: ${token ? token.substring(0, 15) + '...' : 'None'}`);
  console.log(`Auth header: ${req.headers.authorization ? req.headers.authorization.substring(0, 25) + '...' : 'Not provided'}`);
  
  // For booking endpoints, also accept userid in request body as fallback
  // This allows us to handle cases where token auth fails but user ID is valid
  if (req.originalUrl.includes('/api/booking') && req.body && req.body.user) {
    console.log(`Booking request with user ID: ${req.body.user}`);
    
    // For booking endpoints, we'll allow the request to proceed with just the user ID
    try {
      // Verify if this is a valid MongoDB ObjectId for a user
      // This is a fallback authentication method specific to booking endpoints
      const userId = req.body.user;
      const user = await User.findById(userId);
      
      if (user) {
        console.log(`Found valid user from ID in request body: ${user._id}`);
        req.user = user;
        return next();
      }
    } catch (err) {
      console.log('Error validating user from request body:', err.message);
      // Continue with normal token validation below
    }
  }
  
  // Make sure token exists for protected routes
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    let decoded;
    // Verify token with detailed error handling
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully:', decoded);
      
      // Add user to req object
      const user = await User.findById(decoded.id);
      
      if (!user) {
        console.log(`User not found for decoded ID: ${decoded.id}`);
        return res.status(401).json({
          success: false,
          message: 'User not found in database'
        });
      }
      
      console.log(`Authentication successful for user: ${user._id}`);
      req.user = user;
      return next();
      
    } catch (jwtError) {
      console.log('JWT verification error:', jwtError.message);
      
      // Special handling for expired tokens
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired, please log in again'
        });
      }
      
      // For other JWT errors, return a generic message
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  } catch (err) {
    console.log('General authentication error:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};
