const mongoose = require('mongoose');

// Define the schema for document configuration
const documentConfigSchema = new mongoose.Schema({
  // Personal documents
  aadhaarCard: {
    name: { type: String, default: 'Aadhaar Card' },
    description: { type: String, default: 'Front and back of your Aadhaar card' },
    required: { type: Boolean, default: true }
  },
  driversLicense: {
    name: { type: String, default: 'Driver\'s License' },
    description: { type: String, default: 'Valid commercial driving license' },
    required: { type: Boolean, default: true }
  },
  driverPhoto: {
    name: { type: String, default: 'Your Photo' },
    description: { type: String, default: 'Recent passport size photograph' },
    required: { type: Boolean, default: true }
  },
  
  // Vehicle documents
  vehicleRC: {
    name: { type: String, default: 'Registration Certificate (RC)' },
    description: { type: String, default: 'Vehicle registration certificate' },
    required: { type: Boolean, default: true }
  },
  insuranceCertificate: {
    name: { type: String, default: 'Insurance Certificate' },
    description: { type: String, default: 'Valid vehicle insurance certificate' },
    required: { type: Boolean, default: true }
  },
  pucCertificate: {
    name: { type: String, default: 'PUC Certificate' },
    description: { type: String, default: 'Pollution Under Control certificate' },
    required: { type: Boolean, default: false }
  },
  fitnessCertificate: {
    name: { type: String, default: 'Fitness Certificate' },
    description: { type: String, default: 'Vehicle fitness certificate' },
    required: { type: Boolean, default: false }
  },
  routePermit: {
    name: { type: String, default: 'Route Permit' },
    description: { type: String, default: 'Route permit for commercial vehicle' },
    required: { type: Boolean, default: false }
  },
  
  // Vehicle photos
  vehiclePhotoFront: {
    name: { type: String, default: 'Vehicle Front Photo' },
    description: { type: String, default: 'Clear photo of the front of your vehicle' },
    required: { type: Boolean, default: true }
  },
  vehiclePhotoBack: {
    name: { type: String, default: 'Vehicle Back Photo' },
    description: { type: String, default: 'Clear photo of the back of your vehicle' },
    required: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// We'll only ever have one configuration document, so we'll use a singleton pattern
// by always retrieving the first document or creating a new one if none exists
documentConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  
  if (!config) {
    // Create default configuration if none exists
    config = await this.create({});
  }
  
  return config;
};

module.exports = mongoose.model('DocumentConfig', documentConfigSchema);
