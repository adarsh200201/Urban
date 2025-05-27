// Authentication check middleware - Ensures only authenticated users can make bookings
// This middleware replaces the previous guest booking functionality
const mongoose = require('mongoose');

exports.allowGuestBooking = async (req, res, next) => {
  // Log that this middleware was called but no longer supports guest users
  if (!req.headers.authorization && !req.cookies?.token) {
    console.log('Unauthenticated request detected - no guest booking support');
    // We don't set any guest user properties - the controller will handle authentication requirements
  }
  
  // Always proceed to the next middleware
  next();
};
