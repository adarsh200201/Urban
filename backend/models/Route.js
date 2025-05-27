const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  sourceCity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },
  destinationCity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },
  distance: {
    type: Number,
    required: [true, 'Please provide the distance in kilometers']
  },
  estimatedTime: {
    type: Number,
    required: [true, 'Please provide the estimated travel time in minutes']
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  basePrice: {
    type: Number,
    required: true
  },
  tollCharges: {
    type: Number,
    default: 0
  },
  stateCharges: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Ensure unique combination of source and destination
routeSchema.index({ sourceCity: 1, destinationCity: 1 }, { unique: true });

module.exports = mongoose.model('Route', routeSchema);
