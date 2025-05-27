// Script to clear all bookings from the database
require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    clearAllBookings();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function clearAllBookings() {
  try {
    // Delete all documents from the bookings collection
    const result = await Booking.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} bookings from the database`);
    
    // Close the connection after operation completes
    mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error deleting bookings:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}
