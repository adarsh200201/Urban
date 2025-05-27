const Booking = require('../models/Booking');
const User = require('../models/User');
const Driver = require('../models/Driver');
const socketManager = require('../utils/socketManager');

/**
 * @desc    User rates a driver
 * @route   POST /api/rating/driver
 * @access  Private
 */
exports.rateDriver = async (req, res) => {
  try {
    const { bookingId, driverId, rating, comment } = req.body;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    // Find the booking to validate
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Verify this is the user's booking
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to rate this booking'
      });
    }
    
    // Verify the booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate completed bookings'
      });
    }
    
    // Verify the driver matches the booking
    if (booking.driver.toString() !== driverId) {
      return res.status(400).json({
        success: false,
        message: 'Driver does not match booking'
      });
    }
    
    // Check if user has already rated this booking
    if (booking.userRating) {
      return res.status(400).json({
        success: false,
        message: 'You have already rated this booking'
      });
    }
    
    // Find the driver to update their ratings
    const driver = await Driver.findById(driverId);
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    // Create the rating object
    const ratingData = {
      rating,
      comment: comment || '',
      createdAt: new Date()
    };
    
    // Update booking with user rating
    booking.userRating = ratingData;
    await booking.save();
    
    // Update driver's average rating
    // Calculate new average rating
    const totalRides = driver.totalRides || 0;
    const currentRating = driver.ratings || 0;
    
    // New weighted average calculation
    const newTotalRides = totalRides + 1;
    const newRating = ((currentRating * totalRides) + rating) / newTotalRides;
    
    // Update driver record
    driver.ratings = newRating;
    driver.totalRides = newTotalRides;
    
    // Add this rating to driver's ratings array if exists
    if (Array.isArray(driver.ratingHistory)) {
      driver.ratingHistory.push({
        bookingId: booking._id,
        rating,
        comment: comment || '',
        user: req.user.id,
        createdAt: new Date()
      });
    }
    
    await driver.save();
    
    // Emit rating event through socket
    socketManager.emitRatingSubmitted({
      bookingId: booking._id,
      bookingNumber: booking.bookingId,
      ratingType: 'userRating',
      rating,
      driverId,
      userId: req.user.id,
      newDriverRating: newRating
    });
    
    return res.status(200).json({
      success: true,
      message: 'Driver rated successfully',
      data: {
        rating: ratingData,
        driverNewRating: newRating
      }
    });
    
  } catch (error) {
    console.error('Rate driver error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error rating driver',
      error: error.message
    });
  }
};

/**
 * @desc    Driver rates a user
 * @route   POST /api/rating/user
 * @access  Private/Driver
 */
exports.rateUser = async (req, res) => {
  try {
    const { bookingId, userId, rating, comment } = req.body;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    // Find the booking to validate
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Verify this is the driver's booking
    if (booking.driver.toString() !== req.driver.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to rate this booking'
      });
    }
    
    // Verify the booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate completed bookings'
      });
    }
    
    // Verify the user matches the booking
    if (booking.user.toString() !== userId) {
      return res.status(400).json({
        success: false,
        message: 'User does not match booking'
      });
    }
    
    // Check if driver has already rated this booking
    if (booking.driverRating) {
      return res.status(400).json({
        success: false,
        message: 'You have already rated this booking'
      });
    }
    
    // Find the user to update their ratings
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Create the rating object
    const ratingData = {
      rating,
      comment: comment || '',
      createdAt: new Date()
    };
    
    // Update booking with driver rating
    booking.driverRating = ratingData;
    await booking.save();
    
    // Update user's average rating if the user model supports it
    if (user.ratings !== undefined) {
      // Calculate new average rating
      const totalRides = user.totalRides || 0;
      const currentRating = user.ratings || 0;
      
      // New weighted average calculation
      const newTotalRides = totalRides + 1;
      const newRating = ((currentRating * totalRides) + rating) / newTotalRides;
      
      // Update user record
      user.ratings = newRating;
      user.totalRides = newTotalRides;
      
      // Add this rating to user's ratings array if exists
      if (Array.isArray(user.ratingHistory)) {
        user.ratingHistory.push({
          bookingId: booking._id,
          rating,
          comment: comment || '',
          driver: req.driver.id,
          createdAt: new Date()
        });
      }
      
      await user.save();
    }
    
    // Emit rating event through socket
    socketManager.emitRatingSubmitted({
      bookingId: booking._id,
      bookingNumber: booking.bookingId,
      ratingType: 'driverRating',
      rating,
      driverId: req.driver.id,
      userId,
      newUserRating: user.ratings
    });
    
    return res.status(200).json({
      success: true,
      message: 'User rated successfully',
      data: {
        rating: ratingData,
        userNewRating: user.ratings
      }
    });
    
  } catch (error) {
    console.error('Rate user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error rating user',
      error: error.message
    });
  }
};

/**
 * @desc    Get driver ratings
 * @route   GET /api/rating/driver/:id
 * @access  Public
 */
exports.getDriverRatings = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    // Return driver rating information
    return res.status(200).json({
      success: true,
      data: {
        averageRating: driver.ratings || 0,
        totalRides: driver.totalRides || 0,
        ratingHistory: driver.ratingHistory || []
      }
    });
    
  } catch (error) {
    console.error('Get driver ratings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching driver ratings',
      error: error.message
    });
  }
};

/**
 * @desc    Get user ratings
 * @route   GET /api/rating/user/:id
 * @access  Private/Admin
 */
exports.getUserRatings = async (req, res) => {
  try {
    // Only admins can view user ratings, unless it's their own
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these ratings'
      });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Return user rating information if available
    return res.status(200).json({
      success: true,
      data: {
        averageRating: user.ratings || 0,
        totalRides: user.totalRides || 0,
        ratingHistory: user.ratingHistory || []
      }
    });
    
  } catch (error) {
    console.error('Get user ratings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching user ratings',
      error: error.message
    });
  }
};
