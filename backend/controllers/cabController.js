const CabType = require('../models/CabType');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

// @desc    Get all cab types
// @route   GET /api/cab
// @access  Public
exports.getAllCabTypes = async (req, res) => {
  try {
    const cabTypes = await CabType.find({ active: true }).sort('name');

    res.status(200).json({
      success: true,
      count: cabTypes.length,
      data: cabTypes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cab types',
      error: error.message
    });
  }
};

// @desc    Get single cab type
// @route   GET /api/cab/:id
// @access  Public
exports.getCabType = async (req, res) => {
  try {
    const cabType = await CabType.findById(req.params.id);

    if (!cabType) {
      return res.status(404).json({
        success: false,
        message: 'Cab type not found'
      });
    }

    res.status(200).json({
      success: true,
      data: cabType
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cab type',
      error: error.message
    });
  }
};

// @desc    Create new cab type
// @route   POST /api/cab
// @access  Private/Admin
exports.createCabType = async (req, res) => {
  // Check if we're on the /noimage endpoint
  const isNoImageEndpoint = req.originalUrl.includes('/noimage');
  
  // For /noimage endpoint, we expect JSON data
  if (isNoImageEndpoint) {
    try {
      console.log('=== CAB CREATION WITHOUT IMAGE ===');
      console.log('Request body:', req.body);
      
      // Validate the name directly
      if (!req.body.name) {
        return res.status(400).json({
          success: false,
          message: 'Cab name is required'
        });
      }
      
      // Check if cab type already exists
      const existingCabType = await CabType.findOne({ name: req.body.name });
      if (existingCabType) {
        return res.status(400).json({
          success: false,
          message: 'Cab type with this name already exists'
        });
      }
      
      // Create a cab type object from the JSON data
      const cabTypeData = {
        name: req.body.name,
        description: req.body.description || '',
        acType: req.body.acType || 'AC',
        seatingCapacity: Number(req.body.seatingCapacity || 4),
        luggageCapacity: Number(req.body.luggageCapacity || 2),
        imageUrl: '',  // No image yet
        baseKmPrice: Number(req.body.baseKmPrice || 0),
        extraFarePerKm: Number(req.body.extraFarePerKm || 0),
        includedKm: Number(req.body.includedKm || 0),
        active: true,
        features: req.body.features || [],
        vehicleLocation: req.body.vehicleLocation || '',
        fuelChargesIncluded: req.body.fuelChargesIncluded === 'true' || req.body.fuelChargesIncluded === true,
        driverChargesIncluded: req.body.driverChargesIncluded === 'true' || req.body.driverChargesIncluded === true,
        nightChargesIncluded: req.body.nightChargesIncluded === 'true' || req.body.nightChargesIncluded === true
      };
      
      console.log('Creating cab with data:', cabTypeData);
      
      // Save to database
      const cabType = await CabType.create(cabTypeData);
      console.log('Cab created successfully with ID:', cabType._id);
      
      return res.status(201).json({
        success: true,
        data: cabType
      });
    } catch (error) {
      console.error('Error creating cab type without image:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create cab type: ' + error.message,
        error: {
          message: error.message,
          type: error.name,
          code: error.code
        }
      });
    }
  }
  
  // For the regular endpoint with multipart/form-data
  // This is the original implementation for handling form data with files
  try {
    // Enhanced debugging for form data issues
    console.log('=== CAB CREATION REQUEST ===');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Raw body:', req.body);
    console.log('Body fields:', Object.keys(req.body));
    console.log('Has files:', req.files ? 'Yes' : 'No');
    if (req.files) {
      console.log('Files:', Object.keys(req.files));
    }
    
    // COMPREHENSIVE NAME EXTRACTION
    // Method 1: Direct access
    let cabName = req.body.name;
    
    // Method 2: Check for stringified JSON
    if (!cabName && typeof req.body === 'object') {
      try {
        // Some clients may stringify the JSON
        for (const key in req.body) {
          if (typeof req.body[key] === 'string' && req.body[key].includes('name')) {
            try {
              const parsed = JSON.parse(req.body[key]);
              if (parsed && parsed.name) {
                cabName = parsed.name;
                console.log('Found name in parsed JSON:', cabName);
              }
            } catch (e) {
              // Not valid JSON, continue
            }
          }
        }
      } catch (e) {
        console.log('Error parsing potential JSON:', e.message);
      }
    }
    
    // Method 3: Search in all keys
    if (!cabName) {
      for (const key in req.body) {
        if (key === 'name' || key.startsWith('name[')) {
          cabName = req.body[key];
          console.log('Found name in field:', key, 'with value:', cabName);
          break;
        }
      }
    }
    
    console.log('Final cab name determined:', cabName);
    
    if (!cabName) {
      console.error('No name field found in any format');
      console.log('All form field keys:', Object.keys(req.body));
      return res.status(400).json({
        success: false,
        message: 'Cab name is required'
      });
    }
    
    // Check if cab type already exists
    const existingCabType = await CabType.findOne({ name: cabName });
    if (existingCabType) {
      console.log('Cab type already exists:', cabName);
      return res.status(400).json({
        success: false,
        message: 'Cab type with this name already exists'
      });
    }

    // Initialize imageUrl
    let imageUrl = '';
    
    // Process image file if present
    if (req.files && req.files.image) {
      try {
        const imageFile = req.files.image;
        console.log('Processing image:', imageFile.name, imageFile.mimetype, imageFile.size);
        
        // Create a unique temp path
        const tempDir = path.join(__dirname, '..', 'uploads', 'temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        const tempFilename = `${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
        const tempPath = path.join(tempDir, tempFilename);

        // Save the file
        await imageFile.mv(tempPath);
        console.log('File saved to:', tempPath);

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(tempPath, {
          folder: 'urbanride/cabTypes'
        });

        imageUrl = result.secure_url;
        console.log('Image uploaded to Cloudinary:', imageUrl);

        // Clean up
        fs.unlinkSync(tempPath);
      } catch (error) {
        console.error('Image upload error:', error);
        // Continue without image
      }
    }

    // Create a simplified cab type object from the form data
    const cabTypeData = {
      name: cabName,
      description: req.body.description || '',
      acType: req.body.acType || 'AC',
      seatingCapacity: Number(req.body.seatingCapacity || 4),
      luggageCapacity: Number(req.body.luggageCapacity || 2),
      imageUrl: imageUrl,
      baseKmPrice: Number(req.body.baseKmPrice || 0),
      extraFarePerKm: Number(req.body.extraFarePerKm || 0),
      includedKm: Number(req.body.includedKm || 0),
      active: true,
      features: [],
      vehicleLocation: req.body.vehicleLocation || '',
      fuelChargesIncluded: req.body.fuelChargesIncluded === 'true' || req.body.fuelChargesIncluded === true,
      driverChargesIncluded: req.body.driverChargesIncluded === 'true' || req.body.driverChargesIncluded === true,
      nightChargesIncluded: req.body.nightChargesIncluded === 'true' || req.body.nightChargesIncluded === true
    };

    // Extract features
    if (req.body.features) {
      if (Array.isArray(req.body.features)) {
        cabTypeData.features = req.body.features;
      } else {
        cabTypeData.features = [req.body.features];
      }
    }

    console.log('Creating cab with data:', cabTypeData);

    // Save to database
    const cabType = await CabType.create(cabTypeData);
    console.log('Cab created successfully with ID:', cabType._id);

    return res.status(201).json({
      success: true,
      data: cabType
    });
  } catch (error) {
    console.error('Error creating cab type:', error);

    // Clean up file if it exists and there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('File cleaned up after error');
      } catch (cleanupError) {
        console.error('Error during file cleanup:', cleanupError);
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create cab type: ' + error.message,
      error: {
        message: error.message,
        type: error.name,
        code: error.code
      }
    });
  }
};

/**
 * @desc    Update cab type
 * @route   PUT /api/cab/:id
 * @access  Private/Admin
 */
exports.updateCabType = async (req, res) => {
  try {
    const cabType = await CabType.findById(req.params.id);

    if (!cabType) {
      // Clean up file if uploaded but cab type not found
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: 'Cab type not found'
      });
    }

    console.log('Updating cab type with ID:', req.params.id);
    console.log('Update data:', req.body);
    
    // Check if this is an image-only update (from the /:id/image endpoint)
    const isImageOnlyUpdate = req.body.imageUploadOnly === true || req.body.imageUploadOnly === 'true';

    // Handle image upload if there's a file
    if (req.file) {
      try {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'urbanride/cabTypes',
          use_filename: true,
          resource_type: 'auto'
        });
        
        console.log('Cloudinary upload successful (update):', result.secure_url);
        
        // Add the image URL to the request body
        req.body.imageUrl = result.secure_url;
        
        // Clean up local file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
          console.log('Local file deleted successfully (update)');
        }
        
        // If this is an image-only update, return early after updating the image URL
        if (isImageOnlyUpdate) {
          // Update only the image URL field
          const updatedCab = await CabType.findByIdAndUpdate(
            req.params.id,
            { imageUrl: req.body.imageUrl },
            { new: true, runValidators: true }
          );
          
          return res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: updatedCab
          });
        }
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary (update):', uploadError);
        console.error('Stack trace:', uploadError.stack);
        
        // Clean up the file
        if (req.file && fs.existsSync(req.file.path)) {
          try {
            fs.unlinkSync(req.file.path);
            console.log('Local file deleted after error (update)');
          } catch (deleteError) {
            console.error('Error deleting file:', deleteError);
          }
        }
        
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image to Cloudinary',
          error: uploadError.message
        });
      }
    }

    // Handle field name mapping with proper type conversion
    if (req.body.desc) req.body.description = req.body.desc;
    if (req.body.seatCap) req.body.seatingCapacity = parseInt(req.body.seatCap) || 4;
    if (req.body.luggageCapacity) req.body.luggageCapacity = parseInt(req.body.luggageCapacity) || 2;
    if (req.body.kmPrice) req.body.baseKmPrice = parseFloat(req.body.kmPrice);
    if (req.body.feat) req.body.features = Array.isArray(req.body.feat) ? req.body.feat : [req.body.feat];
    if (req.body.incKm) req.body.includedKm = parseInt(req.body.incKm) || 0;
    if (req.body.extraKmPrice) req.body.extraFarePerKm = parseFloat(req.body.extraKmPrice) || 0;
    if (req.body.vehicleLocation) req.body.vehicleLocation = req.body.vehicleLocation;
    
    // Handle boolean conversions
    if (req.body.fuelInc !== undefined) {
      req.body.fuelChargesIncluded = req.body.fuelInc === 'true' || req.body.fuelInc === true;
    }
    if (req.body.drvInc !== undefined) {
      req.body.driverChargesIncluded = req.body.drvInc === 'true' || req.body.drvInc === true;
    }
    if (req.body.nightInc !== undefined) {
      req.body.nightChargesIncluded = req.body.nightInc === 'true' || req.body.nightInc === true;
    }

    const updatedCabType = await CabType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedCabType
    });
  } catch (error) {
    // Clean up file if it exists and there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update cab type',
      error: error.message
    });
  }
};

// @desc    Delete cab type
// @route   DELETE /api/cab/:id
// @access  Private/Admin
exports.deleteCabType = async (req, res) => {
  try {
    const cabType = await CabType.findById(req.params.id);

    if (!cabType) {
      return res.status(404).json({
        success: false,
        message: 'Cab type not found'
      });
    }

    // Instead of deleting, just set active to false
    cabType.active = false;
    await cabType.save();

    res.status(200).json({
      success: true,
      message: 'Cab type deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete cab type',
      error: error.message
    });
  }
};

// @desc    Get available cabs for booking
// @route   POST /api/cab/available
// @access  Public
exports.getAvailableCabs = async (req, res) => {
  try {
    const {
      journeyType,
      pickupDate,
      returnDate,
      pickupLocation,
      dropLocation
    } = req.body;

    // Validate required parameters
    if (!journeyType || !pickupLocation || !dropLocation) {
      return res.status(400).json({
        success: false,
        message: 'Please provide journeyType, pickupLocation, and dropLocation'
      });
    }

    console.log('Searching for cabs with pickupLocation:', pickupLocation);
    
    // Filter cabs by vehicle location (must match pickup location)
    const filter = { 
      active: true,
      // Match vehicle location to pickup location (case insensitive)
      vehicleLocation: { $regex: new RegExp(pickupLocation, 'i') }
    };
    
    // For development/testing, we can also use a fallback to show all cabs
    // by commenting out the vehicleLocation filter
    // const filter = { active: true };
    
    // Get filtered cabs
    const cabs = await CabType.find(filter);
    
    console.log(`Found ${cabs.length} cabs available in ${pickupLocation}`);

    res.status(200).json({
      success: true,
      count: cabs.length,
      data: cabs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available cabs',
      error: error.message
    });
  }
};
