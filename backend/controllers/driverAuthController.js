const Driver = require('../models/Driver');
const CabType = require('../models/CabType');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// @desc    Register a new driver
// @route   POST /api/driver/auth/register
// @access  Public
exports.registerDriver = asyncHandler(async (req, res) => {
  console.log('Registration request received:', req.body);
  
  // Check if all required fields are present
  if (!req.body.name || !req.body.email || !req.body.password || !req.body.phone || !req.body.vehicleType) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  const { 
    name, 
    email, 
    phone, 
    password, 
    vehicleModel, 
    vehicleNumber, 
    licenseNumber, 
    licenseExpiry,
    vehicleType: vehicleTypeId
  } = req.body;

  // Check if email already exists
  const emailExists = await Driver.findOne({ email });
  if (emailExists) {
    res.status(400);
    throw new Error('Email already exists');
  }

  // Validate the selected vehicle type against admin-approved cab types
  let cabType;
  if (vehicleTypeId) {
    try {
      cabType = await CabType.findById(vehicleTypeId);
      if (!cabType) {
        res.status(400);
        throw new Error('Invalid vehicle type selected. Please choose from the available options.');
      }
      
      if (!cabType.active) {
        res.status(400);
        throw new Error('The selected vehicle type is currently unavailable. Please choose another option.');
      }
    } catch (error) {
      console.error('Error validating cab type:', error);
      res.status(400);
      throw new Error('Invalid vehicle type selected: ' + error.message);
    }
  } else {
    res.status(400);
    throw new Error('Please select a valid vehicle type');
  }

  try {
    // Handle document uploads to Cloudinary
    const { uploadToCloudinary } = require('../utils/uploadHelper');
    
    // Initialize documents structure for new format
    const documents = {
      aadhaarCard: '',
      driversLicense: '',
      driverPhoto: '',
      vehicleRC: '',
      insuranceCertificate: '',
      pucCertificate: '',
      fitnessCertificate: '',
      routePermit: '',
      vehiclePhotoFront: '',
      vehiclePhotoBack: ''
    };
    
    let documentPath = ''; // Keep for backward compatibility
    
    // Process each document type if provided
    if (req.files) {
      try {
        const documentTypes = [
          'aadhaarCard', 'driversLicense', 'driverPhoto',
          'vehicleRC', 'insuranceCertificate', 'pucCertificate',
          'fitnessCertificate', 'routePermit', 'vehiclePhotoFront', 'vehiclePhotoBack'
        ];
        
        // Upload each document type if provided
        for (const docType of documentTypes) {
          if (req.files[docType]) {
            // Validate file type (only images allowed)
            const file = req.files[docType];
            const fileExtension = path.extname(file.name).toLowerCase();
            const allowedExtensions = ['.jpg', '.jpeg', '.png'];
            
            if (!allowedExtensions.includes(fileExtension)) {
              console.error(`Invalid file type for ${docType}. Only images (jpg, jpeg, png) are allowed.`);
              continue; // Skip this file but continue with others
            }
            
            // Upload to Cloudinary
            console.log(`Uploading ${docType} to Cloudinary...`);
            const result = await uploadToCloudinary(file, 'driver_documents');
            if (result && result.secure_url) {
              documents[docType] = result.secure_url;
              console.log(`${docType} uploaded successfully to Cloudinary:`, result.secure_url);
            }
          }
        }
        
        // Log the documents object to verify it has content
        console.log('Final documents object:', documents);
      } catch (uploadError) {
        console.error('Error uploading documents to Cloudinary:', uploadError);
        // Continue with registration even if some document uploads fail
      }
    }

    // Create driver profile with schema validation bypass
    // First create a driver instance with required fields
    const driverData = {
      name,
      email,
      phone,
      password,
      licenseNumber,
      licenseExpiry,
      vehicleNumber,
      vehicleModel,
      vehicleType: cabType._id,
      documentsPath: documentPath, // Keep for backward compatibility
      documents: documents, // New document structure with Cloudinary URLs
      ratings: 0 // Start with 0 ratings
    };
    
    // Debug log the driver data to ensure documents are included
    console.log('Driver data being saved with documents:', JSON.stringify(driverData, null, 2));
    
    // Create the driver directly using the model constructor
    const newDriver = new Driver(driverData);
    
    // Save with validation set to false to bypass the ratings validation
    const driver = await newDriver.save({ validateBeforeSave: false });

    // If document was uploaded with a temporary name, rename it with the actual driver ID
    if (documentPath && documentPath.includes('temp')) {
      try {
        const oldPath = path.join(__dirname, '..', documentPath);
        const fileExtension = path.extname(oldPath);
        const newFileName = `driver_${driver._id}${fileExtension}`;
        const newPath = path.join(__dirname, '../uploads/driver_documents', newFileName);
        
        fs.renameSync(oldPath, newPath);
        
        // Update the driver with the new document path
        const newDocPath = `/uploads/driver_documents/${newFileName}`;
        await Driver.findByIdAndUpdate(driver._id, { documentsPath: newDocPath });
        documentPath = newDocPath;
      } catch (renameError) {
        console.error('Error renaming document:', renameError);
        // Continue even if renaming fails
      }
    }

    if (driver) {
      res.status(201).json({
        success: true,
        message: 'Driver registration successful! Your account will be reviewed and activated soon.',
        data: {
          _id: driver._id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          licenseNumber: driver.licenseNumber,
          vehicleNumber: driver.vehicleNumber
        }
      });
    } else {
      res.status(400);
      throw new Error('Invalid driver data');
    }
  } catch (error) {
    res.status(400);
    throw new Error('Driver registration failed: ' + error.message);
  }
});

// @desc    Authenticate a driver
// @route   POST /api/driver/auth/login
// @access  Public
exports.loginDriver = asyncHandler(async (req, res) => {
  console.log('Driver login attempt with data:', req.body);
  const { email, password } = req.body;
  
  if (!email || !password) {
    console.log('Missing required login fields');
    res.status(400);
    throw new Error('Please provide email and password');
  }

  // Check for driver email with detailed logging
  console.log('Searching for driver with email:', email);
  const driver = await Driver.findOne({ email }).select('+password').populate('vehicleType', 'name');
  
  if (!driver) {
    console.log('No driver found with email:', email);
    res.status(401);
    throw new Error('Invalid credentials');
  }
  
  console.log('Driver found:', {
    id: driver._id,
    email: driver.email
  });

  // Check password
  console.log('Checking password match...');
  const isMatch = await driver.matchPassword(password);
  
  if (!isMatch) {
    console.log('Password does not match');
    res.status(401);
    throw new Error('Invalid credentials');
  }
  
  console.log('Password matched successfully');

  // Check if driver is approved by admin
  if (!driver.isApproved) {
    console.log('Driver not yet approved by admin');
    res.status(403);
    throw new Error('Your account is pending approval by admin. Please wait for approval before logging in.');
  }

  console.log('Driver approval status verified');

  // Generate token
  const token = jwt.sign(
    { id: driver._id },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({
    token,
    driver: {
      _id: driver._id,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      licenseNumber: driver.licenseNumber,
      vehicleModel: driver.vehicleModel,
      vehicleNumber: driver.vehicleNumber,
      isAvailable: driver.isAvailable,
      documentsVerified: driver.documentsVerified,
      totalRides: driver.totalRides,
      ratings: driver.ratings
    }
  });
});

// @desc    Register a driver directly in the Driver collection
// @route   POST /api/driver/auth/direct-register
// @access  Public
exports.directRegisterDriver = asyncHandler(async (req, res) => {
  console.log('Direct driver registration request received:', req.body);
  
  // Check if all required fields are present
  if (!req.body.name || !req.body.email || !req.body.password || !req.body.phone || !req.body.vehicleType) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  const { 
    name, 
    email, 
    phone, 
    password, 
    vehicleModel, 
    vehicleNumber, 
    licenseNumber, 
    licenseExpiry,
    vehicleType: vehicleTypeId
  } = req.body;

  // Check if email already exists
  const emailExists = await Driver.findOne({ email });
  if (emailExists) {
    res.status(400);
    throw new Error('Email already exists');
  }

  // Validate the selected vehicle type against admin-approved cab types
  let cabType;
  if (vehicleTypeId) {
    try {
      cabType = await CabType.findById(vehicleTypeId);
      if (!cabType) {
        res.status(400);
        throw new Error('Invalid vehicle type selected. Please choose from the available options.');
      }
      
      if (!cabType.active) {
        res.status(400);
        throw new Error('The selected vehicle type is currently unavailable. Please choose another option.');
      }
    } catch (error) {
      console.error('Error validating cab type:', error);
      res.status(400);
      throw new Error('Invalid vehicle type selected: ' + error.message);
    }
  } else {
    res.status(400);
    throw new Error('Please select a valid vehicle type');
  }

  try {
    // Create driver instance
    const driverData = {
      name,
      email,
      phone,
      password,
      licenseNumber,
      licenseExpiry,
      vehicleNumber,
      vehicleModel,
      vehicleType: cabType._id,
      documentsPath: '',
      ratings: 0 // Start with 0 ratings
    };
    
    // Create the driver directly using the model constructor
    const newDriver = new Driver(driverData);
    
    // Save with validation set to false to bypass the ratings validation
    const driver = await newDriver.save({ validateBeforeSave: false });

    if (driver) {
      // Generate token for immediate login
      const token = jwt.sign(
        { id: driver._id },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.status(201).json({
        success: true,
        message: 'Driver registration successful! Your account will be reviewed and activated soon.',
        token,
        driver: {
          _id: driver._id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          licenseNumber: driver.licenseNumber,
          vehicleModel: driver.vehicleModel,
          vehicleNumber: driver.vehicleNumber,
          isAvailable: driver.isAvailable || false,
          documentsVerified: driver.documentsVerified || false,
          isApproved: driver.isApproved || false,
          totalRides: driver.totalRides || 0,
          ratings: driver.ratings || 0
        }
      });
    } else {
      res.status(400);
      throw new Error('Invalid driver data');
    }
  } catch (error) {
    res.status(400);
    throw new Error('Driver registration failed: ' + error.message);
  }
});
