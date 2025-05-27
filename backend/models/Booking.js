const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cabType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CabType',
    required: true
  },
  pickupLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },
  dropLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },
  pickupAddress: {
    type: String,
    required: true
  },
  dropAddress: {
    type: String,
    required: true
  },
  journeyType: {
    type: String,
    enum: ['oneWay', 'roundTrip'],
    required: true
  },
  pickupDate: {
    type: Date,
    required: true
  },
  pickupTime: {
    type: String,
    required: true
  },
  returnDate: {
    type: Date
  },
  returnTime: {
    type: String
  },
  distance: {
    type: Number,
    required: true
  },
  duration: {
    type: Number
  },
  baseAmount: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    required: true
  },
  tollCharges: {
    type: Number,
    default: 0
  },
  driverAllowance: {
    type: Number,
    default: 0
  },
  nightCharges: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'assigned', 'inProgress', 'completed', 'cancelled'],
    default: 'pending'
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  assignedAt: {
    type: Date
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
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
  paymentId: {
    type: String
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  bookingId: {
    type: String,
    unique: true
  },
  passengerDetails: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    }
  },
  additionalNotes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Generate unique booking ID before saving
bookingSchema.pre('save', async function(next) {
  if (!this.bookingId) {
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.bookingId = `CB${dateStr}${randomStr}`;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
