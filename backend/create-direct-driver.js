// Create a driver directly in the database
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
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

// Create test driver function
async function createTestDriver() {
  try {
    console.log('Starting direct driver creation...');
    
    // Generate unique identifiers
    const timestamp = Date.now();
    const testData = {
      name: 'Test Driver',
      email: `test-driver-${timestamp}@example.com`,
      phone: '9876543210',
      password: '123456',
      vehicleModel: 'Test Model',
      vehicleNumber: `TN-${timestamp}`,
      licenseNumber: `LIC-${timestamp}`,
      licenseExpiry: '2025-12-31'
    };
    
    console.log('Test data:', testData);
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testData.password, salt);
    
    // Create user
    const user = await User.create({
      name: testData.name,
      email: testData.email,
      phone: testData.phone,
      password: hashedPassword,
      role: 'driver'
    });
    
    console.log('User created:', {
      id: user._id,
      name: user.name,
      email: user.email
    });
    
    // Find or create cab type
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
      console.log('Created cab type:', cabType);
    }
    
    // Create a driver document directly without validations
    const driver = new Driver({
      user: user._id,
      licenseNumber: testData.licenseNumber,
      licenseExpiry: testData.licenseExpiry,
      vehicleNumber: testData.vehicleNumber,
      vehicleModel: testData.vehicleModel,
      vehicleType: cabType._id,
      documentsPath: '/uploads/driver_documents/test.pdf',
      ratings: 0 // Make sure this matches the updated min value
    });
    
    // Save with validation disabled
    const savedDriver = await driver.save({ validateBeforeSave: false });
    
    console.log('Driver created successfully:', {
      id: savedDriver._id,
      licenseNumber: savedDriver.licenseNumber,
      vehicleNumber: savedDriver.vehicleNumber
    });
    
    console.log('\n=== TEST ACCOUNT CREATED ===');
    console.log('Email:', testData.email);
    console.log('Password:', testData.password);
    console.log('========================\n');
    
  } catch (error) {
    console.error('Error creating driver:', error);
    
    // Log detailed error information
    if (error.name === 'ValidationError') {
      console.error('Validation errors:');
      for (const field in error.errors) {
        console.error(`- ${field}: ${error.errors[field].message}`);
      }
    }
    
    if (error.name === 'MongoServerError' && error.code === 11000) {
      console.error('Duplicate key error:', error.keyValue);
    }
    
    // Log the full stack trace
    console.error('Stack trace:', error.stack);
  } finally {
    // Close the MongoDB connection
    setTimeout(() => {
      mongoose.connection.close();
      console.log('MongoDB connection closed');
    }, 1000);
  }
}

// Run the function
createTestDriver();
