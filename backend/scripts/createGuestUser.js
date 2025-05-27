/**
 * Script to create a guest user in the MongoDB database
 * This script should be run once to set up the guest user account
 * Run with: node scripts/createGuestUser.js
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

const createGuestUser = async () => {
  try {
    // Check if guest user already exists
    const existingUser = await User.findOne({ email: 'guest@urbanride.com' });
    
    if (existingUser) {
      console.log('Guest user already exists with ID:', existingUser._id);
      console.log('Use this ID in your frontend code for guest bookings');
      return;
    }
    
    // Create the guest user account
    const guestUser = new User({
      name: 'Guest User',
      email: 'guest@urbanride.com',
      password: 'Guest@123',  // This won't be used for login, just for schema validation
      phone: '9999999999',
      role: 'user'
    });
    
    // Save to database
    await guestUser.save();
    
    console.log('Guest user created successfully!');
    console.log('Guest User ID:', guestUser._id);
    console.log('Use this ID in your frontend code for the user field in guest bookings');
    
  } catch (error) {
    console.error('Error creating guest user:', error);
  } finally {
    // Disconnect from MongoDB
    mongoose.disconnect();
  }
};

// Run the function
createGuestUser();
