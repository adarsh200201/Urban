const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

/**
 * Upload file to Cloudinary
 * @param {Object} file - The file object
 * @param {String} folder - The folder to upload to in Cloudinary
 * @returns {Promise<Object>} - Cloudinary upload result
 */
exports.uploadToCloudinary = async (file, folder = 'driver_documents') => {
  try {
    // If file is a path, upload directly
    if (typeof file === 'string' && fs.existsSync(file)) {
      const result = await cloudinary.uploader.upload(file, {
        folder,
        resource_type: 'auto'
      });
      return result;
    } 
    
    // If file is an uploaded file object (from req.files)
    if (file && file.tempFilePath) {
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder,
        resource_type: 'auto'
      });
      return result;
    }

    // If file is a buffer or raw data
    if (file && file.data) {
      // Create a temporary file path
      const tempPath = path.join(__dirname, '../temp', `${Date.now()}-${file.name}`);
      
      // Ensure temp directory exists
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Write buffer to temp file
      await fs.promises.writeFile(tempPath, file.data);
      
      // Upload file
      const result = await cloudinary.uploader.upload(tempPath, {
        folder,
        resource_type: 'auto'
      });
      
      // Delete temp file
      await fs.promises.unlink(tempPath);
      
      return result;
    }
    
    throw new Error('Invalid file format for upload');
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

/**
 * Delete file from Cloudinary
 * @param {String} publicId - The public ID of the file to delete
 * @returns {Promise<Object>} - Cloudinary deletion result
 */
exports.deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;
    
    // Extract public ID from URL if full URL is provided
    if (publicId.includes('cloudinary.com')) {
      const parts = publicId.split('/');
      const fileNameWithExt = parts[parts.length - 1];
      const fileName = fileNameWithExt.split('.')[0];
      publicId = `${parts[parts.length - 2]}/${fileName}`;
    }
    
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};
