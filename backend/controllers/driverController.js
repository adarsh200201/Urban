const Driver = require('../models/Driver');
const Booking = require('../models/Booking');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Register a driver
// @route   POST /api/driver/register
// @access  Private/Admin
exports.registerDriver = asyncHandler(async (req, res) => {
  const { 
    userId, 
    licenseNumber, 
    licenseExpiry, 
    vehicleNumber, 
    vehicleModel,
    vehicleType 
  } = req.body;

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Update user role to driver
  user.role = 'driver';
  await user.save();

  // Create driver profile
  const driver = await Driver.create({
    user: userId,
    licenseNumber,
    licenseExpiry,
    vehicleNumber,
    vehicleModel,
    vehicleType
  });

  res.status(201).json({
    success: true,
    data: driver
  });
});

// @desc    Get all drivers
// @route   GET /api/driver
// @access  Private/Admin
exports.getDrivers = asyncHandler(async (req, res) => {
  try {
    console.log('Getting all drivers...');
    
    // Use populate to get the vehicleType details
    const drivers = await Driver.find({})
      .populate('vehicleType', 'name description acAvailable') // Populate vehicleType
      .populate('user', 'name email phone') // Populate user details
      .lean();
    
    console.log(`Found ${drivers.length} drivers`);
    
    // Return the data
    res.status(200).json({
      success: true,
      count: drivers.length,
      data: drivers
    });
  } catch (error) {
    console.error('Error in getDrivers:', error);
    console.error('Error stack trace:', error.stack);
    
    // Check for specific types of errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
        error: error.message
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Something went wrong while fetching drivers',
      error: error.message
    });
  }
});

// @desc    Get available drivers
// @route   GET /api/driver/available
// @access  Private/Admin
exports.getAvailableDrivers = asyncHandler(async (req, res) => {
  try {
    // Get available drivers with populated vehicleType
    const drivers = await Driver.find({ isAvailable: true })
      .populate('vehicleType', 'name description acAvailable')
      .populate('user', 'name email phone')
      .lean();
    
    console.log(`Found ${drivers.length} available drivers`);
    
    // Return the data
    res.status(200).json({
      success: true,
      count: drivers.length,
      data: drivers
    });
  } catch (error) {
    console.error('Error in getAvailableDrivers:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong',
      error: error.message
    });
  }
});

// @desc    Get driver details
// @route   GET /api/driver/:id
// @access  Private/Admin
exports.getDriverById = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('vehicleType', 'name')
    .populate('currentBooking');

  if (!driver) {
    res.status(404);
    throw new Error('Driver not found');
  }

  res.status(200).json({
    success: true,
    data: driver
  });
});

// @desc    Update driver profile
// @route   PUT /api/driver/:id
// @access  Private/Admin
exports.updateDriver = asyncHandler(async (req, res) => {
  let driver = await Driver.findById(req.params.id);

  if (!driver) {
    res.status(404);
    throw new Error('Driver not found');
  }

  driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: driver
  });
});

// @desc    Update driver availability
// @route   PUT /api/driver/:id/availability
// @access  Private/Driver
exports.updateAvailability = asyncHandler(async (req, res) => {
  const { isAvailable } = req.body;
  
  const driver = await Driver.findById(req.params.id);
  
  if (!driver) {
    res.status(404);
    throw new Error('Driver not found');
  }
  
  // If driver is already assigned to a booking, they can't change availability
  if (driver.currentBooking && isAvailable) {
    res.status(400);
    throw new Error('Cannot change availability while assigned to a booking');
  }
  
  driver.isAvailable = isAvailable;
  await driver.save();
  
  res.status(200).json({
    success: true,
    data: driver
  });
});

// @desc    Update driver availability
// @route   PUT /api/driver/:id/availability
// @access  Private/Driver
exports.updateAvailability = asyncHandler(async (req, res) => {
  try {
    const { isAvailable } = req.body;
    
    if (isAvailable === undefined) {
      return res.status(400).json({
        success: false,
        message: 'isAvailable field is required'
      });
    }
    
    // Find driver by ID
    const driver = await Driver.findById(req.params.id);
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    // Check if driver has an active booking
    if (driver.currentBooking && isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Cannot set availability to true while having an active booking'
      });
    }
    
    // Update availability
    driver.isAvailable = isAvailable;
    await driver.save();
    
    // Return updated driver
    res.status(200).json({
      success: true,
      message: `Driver availability updated to ${isAvailable ? 'available' : 'unavailable'}`,
      data: driver
    });
  } catch (error) {
    console.error('Error updating driver availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update driver availability',
      error: error.message
    });
  }
});

// @desc    Update driver location
// @route   PUT /api/driver/:id/location
// @access  Private/Driver
exports.updateLocation = asyncHandler(async (req, res) => {
  try {
    // Simple check to avoid unnecessary processing
    // If this has no files, no need to try processing it as a file upload
    if (req.headers['content-type'] !== 'application/json') {
      console.log('Received non-JSON location update request');
      return res.status(400).json({
        success: false,
        message: 'Location updates must be sent as application/json'
      });
    }

    const { longitude, latitude } = req.body;
    
    // Validate coordinates
    if (longitude === undefined || latitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Both longitude and latitude are required'
      });
    }
    
    const driver = await Driver.findById(req.params.id);
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    // Update driver location
    driver.currentLocation = {
      type: 'Point',
      coordinates: [longitude, latitude]
    };
    
    await driver.save();
    
    // Only update booking location if needed and do it efficiently
    if (driver.currentBooking) {
      // Use findOneAndUpdate for better performance
      await Booking.findOneAndUpdate(
        { _id: driver.currentBooking },
        { 
          currentLocation: {
            type: 'Point',
            coordinates: [longitude, latitude]
          }
        },
        { new: true }
      );
    }
    
    return res.status(200).json({
      success: true,
      data: driver.currentLocation
    });
  } catch (error) {
    console.error('Error updating driver location:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating location',
      error: error.message
    });
  }
});

// @desc    Assign driver to booking
// @route   PUT /api/driver/assign
// @access  Private/Admin
exports.assignDriver = asyncHandler(async (req, res) => {
  try {
    console.log('Driver assignment request received:', req.body);
    const { driverId, bookingId } = req.body;
    
    if (!driverId || !bookingId) {
      console.log('Missing required fields:', { driverId, bookingId });
      return res.status(400).json({
        success: false,
        message: 'Both driverId and bookingId are required'
      });
    }
    
    // Find driver with populated fields for more detailed info
    const driver = await Driver.findById(driverId)
      .populate('vehicleType', 'name description acAvailable')
      .populate('user', 'name email phone');
      
    if (!driver) {
      console.log(`Driver not found with ID: ${driverId}`);
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    // Validate driver has proper structure
    if (!driver.vehicleType) {
      console.log('Driver has no vehicle type assigned');
    }
    
    // Create safe driver object with null checks
    const safeDriver = {
      _id: driver._id,
      name: driver.user ? driver.user.name : (driver.name || 'Unknown Driver'),
      phone: driver.user ? driver.user.phone : (driver.phone || 'N/A'),
      email: driver.user ? driver.user.email : (driver.email || 'N/A'),
      vehicleType: driver.vehicleType ? {
        _id: driver.vehicleType._id,
        name: driver.vehicleType.name || 'Standard',
        description: driver.vehicleType.description || '',
        acAvailable: driver.vehicleType.acAvailable || false
      } : { name: 'Standard', description: '', acAvailable: false },
      vehicleModel: driver.vehicleModel || 'Standard Vehicle',
      vehicleNumber: driver.vehicleNumber || 'N/A'
    };
  
  // Check if driver is available
  if (!driver.isAvailable) {
    res.status(400);
    throw new Error('Driver is not available');
  }
  
  // Find booking with populated fields for more detailed info
  const booking = await Booking.findById(bookingId)
    .populate('user', 'name email phone')
    .populate('pickupLocation', 'name state')
    .populate('dropLocation', 'name state')
    .populate('cabType', 'name description');
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }
  
  // Check if booking is in valid state
  if (booking.status !== 'confirmed') {
    res.status(400);
    throw new Error(`Booking is in ${booking.status} state and cannot be assigned`);
  }
  
  // Update booking
  booking.driver = driverId;
  booking.status = 'assigned';
  booking.assignedAt = new Date();
  await booking.save();
  
  // Update driver
  driver.isAvailable = false;
  driver.currentBooking = bookingId;
  await driver.save();
  
  // Prepare data for socket emission and response
  const responseData = {
    booking: {
      _id: booking._id,
      pickupLocation: booking.pickupLocation,
      dropLocation: booking.dropLocation,
      date: booking.pickupDate || booking.travelDate,
      status: booking.status,
      customer: booking.user ? { name: booking.user.name, phone: booking.user.phone } : null
    },
    driver: safeDriver
  };
  
  // Emit event via Socket.io if available
  try {
    const io = req.app.get('io');
    if (io) {
      console.log('Emitting socket events for driver assignment');
      io.emit('driverAssigned', responseData);
      
      // Targeted emits for specific rooms
      io.to('admin').emit('bookingUpdated', responseData);
      io.to(`driver_${driver._id}`).emit('newAssignment', responseData);
      
      console.log('Socket events emitted successfully');
    } else {
      console.log('Socket.io not available, skipping real-time updates');
    }
  } catch (socketError) {
    console.error('Socket emission error:', socketError);
    // Continue with the response even if socket emission fails
  }
  
  res.status(200).json({
    success: true,
    data: responseData
  });
  } catch (error) {
    console.error('Error in assignDriver:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign driver',
      error: error.message
    });
  }
});

// @desc    Start trip
// @route   PUT /api/driver/start-trip
// @access  Private/Driver
exports.startTrip = asyncHandler(async (req, res) => {
  const { driverId, bookingId } = req.body;
  
  // Find driver
  const driver = await Driver.findById(driverId);
  if (!driver) {
    res.status(404);
    throw new Error('Driver not found');
  }
  
  // Find booking
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }
  
  // Check if booking is assigned to this driver
  if (booking.driver.toString() !== driverId) {
    res.status(400);
    throw new Error('This booking is not assigned to you');
  }
  
  // Check if booking is in valid state
  if (booking.status !== 'assigned') {
    res.status(400);
    throw new Error(`Booking is in ${booking.status} state and cannot be started`);
  }
  
  // Update booking
  booking.status = 'inProgress';
  booking.startedAt = new Date();
  await booking.save();
  
  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Complete trip
// @route   PUT /api/driver/complete-trip
// @access  Private/Driver
exports.completeTrip = asyncHandler(async (req, res) => {
  const { driverId, bookingId } = req.body;
  
  // Find driver
  const driver = await Driver.findById(driverId);
  if (!driver) {
    res.status(404);
    throw new Error('Driver not found');
  }
  
  // Find booking
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }
  
  // Check if booking is assigned to this driver
  if (booking.driver.toString() !== driverId) {
    res.status(400);
    throw new Error('This booking is not assigned to you');
  }
  
  // Check if booking is in valid state
  if (booking.status !== 'inProgress') {
    res.status(400);
    throw new Error(`Booking is in ${booking.status} state and cannot be completed`);
  }
  
  // Update booking
  booking.status = 'completed';
  booking.completedAt = new Date();
  await booking.save();
  
  // Update driver
  driver.isAvailable = true;
  driver.currentBooking = null;
  driver.totalRides += 1;
  await driver.save();
  
  res.status(200).json({
    success: true,
    data: {
      booking,
      driver
    }
  });
});

// @desc    Get driver's current booking
// @route   GET /api/driver/:id/current-booking
// @access  Private/Driver
exports.getCurrentBooking = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.params.id);
  
  if (!driver) {
    res.status(404);
    throw new Error('Driver not found');
  }
  
  if (!driver.currentBooking) {
    return res.status(200).json({
      success: true,
      data: null
    });
  }
  
  const booking = await Booking.findById(driver.currentBooking)
    .populate('user', 'name')
    .populate('pickupLocation', 'name')
    .populate('dropLocation', 'name')
    .populate('cabType', 'name');
  
  if (!booking) {
    // Booking not found - clear this from driver's currentBooking
    console.log(`Booking ${driver.currentBooking} not found for driver ${driver._id}. Clearing reference.`);
    driver.currentBooking = null;
    await driver.save();
    
    return res.status(200).json({
      success: true,
      data: null
    });
  }
  
  // Check if booking has been canceled but driver's currentBooking hasn't been updated
  if (booking.status === 'cancelled') {
    console.log(`Booking ${booking._id} is cancelled but still referenced by driver ${driver._id}. Cleaning up.`);
    
    // Clear the currentBooking reference and set driver to available
    driver.currentBooking = null;
    driver.isAvailable = true;
    await driver.save();
    
    // Since the booking is canceled, return null to indicate no active booking
    return res.status(200).json({
      success: true,
      data: null
    });
  }
  
  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Get driver's booking history
// @route   GET /api/driver/:id/bookings
// @access  Private/Driver
exports.getDriverBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ driver: req.params.id })
    .populate('user', 'name')
    .populate('pickupLocation', 'name')
    .populate('dropLocation', 'name')
    .populate('cabType', 'name')
    .sort('-createdAt');
  
  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings
  });
});

// @desc    Toggle driver approval status
// @route   PUT /api/driver/:id/approval
// @access  Private/Admin
exports.toggleDriverApproval = asyncHandler(async (req, res) => {
  try {
    const { isApproved } = req.body;
    
    // Check if driver exists
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    // Update approval status
    driver.isApproved = isApproved;
    await driver.save();
    
    // Return updated driver
    res.status(200).json({
      success: true,
      message: `Driver ${isApproved ? 'approved' : 'rejected'} successfully`,
      data: driver
    });
  } catch (error) {
    console.error('Error in toggleDriverApproval:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update driver approval status',
      error: error.message
    });
  }
});
