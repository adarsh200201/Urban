const mongoose = require('mongoose');

const fixedRouteSchema = new mongoose.Schema({
  fromCity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: [true, 'Please provide the origin city']
  },
  toCity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: [true, 'Please provide the destination city']
  },
  cabType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CabType',
    required: [true, 'Please provide the cab type']
  },
  price: {
    type: Number,
    required: [true, 'Please provide the fixed price']
  },
  estimatedTime: {
    type: Number,
    required: [true, 'Please provide the estimated travel time in hours']
  },
  distance: {
    type: Number,
    required: [true, 'Please provide the distance in kilometers']
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Ensure unique combination of origin, destination and cab type
fixedRouteSchema.index({ fromCity: 1, toCity: 1, cabType: 1 }, { unique: true });

module.exports = mongoose.model('FixedRoute', fixedRouteSchema);
