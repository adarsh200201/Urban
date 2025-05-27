const Booking = require('../models/Booking');
const User = require('../models/User');
const CabType = require('../models/CabType');
const City = require('../models/City');
const Route = require('../models/Route');
const sendEmail = require('../utils/sendEmail');
const { calculateDistanceBetweenCities, calculateFare, CITY_COORDINATES } = require('../utils/distanceCalculator');

// @desc    Create a new booking
// @route   POST /api/booking
// @access  Public
exports.createBooking = async (req, res) => {
  try {
    // Support both the original format and the simplified format from frontend
    const {
      cabType,          // For simplified frontend flow
      pickupLocation,   // For simplified frontend flow
      dropLocation,     // For simplified frontend flow
      cabTypeId,        // Original format
      pickupLocationId, // Original format
      dropLocationId,   // Original format
      pickupAddress,
      dropAddress,
      journeyType,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      baseAmount,       // For simplified frontend flow
      taxAmount,        // For simplified frontend flow
      totalAmount,      // For simplified frontend flow
      distance,
      duration,
      passengerDetails,
      additionalNotes
    } = req.body;

    // Create a booking ID (CB prefix + timestamp)
    const bookingId = 'CB' + Date.now().toString().slice(-8);
    
    // Allow simplified booking flow from frontend
    let bookingData = {
      bookingId,
      cabType: cabType || cabTypeId,
      pickupLocation: pickupLocation || pickupLocationId,
      dropLocation: dropLocation || dropLocationId,
      pickupAddress: pickupAddress || (pickupLocation || pickupLocationId),
      dropAddress: dropAddress || (dropLocation || dropLocationId),
      journeyType: journeyType || 'oneWay',
      pickupDate: pickupDate || new Date(),
      pickupTime: pickupTime || '10:00',
      distance: distance || 0,
      baseAmount: baseAmount || 0,
      taxAmount: taxAmount || 0,
      totalAmount: totalAmount || 0,
      passengerDetails: passengerDetails || {},
      status: 'pending',
      paymentStatus: 'pending'
    };
    
    // User must be authenticated - no guest bookings allowed
    console.log('Creating booking with authentication check');
    console.log('Request user:', req.user ? `ID: ${req.user.id}` : 'Not set by middleware');
    console.log('Request body user ID:', req.body.user || 'Not provided');
    
    // Accept authentication from middleware or direct user ID in request body
    if (req.user) {
      // User authenticated via middleware/token
      console.log('Using authenticated user from middleware');
      bookingData.user = req.user.id;
    } else if (req.body.user) {
      // Direct user ID in request body - allow this for frontend compatibility
      console.log('Using user ID directly from request body:', req.body.user);
      bookingData.user = req.body.user;
      
      // Validate that this is a real user ID in MongoDB
      try {
        const userExists = await User.findById(req.body.user);
        if (!userExists) {
          console.log('User ID from request body is invalid');
          return res.status(400).json({
            success: false,
            message: 'Invalid user ID provided'
          });
        }
        console.log('Confirmed valid user ID from request body');
      } catch (err) {
        console.log('Error validating user ID:', err.message);
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format'
        });
      }
    } else {
      // No user authentication available
      console.log('No authentication provided - rejecting booking request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Only lookup cab type and cities if we're using the original format
    if (cabTypeId && pickupLocationId && dropLocationId) {
      // Check if cab type exists using the original format
      const cabTypeObj = await CabType.findById(cabTypeId);
      if (!cabTypeObj) {
        return res.status(404).json({
          success: false,
          message: 'Cab type not found'
        });
      }

      // Check if cities exist
      const pickupLocationObj = await City.findById(pickupLocationId);
      const dropLocationObj = await City.findById(dropLocationId);
      if (!pickupLocationObj || !dropLocationObj) {
        return res.status(404).json({
          success: false,
          message: 'One or more city locations not found'
        });
      }
      
      // Update booking data with found objects
      bookingData.cabType = cabTypeObj;
      bookingData.pickupLocation = pickupLocationObj;
      bookingData.dropLocation = dropLocationObj;
    }

    // Calculate fare
    let fareBaseAmount, fareTaxAmount, tollCharges = 0, driverAllowance = 0, nightCharges = 0;
    
    // Only calculate fare if baseAmount is not provided in the request
    if (!bookingData.baseAmount) {
      // Try to get route details for fare calculation
      const route = await Route.findOne({
        fromCity: bookingData.pickupLocation,
        toCity: bookingData.dropLocation
      });
      
      // Estimate distance if not provided
      const calculatedDistance = bookingData.distance || (route ? route.distance : 0);
      
      // Base amount calculation (simplified for guest bookings)
      if (bookingData.journeyType === 'oneWay') {
        fareBaseAmount = calculatedDistance * 10; // Default rate of 10 per km if cab type not found
      } else if (bookingData.journeyType === 'roundTrip') {
        fareBaseAmount = 2 * calculatedDistance * 10; // Default rate for round trip
      }
      
      // Tax (5% of base amount)
      fareTaxAmount = fareBaseAmount * 0.05;
      
      // Calculate toll charges (if applicable)
      tollCharges = route ? route.tollCharges || 0 : 0;
      
      // Driver allowance (for long distance or round trips)
      if (calculatedDistance > 80 || bookingData.journeyType === 'roundTrip') {
        driverAllowance = 500; // Fixed amount for driver accommodation
      }
      
      // Night charges (if pickup time is between 10 PM and 5 AM)
      const pickupTimeHour = parseInt(bookingData.pickupTime.split(':')[0]);
      if (pickupTimeHour >= 22 || pickupTimeHour <= 5) {
        nightCharges = fareBaseAmount * 0.1; // 10% of base amount
      }
      
      // Update booking data with calculated amounts
      bookingData.baseAmount = fareBaseAmount;
      bookingData.taxAmount = fareTaxAmount;
      bookingData.tollCharges = tollCharges;
      bookingData.driverAllowance = driverAllowance;
      bookingData.nightCharges = nightCharges;
      bookingData.totalAmount = fareBaseAmount + fareTaxAmount + tollCharges + driverAllowance + nightCharges;
    }

    // Create booking with the prepared data
    const booking = await Booking.create(bookingData);

    // Send email confirmation
    try {
      await sendEmail({
        email: passengerDetails.email,
        subject: 'Your Booking Confirmation',
        message: `Your booking has been created successfully. Your booking ID is ${booking.bookingId}. Please proceed to payment to confirm your booking.`
      });
    } catch (err) {
      console.log('Email could not be sent', err);
    }

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
};

// @desc    Get all user bookings or all bookings if admin
// @route   GET /api/booking
// @access  Private
exports.getUserBookings = async (req, res) => {
  try {
    let query = {};
    
    // If user is authenticated, filter by user ID
    if (req.user && req.user.id) {
      // If user is admin, return all bookings
      if (req.user.role === 'admin') {
        // Admin sees all bookings
        console.log('Admin user detected - returning all bookings');
      } else {
        // Regular user sees only their bookings
        query = { user: req.user.id };
        console.log(`User ${req.user.id} - returning their bookings only`);
      }
    } else {
      // No authentication, return a limited set of bookings for demo purposes
      console.log('No authentication - returning sample bookings for demo');
    }
    
    const bookings = await Booking.find(query)
      .populate('cabType', 'name imageUrl')
      .populate('pickupLocation', 'name state')
      .populate('dropLocation', 'name state')
      .sort({ createdAt: -1 })
      .limit(20); // Limit to 20 bookings for safety

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

// @desc    Get booking by ID
// @route   GET /api/booking/:id
// @access  Private
exports.getBookingById = async (req, res) => {
  try {
    console.log(`Fetching booking by MongoDB ID: ${req.params.id}`);
    
    const booking = await Booking.findById(req.params.id)
      .populate('cabType', 'name imageUrl seatingCapacity luggageCapacity features')
      .populate('pickupLocation', 'name state')
      .populate('dropLocation', 'name state')
      .populate('driver', 'name email phone licenseNumber vehicleModel vehicleNumber isAvailable ratings totalRides');

    // Check if booking exists
    if (!booking) {
      console.log(`Booking not found with MongoDB ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is authorized to view this booking
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      console.log(`User ${req.user.id} not authorized to view booking ${req.params.id}`);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }
    
    console.log(`Booking found with status: ${booking.status}`);
    console.log(`Driver information: ${booking.driver ? 'Available' : 'Not assigned'}`);

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching booking by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
      error: error.message
    });
  }
};

// @desc    Get booking by booking ID
// @route   GET /api/booking/track/:bookingId
// @access  Public
exports.getBookingByBookingId = async (req, res) => {
  try {
    console.log(`Fetching booking by ID: ${req.params.bookingId}`);
    
    const booking = await Booking.findOne({ bookingId: req.params.bookingId })
      .populate('cabType', 'name imageUrl seatingCapacity luggageCapacity features')
      .populate('pickupLocation', 'name state')
      .populate('dropLocation', 'name state')
      .populate('driver', 'name email phone licenseNumber vehicleModel vehicleNumber isAvailable ratings totalRides');

    if (!booking) {
      console.log(`Booking not found with ID: ${req.params.bookingId}`);
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    console.log(`Booking found with status: ${booking.status}`);
    console.log(`Driver information: ${booking.driver ? 'Available' : 'Not assigned'}`);
    
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
      error: error.message
    });
  }
};

// @desc    Update booking status
// @route   PUT /api/booking/:id
// @access  Private
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide status to update'
      });
    }

    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Only admin can update booking status
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update booking status'
      });
    }

    booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    // Send email notification about status update
    try {
      await sendEmail({
        email: booking.passengerDetails.email,
        subject: 'Booking Status Updated',
        message: `Your booking status has been updated to ${status}. Your booking ID is ${booking.bookingId}.`
      });
    } catch (err) {
      console.log('Email could not be sent', err);
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: error.message
    });
  }
};

// @desc    Cancel booking
// @route   PUT /api/booking/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    let booking = await Booking.findById(req.params.id)
      .populate('driver');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if the booking belongs to the logged-in user or if user is admin
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Check if booking is already completed
    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed booking'
      });
    }

    // Save the driver ID before updating the booking status
    const driverId = booking.driver ? booking.driver._id || booking.driver : null;
    const previousStatus = booking.status;

    booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );

    // If the booking had a driver assigned, update the driver's availability
    if (driverId && (previousStatus === 'assigned' || previousStatus === 'inProgress')) {
      try {
        console.log(`Updating driver ${driverId} availability to Available after booking cancellation`);
        
        // Import the Driver model if it's not already imported at the top of the file
        const Driver = require('../models/Driver');
        
        // Update driver status to available and remove currentBooking reference
        await Driver.findByIdAndUpdate(
          driverId,
          {
            isAvailable: true,
            currentBooking: null
          },
          { new: true }
        );
        
        // Emit socket event to notify driver of cancellation if socket.io is available
        if (req.app.get('io')) {
          const io = req.app.get('io');
          io.to(`driver_${driverId}`).emit('bookingCancelled', {
            bookingId: booking.bookingId,
            message: 'Booking has been cancelled by the user'
          });
        }
      } catch (driverUpdateError) {
        console.error('Error updating driver availability:', driverUpdateError);
        // Continue with the booking cancellation even if driver update fails
      }
    }

    // Send email notification about cancellation
    try {
      await sendEmail({
        email: booking.passengerDetails.email,
        subject: 'Booking Cancelled',
        message: `Your booking with ID ${booking.bookingId} has been cancelled. If you have made any payment, it will be refunded within 5-7 business days.`
      });
    } catch (err) {
      console.log('Email could not be sent', err);
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
};

// @desc    Update booking payment method with custom ID
// @route   PUT /api/booking/payment-update/custom
// @access  Public
exports.updatePaymentMethodCustom = async (req, res) => {
  try {
    const { bookingId, paymentId, paymentStatus, paymentMethod } = req.body;

    console.log(`Processing CUSTOM payment update for booking: ${bookingId}`);
    console.log('Payment details:', { paymentId, paymentStatus, paymentMethod });

    // Validate required fields
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a booking ID'
      });
    }

    if (!paymentMethod && !paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide payment method or payment ID'
      });
    }

    // Find the booking using the bookingId field (NOT the _id field)
    let booking = null;
    
    try {
      console.log('Looking up booking with bookingId field:', bookingId);
      booking = await Booking.findOne({ bookingId: bookingId }).exec();
      console.log('Lookup result:', booking ? 'Found' : 'Not found');
    } catch (lookupError) {
      console.error('Error in custom booking lookup:', lookupError.message);
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking found with ID: ${bookingId}`
      });
    }

    console.log('Found booking:', booking.bookingId);

    // Update booking with payment information
    if (paymentMethod) booking.paymentMethod = paymentMethod;
    if (paymentId) booking.paymentId = paymentId;
    if (paymentStatus) booking.paymentStatus = paymentStatus;
    
    // Update booking status based on payment status
    if (paymentStatus === 'completed' || paymentMethod === 'online') {
      booking.status = 'confirmed';
      booking.paymentStatus = 'completed';
    } else if (paymentMethod === 'cod') {
      booking.paymentStatus = 'pending';
      booking.status = 'confirmed';
    }

    // Save the updated booking
    try {
      const updatedBooking = await booking.save();
      console.log('Custom booking payment updated successfully');

      return res.status(200).json({
        success: true,
        data: updatedBooking,
        message: 'Payment information updated successfully for custom booking'
      });
    } catch (saveError) {
      console.error('Error saving custom booking:', saveError.message);
      return res.status(500).json({
        success: false,
        message: 'Error updating booking in database',
        error: saveError.message
      });
    }
  } catch (error) {
    console.error('Error in custom payment update process:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during custom payment update',
      error: error.message
    });
  }
};

// @desc    Update booking payment method
// @route   PUT /api/booking/:id/payment-method
// @access  Public
exports.updatePaymentMethod = async (req, res) => {
  try {
    // Check if we're coming from the custom route or the normal route
    const bookingId = req.params.bookingId || req.params.id;
    const { paymentId, paymentStatus, paymentMethod, customBookingId } = req.body;

    // Use the most specific ID available
    const bookingIdToUse = customBookingId || bookingId;
    
    console.log(`Processing payment update for booking: ${bookingIdToUse}`);
    console.log('Payment details:', { paymentId, paymentStatus, paymentMethod, customBookingId });
    console.log('Route parameters:', req.params);

    // Validate required fields
    if (!paymentMethod && !paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide payment method or payment ID'
      });
    }

    // Handle local ID storage format
    if (bookingIdToUse.includes('local-')) {
      console.log('Local booking ID detected - cannot update on server');
      return res.status(400).json({
        success: false,
        message: 'Local bookings can only be updated in browser storage'
      });
    }

    // Find the booking based on the appropriate ID type
    let booking = null;
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(bookingIdToUse);
    const isCustomId = bookingIdToUse.startsWith('CB') || /^[A-Z0-9]+$/.test(bookingIdToUse);

    try {
      // Custom booking ID - use bookingId field in the database
      if (isCustomId) {
        console.log('Using custom booking ID lookup:', bookingIdToUse);
        booking = await Booking.findOne({ bookingId: bookingIdToUse }).exec();
      } 
      // MongoDB ObjectId - use standard findById
      else if (isMongoId) {
        console.log('Using MongoDB ID lookup:', bookingIdToUse);
        booking = await Booking.findById(bookingIdToUse).exec();
      }
      
      console.log('Booking lookup result:', booking ? 'Found' : 'Not found');
      
      // If still not found, try alternative methods
      if (!booking) {
        console.log('Trying alternative lookup methods...');
        try {
          // Try the opposite approach as a fallback
          if (isMongoId) {
            booking = await Booking.findOne({ bookingId: bookingIdToUse }).exec();
          } else {
            booking = await Booking.find({ bookingId: bookingIdToUse }).limit(1)
              .then(results => results && results.length > 0 ? results[0] : null);
          }
        } catch (fallbackError) {
          console.log('Fallback lookup failed:', fallbackError.message);
        }
      }
    } catch (lookupError) {
      console.error('Error looking up booking:', lookupError.message);
    }

    // If booking not found with either method
    if (!booking) {
      console.log(`No booking found with ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Booking not found with the provided ID'
      });
    }

    console.log('Booking found:', booking.bookingId || booking._id);

    // Update booking with payment information
    if (paymentMethod) booking.paymentMethod = paymentMethod;
    if (paymentId) booking.paymentId = paymentId;
    if (paymentStatus) booking.paymentStatus = paymentStatus;
    
    // Update booking status based on payment status
    if (paymentStatus === 'completed' || paymentMethod === 'online') {
      booking.status = 'confirmed';
      booking.paymentStatus = 'completed';
    } else if (paymentMethod === 'cod') {
      booking.paymentStatus = 'pending';
      booking.status = 'confirmed';
    }

    // Save the updated booking
    try {
      const updatedBooking = await booking.save();
      console.log('Booking updated successfully');

      return res.status(200).json({
        success: true,
        data: updatedBooking,
        message: 'Payment information updated successfully'
      });
    } catch (saveError) {
      console.error('Error saving booking:', saveError);
      return res.status(500).json({
        success: false,
        message: 'Error updating booking in database',
        error: saveError.message
      });
    }
  } catch (error) {
    console.error('Error in payment update process:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during payment update',
      error: error.message
    });
  }
};

// @desc    Get confirmed bookings that need driver assignment
// @route   GET /api/booking/confirmed
// @access  Private/Admin
exports.getConfirmedBookings = async (req, res) => {
  try {
    console.log('Fetching confirmed bookings for admin');
    
    // Find bookings with status 'confirmed' and no driver assigned
    const bookings = await Booking.find({ 
      status: 'confirmed',
      driver: { $exists: false }
    })
      .populate('cabType', 'name')
      .populate('pickupLocation', 'name state')
      .populate('dropLocation', 'name state')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${bookings.length} confirmed bookings without drivers assigned`);

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching confirmed bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

// @desc    Get all bookings (admin only)
// @route   GET /api/booking/admin/all
// @access  Private/Admin
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('user', 'name email phone')
      .populate('driver', 'name phone vehicleDetails')
      .populate('cabType', 'name')
      .populate('pickupLocation', 'name state')
      .populate('dropLocation', 'name state')
      .sort({ createdAt: -1 });
      
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Assign driver to booking
// @route   PUT /api/booking/assign-driver
// @access  Private/Admin
exports.assignDriverToBooking = async (req, res) => {
  try {
    console.log('Request body for driver assignment:', req.body);
    const { bookingId, driverId } = req.body;
    
    if (!bookingId || !driverId) {
      console.log('Missing required fields for driver assignment');
      return res.status(400).json({
        success: false,
        message: 'Both bookingId and driverId are required'
      });
    }
    
    console.log(`Received assignment request - Booking ID: ${bookingId}, Driver ID: ${driverId}`);
    
    // First, try to verify if this driver exists in the system
    const Driver = require('../models/Driver');
    let driverExists = false;
    try {
      const driver = await Driver.findById(driverId);
      if (driver) {
        console.log(`Driver exists with ID ${driverId}`);
        driverExists = true;
      } else {
        console.log(`No driver found with ID ${driverId}`);
      }
    } catch (driverCheckError) {
      console.error('Error checking driver existence:', driverCheckError);
    }

    console.log(`Assigning driver ${driverId} to booking ${bookingId}`);
    
    // Find the booking - attempt with both direct ID and bookingId field
    let booking;
    try {
      // First try with the ID directly
      booking = await Booking.findById(bookingId);
      
      // If not found, try with bookingId field
      if (!booking) {
        console.log(`Booking not found with _id: ${bookingId}, trying bookingId field`);
        booking = await Booking.findOne({ bookingId: bookingId });
      }
      
      if (!booking) {
        console.log(`Booking not found with any ID: ${bookingId}`);
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
          details: { searchedId: bookingId }
        });
      }
      
      console.log(`Found booking: ${booking._id} / ${booking.bookingId || 'No booking ID'}`);
    } catch (findError) {
      console.error('Error finding booking:', findError);
      return res.status(500).json({
        success: false,
        message: 'Error searching for booking',
        error: findError.message
      });
    }
    
    // Use a simplified approach to find the driver
    let driver = null;
    let driverDetails = {
      _id: driverId,
      name: 'Unknown Driver',
      phone: 'N/A',
      vehicleModel: 'Standard Vehicle',
      vehicleNumber: 'N/A'
    };
    
    try {
      // Try with the ID directly - lean() returns a plain JavaScript object
      const driverResult = await Driver.findById(driverId)
        .populate('vehicleType', 'name description acAvailable')
        .populate('user', 'name email phone')
        .lean();
      
      if (driverResult) {
        driver = driverResult;
        console.log(`Found driver: ${driver._id}`);
        
        // Safely extract user info if available
        if (driver.user) {
          console.log(`Driver linked to user: ${driver.user._id || 'No user ID'}`);
          driverDetails.name = driver.user.name || 'Unknown Driver';
          driverDetails.phone = driver.user.phone || 'N/A';
        } else if (driver.name) {
          console.log(`Driver has direct name: ${driver.name}`);
          driverDetails.name = driver.name;
          driverDetails.phone = driver.phone || 'N/A';
        } else {
          console.log('Driver has no user object or direct name');
        }
        
        // Safely extract vehicle info
        if (driver.vehicleType) {
          driverDetails.vehicleType = driver.vehicleType.name || 'Standard';
        }
        driverDetails.vehicleModel = driver.vehicleModel || 'Standard Vehicle';
        driverDetails.vehicleNumber = driver.vehicleNumber || 'N/A';
      } else {
        // If driver not found, we'll create a booking with placeholder driver info
        console.log(`Driver not found with ID: ${driverId}, using placeholder data`);
      }
    } catch (findError) {
      console.error('Error finding driver:', findError);
      return res.status(500).json({
        success: false,
        message: 'Error searching for driver',
        error: findError.message
      });
    }
    
    // We can proceed with assignment even if the driver object is null
    // We'll just use the placeholder driver details we created
    
    // If we have a real driver object, check availability
    if (driver && driver.isAvailable === false) {
      console.log(`Driver ${driverId} is not available`);
      // We're not returning an error, just logging it, but continuing
      // This allows assignment to proceed even with potential data issues
    }
    
    // Log driver details for debugging
    console.log('Driver details being used:', driverDetails);
    
    // Assign driver to booking
    booking.driver = driverId;
    booking.status = 'assigned';
    
    // Save the booking
    await booking.save();
    
    // Update driver status if we have a valid driver object
    if (driver) {
      try {
        // Since we used lean() earlier, we need to find the actual document to update
        const driverDoc = await Driver.findById(driverId);
        if (driverDoc) {
          driverDoc.isAvailable = false;
          driverDoc.currentBooking = bookingId;
          await driverDoc.save();
          console.log(`Driver ${driverId} marked as unavailable and assigned to booking`);
        } else {
          console.log(`Could not find driver document to update`);
        }
      } catch (driverUpdateError) {
        console.error('Error updating driver:', driverUpdateError);
        // Continue with the function, don't stop the booking assignment
      }
    } else {
      console.log('No driver object to update, continuing with booking assignment only');
    }
    
    // Prepare safe data objects for socket events
    // Use our driverDetails object that has all the null checks built in
    const safeDriverData = driverDetails;
    
    const safeBookingData = {
      _id: booking._id,
      bookingId: booking.bookingId || 'CB-' + Date.now(),
      pickupDate: booking.pickupDate || new Date(),
      pickupTime: booking.pickupTime || '12:00',
      status: 'assigned',
      pickupLocation: booking.pickupLocation || { name: 'Unknown Location' },
      dropLocation: booking.dropLocation || { name: 'Unknown Location' },
      totalAmount: booking.totalAmount || 0
    };
    
    // Send real-time update via Socket.io
    if (req.app.get('io')) {
      try {
        const io = req.app.get('io');
        const eventPayload = {
          booking: safeBookingData,
          driver: safeDriverData
        };
        
        // Log the payload to verify it's valid before sending
        console.log('Socket event payload:', JSON.stringify(eventPayload));
        
        // Emit to admin room
        io.to('admin').emit('driver-assigned', eventPayload);
        
        // Emit to driver's room - handle potential invalid ID
        if (driverId) {
          io.to(`driver_${driverId}`).emit('driverAssigned', eventPayload);
        }
        
        // Also emit to the general channel for any clients listening
        io.emit('booking-updated', eventPayload);
        
        console.log('Socket.io: Real-time updates sent successfully');
      } catch (socketError) {
        console.error('Socket.io: Error sending real-time updates', socketError);
        // Don't fail the API call if socket emission fails
      }
    } else {
      console.log('Socket.io not initialized, skipping real-time updates');
    }
    
    console.log(`Driver ${driverId} successfully assigned to booking ${bookingId}`);
    
    res.status(200).json({
      success: true,
      data: {
        booking: safeBookingData,
        driver: safeDriverData
      },
      message: 'Driver assigned successfully'
    });
  } catch (error) {
    console.error('Error assigning driver:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign driver',
      error: error.message
    });
  }
};
