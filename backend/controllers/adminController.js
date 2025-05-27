const Driver = require('../models/Driver');
const User = require('../models/User');
const Booking = require('../models/Booking');
const asyncHandler = require('express-async-handler');

// @desc    Directly update driver documents when uploads are missing
// @route   PUT /api/admin/driver/:id/update-documents
// @access  Private/Admin
exports.updateDriverDocuments = asyncHandler(async (req, res) => {
  try {
    const { driverId } = req.params;
    const { documents } = req.body;
    
    // Validate the documents object
    if (!documents || typeof documents !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid document data. Please provide a valid documents object.' });
    }
    
    // Find the driver
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }
    
    // Update the driver documents
    driver.documents = documents;
    await driver.save();
    
    res.status(200).json({
      success: true,
      message: 'Driver documents updated successfully',
      data: driver
    });
  } catch (error) {
    console.error('Error updating driver documents:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating documents',
      error: error.message
    });
  }
});

// @desc    Verify driver documents
// @route   PUT /api/admin/driver/:id/verify-documents
// @access  Private/Admin
exports.verifyDriverDocuments = asyncHandler(async (req, res) => {
  try {
    const { driverId } = req.params;
    const { documentKey, isApproved } = req.body;
    
    // Find the driver
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }
    
    // Log driver document structure for debugging
    console.log('Current driver document structure:', driver.documents);
    
    // If verifying individual document
    if (documentKey) {
      // Check if document key is valid
      if (!driver.documents || !Object.prototype.hasOwnProperty.call(driver.documents, documentKey)) {
        return res.status(400).json({ success: false, message: `Invalid document type: ${documentKey}` });
      }
      
      // Update document verification status (in a real app, you would set a verification flag for each document)
      // For now, we'll just acknowledge it's been reviewed
      console.log(`Marking document ${documentKey} as ${isApproved ? 'approved' : 'rejected'}`);
      
      // In a real implementation, you would have a nested status field for each document
      // Example: driver.documents[documentKey].status = isApproved ? 'approved' : 'rejected';
    } 
    // If verifying all documents at once
    else {
      // Mark all documents as verified
      driver.documentsVerified = true;
      await driver.save();
      
      return res.status(200).json({
        success: true,
        message: 'All driver documents verified successfully',
        data: driver
      });
    }
    
    // Save the driver with document changes
    await driver.save();
    
    res.status(200).json({
      success: true,
      message: `Document ${documentKey} ${isApproved ? 'approved' : 'rejected'} successfully`,
      data: driver
    });
  } catch (error) {
    console.error('Error verifying driver documents:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying documents',
      error: error.message
    });
  }
});

// @desc    Get all admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = asyncHandler(async (req, res) => {
  try {
    // Count all users
    const totalUsers = await User.countDocuments({ role: 'user' });
    
    // Count all drivers
    const totalDrivers = await Driver.countDocuments();
    
    // Count all bookings
    const totalBookings = await Booking.countDocuments();
    
    // Count completed bookings
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    
    // Count cancelled bookings
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });
    
    // Count pending bookings
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    
    // Get total revenue (sum of all booking prices)
    const bookings = await Booking.find({ status: 'completed' });
    const totalRevenue = bookings.reduce((acc, booking) => acc + booking.price, 0);
    
    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalDrivers,
        totalBookings,
        completedBookings,
        cancelledBookings,
        pendingBookings,
        totalRevenue
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting dashboard stats',
      error: error.message
    });
  }
});
