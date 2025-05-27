const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads', 'driver_documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Import models
const User = require('./models/User');
const Driver = require('./models/Driver');
const CabType = require('./models/CabType');

// Import bcrypt for password hashing
const bcrypt = require('bcryptjs');

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 },
  createParentPath: true
}));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test GET route
app.get('/api/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Test route is working'
  });
});

// Driver registration route that saves to MongoDB
app.post('/api/driver/auth/register', async (req, res) => {
  try {
    console.log('Registration route hit!');
    console.log('Body:', req.body);
    console.log('Files:', req.files);
    
    const { 
      name, 
      email, 
      phone, 
      password, 
      vehicleModel, 
      vehicleNumber, 
      licenseNumber, 
      licenseExpiry 
    } = req.body;
    
    // Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    // Get or create a default cab type
    let defaultCabType = await CabType.findOne();
    if (!defaultCabType) {
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
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'driver'
    });
    
    console.log('User created:', user);
    
    // Handle document upload
    let documentPath = '';
    if (req.files && req.files.documents) {
      try {
        const file = req.files.documents;
        const fileExtension = path.extname(file.name);
        const fileName = `driver_${user._id}${fileExtension}`;
        const uploadPath = path.join(__dirname, 'uploads', 'driver_documents', fileName);
        
        // Move the file
        await file.mv(uploadPath);
        documentPath = `/uploads/driver_documents/${fileName}`;
        console.log('Document uploaded successfully to:', uploadPath);
      } catch (uploadError) {
        console.error('Error uploading document:', uploadError);
      }
    }
    
    // Create driver profile
    const driver = await Driver.create({
      user: user._id,
      licenseNumber,
      licenseExpiry,
      vehicleNumber,
      vehicleModel,
      vehicleType: defaultCabType._id,
      documentsPath: documentPath
    });
    
    console.log('Driver profile created:', driver);
    
    res.status(201).json({
      success: true,
      message: 'Driver registration successful! Your account will be reviewed and activated soon.',
      data: {
        _id: driver._id,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Driver registration failed: ' + error.message
    });
  }
});

// Start server on a different port
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
