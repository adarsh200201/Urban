const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');

// Create a simple Express app
const app = express();

// Basic middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  createParentPath: true
}));

// Test route that should be accessible from anywhere
app.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Test GET endpoint is working'
  });
});

// Driver registration test route
app.post('/api/driver/auth/register', (req, res) => {
  console.log('Driver registration request received!');
  console.log('Body:', req.body);
  console.log('Files:', req.files);
  
  // Send a successful response regardless of the data format
  res.status(201).json({
    success: true,
    message: 'Driver registration endpoint hit successfully',
    data: {
      body: req.body,
      files: req.files ? Object.keys(req.files) : []
    }
  });
});

// Add a simple GET endpoint too
app.get('/api/driver/auth/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Driver auth GET test endpoint is working'
  });
});

// Start the server
const PORT = 5001; // Use a different port to avoid conflicts
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
