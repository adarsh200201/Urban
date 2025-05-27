require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('./models/User');
const Driver = require('./models/Driver');
const CabType = require('./models/CabType');

// Create a fixed test driver with proper password hashing
async function createFixedDriver() {
  console.log('Starting fixed driver creation...');
  
  // Test data - use original email without timestamp
  const driverData = {
    name: 'Test Driver',
    email: 'test-driver@example.com', // Original email without timestamp
    phone: '9876543210',
    password: '123456',
    vehicleModel: 'Test Model',
    vehicleNumber: 'TN-12345',
    licenseNumber: 'LIC-12345',
    licenseExpiry: '2025-12-31'
  };
  
  console.log('Test data:', driverData);
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
    
    // Hash password properly
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(driverData.password, salt);
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: driverData.email });
    
    if (existingUser) {
      console.log('User already exists, updating password...');
      existingUser.password = hashedPassword;
      await existingUser.save();
      console.log('Password updated successfully');
    } else {
      // Create user with proper password hashing
      const user = await User.create({
        name: driverData.name,
        email: driverData.email,
        phone: driverData.phone,
        password: hashedPassword, // Use properly hashed password
        role: 'driver'
      });
      
      console.log('User created with proper password hashing:', {
        id: user._id,
        name: user.name,
        email: user.email
      });
      
      // Find default cab type or create one
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
      }
      
      // Check if driver already exists
      const existingDriver = await Driver.findOne({ user: user._id });
      
      if (existingDriver) {
        console.log('Driver already exists for this user');
      } else {
        // Create driver profile
        const driver = await Driver.create({
          user: user._id,
          licenseNumber: driverData.licenseNumber,
          licenseExpiry: driverData.licenseExpiry,
          vehicleNumber: driverData.vehicleNumber,
          vehicleModel: driverData.vehicleModel,
          vehicleType: cabType._id,
          documentsVerified: true, // Set to true for test account
          documentsPath: '/placeholder.pdf',
          isAvailable: true,
          ratings: 5 // Set initial rating
        });
        
        console.log('Driver created successfully:', {
          id: driver._id,
          licenseNumber: driver.licenseNumber,
          vehicleNumber: driver.vehicleNumber
        });
      }
    }
    
    console.log('\n=== FIXED TEST ACCOUNT CREATED ===');
    console.log('Email: ' + driverData.email);
    console.log('Password: ' + driverData.password);
    console.log('========================\n');
    
  } catch (error) {
    console.error('Error creating driver:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

createFixedDriver();
