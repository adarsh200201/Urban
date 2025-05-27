const mongoose = require('mongoose');

const cabTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a cab type name'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a description']
  },
  acType: {
    type: String,
    enum: ['AC', 'Non-AC'],
    default: 'AC'
  },
  seatingCapacity: {
    type: Number,
    required: true,
    min: [1, 'Seating capacity must be at least 1'],
    default: 4
  },
  luggageCapacity: {
    type: Number,
    required: true,
    default: 2
  },
  imageUrl: {
    type: String,
    default: ''
  },
  baseKmPrice: {
    type: Number,
    required: [true, 'Please provide base price per km']
  },
  extraFarePerKm: {
    type: Number,
    required: true,
    default: 0
  },
  includedKm: {
    type: Number,
    required: true,
    default: 0
  },
  fuelCharges: {
    included: {
      type: Boolean,
      default: true
    },
    amount: {
      type: Number,
      default: 0
    }
  },
  driverCharges: {
    included: {
      type: Boolean,
      default: true
    },
    amount: {
      type: Number,
      default: 0
    }
  },
  nightCharges: {
    included: {
      type: Boolean,
      default: true
    },
    amount: {
      type: Number,
      default: 0
    }
  },
  active: {
    type: Boolean,
    default: true
  },
  features: [{
    type: String
  }],
  vehicleLocation: {
    type: String,
    required: false,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('CabType', cabTypeSchema);
