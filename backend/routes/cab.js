const express = require('express');
const path = require('path');
const {
  getAllCabTypes,
  getCabType,
  createCabType,
  updateCabType,
  deleteCabType,
  getAvailableCabs
} = require('../controllers/cabController');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/fileUpload');

const router = express.Router();

// Get routes
router.get('/', getAllCabTypes);
router.get('/:id', getCabType);
router.get('/types', getAllCabTypes); // Additional endpoint for cab types

// Post routes for cab creation
router.post('/available', getAvailableCabs);

// Route for creating cab with JSON data only - no file upload
router.post('/noimage', protect, authorize('admin'), createCabType);

// Original route now bypasses multer middleware to avoid conflicts with express-fileupload
router.post('/', protect, authorize('admin'), createCabType);

// Simplified image upload route for cabs - Direct buffer to Cloudinary approach
router.post('/:id/image', protect, authorize('admin'), async (req, res) => {
  try {
    const CabType = require('../models/CabType');
    const cloudinary = require('../config/cloudinary');
    
    console.log('=== SIMPLIFIED CAB IMAGE UPLOAD ===');
    console.log('Cab ID:', req.params.id);
    
    // Check if cab exists
    const cabType = await CabType.findById(req.params.id);
    if (!cabType) {
      return res.status(404).json({
        success: false,
        message: 'Cab type not found'
      });
    }
    
    // Verify file was received
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files were uploaded'
      });
    }
    
    // Get the image file
    let imageFile = null;
    
    // Try to find the file in common field names
    const fieldNames = ['image', 'file', 'cabImage', 'photo'];
    for (const field of fieldNames) {
      if (req.files[field]) {
        imageFile = req.files[field];
        break;
      }
    }
    
    // If not found in common fields, take the first file
    if (!imageFile && Object.keys(req.files).length > 0) {
      const firstField = Object.keys(req.files)[0];
      imageFile = req.files[firstField];
    }
    
    if (!imageFile) {
      return res.status(400).json({
        success: false,
        message: 'No image file found in request'
      });
    }
    
    try {
      // Direct base64 upload without any filesystem references
      const base64String = imageFile.data.toString('base64');
      const fileType = imageFile.mimetype;
      const dataURI = `data:${fileType};base64,${base64String}`;
      
      // Upload directly to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        folder: 'urbanride/cabTypes',
        resource_type: 'auto'
      });
      
      // Update cab with the image URL
      const updatedCab = await CabType.findByIdAndUpdate(
        req.params.id,
        { imageUrl: uploadResult.secure_url },
        { new: true }
      );
      
      return res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        data: updatedCab
      });
    } catch (cloudinaryError) {
      console.error('Cloudinary upload error:', cloudinaryError);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload to Cloudinary: ' + cloudinaryError.message
      });
    }
  } catch (error) {
    console.error('Error in image upload:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload image: ' + error.message
    });
  }
});

// Update and delete routes - remove dependency on multer for updates
router.put('/:id', protect, authorize('admin'), updateCabType);
router.delete('/:id', protect, authorize('admin'), deleteCabType);

module.exports = router;
