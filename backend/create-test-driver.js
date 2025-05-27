// Create test driver script - direct database access
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Import models
const User = require('./models/User');
const Driver = require('./models/Driver');
const CabType = require('./models/CabType');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Function to create a test driver
async function createTestDriver() {
  try {
    // Generate a unique email and other identifiers
    const timestamp = Date.now();
    const testDriver = {
      name: 'Test Driver',
      email: `test-driver-${timestamp}@example.com`,
      phone: '9876543210',
      password: '123456',
      vehicleModel: 'Test Model',
      vehicleNumber: `TN-${timestamp}`,
      licenseNumber: `LIC-${timestamp}`,
      licenseExpiry: '2025-12-31'
    };
    
    console.log('Creating test driver with data:', testDriver);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testDriver.password, salt);
    
    // Create user
    const user = await User.create({
      name: testDriver.name,
      email: testDriver.email,
      phone: testDriver.phone,
      password: hashedPassword,
      role: 'driver'
    });
    
    console.log('User created:', user);

    // Find a cab type
    let cabType = await CabType.findOne();
    if (!cabType) {
      cabType = await CabType.create({
        name: 'Standard',
        description: 'Standard cab with AC',
        acType: 'AC',
        seatingCapacity: 4,
        luggageCapacity: 2,
        baseKmPrice: 10,
        extraFarePerKm: 2,
        includedKm: 5
      });
      console.log('Created default cab type:', cabType);
    }

    // Create a test document path
    const documentPath = `/uploads/driver_documents/test_${user._id}.pdf`;
    
    // Create driver instance with validation bypass
    const driverData = {
      user: user._id,
      licenseNumber: testDriver.licenseNumber,
      licenseExpiry: testDriver.licenseExpiry,
      vehicleNumber: testDriver.vehicleNumber,
      vehicleModel: testDriver.vehicleModel,
      vehicleType: cabType._id,
      documentsPath: documentPath,
      ratings: 5 // Use a valid rating to avoid validation issues
    };
    
    // Create the driver directly using the model constructor
    const newDriver = new Driver(driverData);
    
    // Save with validation set to false
    const driver = await newDriver.save({ validateBeforeSave: false });
    
    console.log('Driver profile created successfully:', driver);
    
    console.log('\n======= TEST ACCOUNT CREATED SUCCESSFULLY =======');
    console.log('Email:', testDriver.email);
    console.log('Password:', testDriver.password);
    console.log('Use these credentials to test the driver login functionality');
    console.log('==================================================\n');
    
    return {
      success: true,
      user,
      driver,
      credentials: {
        email: testDriver.email,
        password: '123456'
      }
    };
  } catch (error) {
    console.error('Error creating test driver:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
console.log('Creating a test driver account...');
createTestDriver();
