const express = require('express');
const router = express.Router();
const upload = require('../middlewares/fileUpload');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

// Test route for file upload
router.post('/upload', upload.single('testImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log('File uploaded to:', req.file.path);
    
    // Try to upload to Cloudinary
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'urbanride/test',
        use_filename: true
      });
      
      console.log('Cloudinary upload successful:', result.secure_url);
      
      // Clean up local file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        console.log('Local file cleaned up successfully');
      }
      
      return res.status(200).json({
        success: true,
        imageUrl: result.secure_url,
        message: 'File uploaded successfully'
      });
    } catch (cloudinaryError) {
      console.error('Cloudinary upload error:', cloudinaryError);
      return res.status(500).json({
        success: false,
        message: 'Cloudinary upload failed',
        error: cloudinaryError.message
      });
    }
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: error.message
    });
  }
});

module.exports = router;
