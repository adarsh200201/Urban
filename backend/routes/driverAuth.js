const express = require('express');
const router = express.Router();
const { registerDriver, loginDriver } = require('../controllers/driverAuthController');
const { directRegisterDriver } = require('../controllers/driverAuthController');

// Add special debug middleware to log request details
const debugMiddleware = (req, res, next) => {
  console.log('🔍 Driver Auth Route Hit:', req.path);
  console.log('🔍 Request Method:', req.method);
  console.log('🔍 Content-Type:', req.get('Content-Type'));
  console.log('🔍 Request Body Keys:', req.body ? Object.keys(req.body) : 'No body');
  console.log('🔍 Request Files:', req.files ? Object.keys(req.files) : 'No files');
  next();
};

// @desc    Register a new driver
// @route   POST /api/driver/auth/register
// @access  Public
router.post('/register', debugMiddleware, registerDriver);

// @desc    Authenticate a driver
// @route   POST /api/driver/auth/login
// @access  Public
router.post('/login', debugMiddleware, loginDriver);

// @desc    Register a driver directly in the Driver collection
// @route   POST /api/driver/auth/direct-register
// @access  Public
router.post('/direct-register', debugMiddleware, directRegisterDriver);

module.exports = router;
