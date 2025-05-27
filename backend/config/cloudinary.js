const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Test the Cloudinary configuration
try {
  console.log('Cloudinary configuration loaded successfully');
  console.log('Cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
} catch (error) {
  console.error('Cloudinary configuration error:', error);
}

module.exports = cloudinary;
