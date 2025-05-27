const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a city name'],
    trim: true
  },
  state: {
    type: String,
    required: [true, 'Please provide a state']
  },
  country: {
    type: String,
    default: 'India'
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: String
  },
  latitude: {
    type: Number
  },
  longitude: {
    type: Number
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

module.exports = mongoose.model('City', citySchema);
