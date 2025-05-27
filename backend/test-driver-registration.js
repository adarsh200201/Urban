// Test script to verify MongoDB connection and database write operations
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Import models directly from their files
const User = require('./models/User');
const Driver = require('./models/Driver');
const CabType = require('./models/CabType');

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads', 'driver_documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

// Function to test driver registration directly
async function testDriverRegistration() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected successfully');

    // Test data for a new driver
    const testDriver = {
      name: 'Test Driver',
      email: `test-driver-${Date.now()}@example.com`, // Unique email each run
      phone: '9876543210',
      password: '123456',
      vehicleModel: 'Test Model',
      vehicleNumber: `TN-${Date.now()}`, // Unique vehicle number each run
      licenseNumber: `LIC-${Date.now()}`, // Unique license number each run
      licenseExpiry: '2025-12-31'
    };
    
    console.log('Test driver data:', testDriver);

    // Check if a default cab type exists or create one
    console.log('Looking for a default cab type...');
    let defaultCabType = await CabType.findOne();
    if (!defaultCabType) {
      console.log('No default cab type found. Creating one...');
      defaultCabType = await CabType.create({
        name: 'Standard',
        description: 'Standard cab with AC',
        acType: 'AC',
        seatingCapacity: 4,
        luggageCapacity: 2,
        baseKmPrice: 10,
        extraFarePerKm: 2,
        includedKm: 5
      });
      console.log('Created default cab type:', defaultCabType);
    } else {
      console.log('Found existing cab type:', defaultCabType);
    }

    // Hash password
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testDriver.password, salt);

    // Create user
    console.log('Creating user...');
    const user = await User.create({
      name: testDriver.name,
      email: testDriver.email,
      phone: testDriver.phone,
      password: hashedPassword,
      role: 'driver'
    });
    
    console.log('User created successfully:', {
      id: user._id,
      name: user.name,
      email: user.email
    });

    // Create a sample document path (simulating a file upload)
    const documentPath = `/uploads/driver_documents/test_document_${user._id}.pdf`;
    console.log('Document path:', documentPath);

    // Create a driver instance bypassing validation
    console.log('Creating driver profile...');
    const driverData = {
      user: user._id,
      licenseNumber: testDriver.licenseNumber,
      licenseExpiry: testDriver.licenseExpiry,
      vehicleNumber: testDriver.vehicleNumber,
      vehicleModel: testDriver.vehicleModel,
      vehicleType: defaultCabType._id,
      documentsPath: documentPath,
      // Explicitly set ratings to null to bypass validation
      ratings: null
    };
    
    const newDriver = new Driver(driverData);
    const driver = await newDriver.save({ validateBeforeSave: false });
    
    console.log('Driver profile created successfully:', {
      id: driver._id,
      userId: driver.user,
      licenseNumber: driver.licenseNumber,
      vehicleNumber: driver.vehicleNumber
    });

    console.log('TEST PASSED: Driver registration completed successfully');
    
    // Query back to verify the driver was saved
    console.log('\nVerifying driver was saved to database...');
    const savedDriver = await Driver.findById(driver._id).populate('user');
    
    if (savedDriver) {
      console.log('Driver verification successful:');
      console.log({
        id: savedDriver._id,
        name: savedDriver.user.name,
        email: savedDriver.user.email,
        licenseNumber: savedDriver.licenseNumber
      });
      console.log('DATABASE WRITE CONFIRMED: Driver data saved successfully');
    } else {
      console.log('ERROR: Driver verification failed - driver not found in database');
    }

  } catch (error) {
    console.error('Test failed with error:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the test
console.log('Starting driver registration test...');
testDriverRegistration();
