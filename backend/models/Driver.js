const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const driverSchema = new mongoose.Schema({
  // Make user reference optional since some drivers have data directly on the document
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  // Add direct user fields for drivers that don't use the reference
  name: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: false,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: false
  },
  password: {
    type: String,
    required: false
  },
  licenseNumber: {
    type: String,
    required: [true, 'Please provide license number'],
    unique: true
  },
  licenseExpiry: {
    type: Date,
    required: [true, 'Please provide license expiry date']
  },
  vehicleNumber: {
    type: String,
    required: [true, 'Please provide vehicle number'],
    unique: true
  },
  vehicleModel: {
    type: String,
    required: [true, 'Please provide vehicle model']
  },
  vehicleType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CabType',
    required: true
  },
  documentsVerified: {
    type: Boolean,
    default: false
  },
  documents: {
    type: Object,
    default: {
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
    }
  },
  // Keep for backward compatibility
  documentsPath: {
    type: String,
    default: ''
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  ratings: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalRides: {
    type: Number,
    default: 0
  },
  currentBooking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  }
}, { timestamps: true });

// Add index for geospatial queries
driverSchema.index({ currentLocation: '2dsphere' });

// Encrypt password before saving
driverSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password
driverSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
driverSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

module.exports = mongoose.model('Driver', driverSchema);
