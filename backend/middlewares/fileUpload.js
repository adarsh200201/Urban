const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create a more reliable upload mechanism with better error handling
let uploadDir = path.join(__dirname, '../uploads/temp');

// Create directory with better error handling
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  console.log('Upload directory ready:', uploadDir);
} catch (error) {
  console.error('Error creating upload directory:', error);
  // Create fallback to system temp directory if needed
  const os = require('os');
  uploadDir = path.join(os.tmpdir(), 'urbanride-uploads');
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    console.log('Using fallback upload directory:', uploadDir);
  } catch (fbError) {
    console.error('Failed to create fallback directory:', fbError);
  }
}

// Set up storage engine with error handling
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Verify directory exists before attempting to save
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    } catch (error) {
      console.error('Error accessing upload directory:', error);
      cb(error);
    }
  },
  filename: function(req, file, cb) {
    try {
      // Create a safe filename
      const safeName = `${Date.now()}-${path.basename(file.originalname).replace(/[^a-zA-Z0-9.]/g, '')}`;
      cb(null, safeName);
    } catch (error) {
      console.error('Error generating filename:', error);
      cb(error);
    }
  }
});

// More robust file filter
const fileFilter = (req, file, cb) => {
  try {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      console.log('File rejected - not an image:', file.originalname);
      return cb(null, false); // Don't throw error, just reject the file
    }
    console.log('File accepted:', file.originalname);
    cb(null, true);
  } catch (error) {
    console.error('Error in file filter:', error);
    cb(null, false); // On error, reject the file but don't crash
  }
};

// Create a middleware that won't crash on file upload errors
const handleUpload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  fileFilter: fileFilter
}).single('image');

// Wrap multer with error handling
const upload = {
  single: (fieldName) => {
    return (req, res, next) => {
      handleUpload(req, res, (err) => {
        if (err) {
          console.error('Multer error:', err);
          // Continue without file rather than crashing
          return next();
        }
        next();
      });
    };
  }
};

module.exports = upload;
