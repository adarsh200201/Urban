// Socket.io Manager for real-time communication
let io;

// Centralized event names - must match with frontend
const EVENTS = {
  // Existing events
  DRIVER_ASSIGNED: 'driverAssigned',
  BOOKING_UPDATED: 'bookingUpdated',
  BOOKING_STATUS_CHANGED: 'bookingStatusChanged',
  
  // New events for enhanced features
  RIDE_CANCELLED: 'rideCancelled',
  REFUND_PROCESSED: 'refundProcessed',
  RIDE_COMPLETED: 'rideCompleted',
  RATING_SUBMITTED: 'ratingSubmitted',
  
  // Room joining events
  JOIN_DRIVER_ROOM: 'joinDriverRoom',
  JOIN_USER_ROOM: 'joinUserRoom',
  JOIN_ADMIN_ROOM: 'joinAdminRoom'
};

const initializeSocket = (server) => {
  io = require('socket.io')(server, {
    cors: {
      origin: ['http://localhost:3000', 'https://urbanride-app.vercel.app'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join room for specific driver
    socket.on(EVENTS.JOIN_DRIVER_ROOM, (driverId) => {
      console.log(`Driver ${driverId} joined their room`);
      socket.join(`driver_${driverId}`);
    });
    
    // Join room for specific user
    socket.on(EVENTS.JOIN_USER_ROOM, (userId) => {
      console.log(`User ${userId} joined their room`);
      socket.join(`user_${userId}`);
    });

    // Join admin room
    socket.on(EVENTS.JOIN_ADMIN_ROOM, () => {
      console.log('Admin joined admin room');
      socket.join('admin');
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  console.log('Socket.io initialized');
  return io;
};

// Emit events
const emitDriverAssigned = (data) => {
  if (!io) return console.log('Socket.io not initialized');
  
  // Emit to the specific driver
  io.to(`driver_${data.driver._id}`).emit(EVENTS.DRIVER_ASSIGNED, data);
  
  // Also emit to the user who made the booking
  if (data.user) {
    io.to(`user_${data.user}`).emit(EVENTS.DRIVER_ASSIGNED, data);
  }
  
  // Emit to all admins
  io.to('admin').emit(EVENTS.BOOKING_UPDATED, data);
  
  console.log(`Emitted driverAssigned event to driver_${data.driver._id}, user, and admin`);
};

// Emit booking status changes
const emitBookingStatusChanged = (data) => {
  if (!io) return console.log('Socket.io not initialized');
  
  // Notify the driver, user, and admins
  if (data.driver) {
    io.to(`driver_${data.driver}`).emit(EVENTS.BOOKING_STATUS_CHANGED, data);
  }
  
  if (data.user) {
    io.to(`user_${data.user}`).emit(EVENTS.BOOKING_STATUS_CHANGED, data);
  }
  
  io.to('admin').emit(EVENTS.BOOKING_STATUS_CHANGED, data);
  
  console.log('Emitted bookingStatusChanged event');
};

// Emit ride cancellation event
const emitRideCancelled = (data) => {
  if (!io) return console.log('Socket.io not initialized');
  
  // Notify the driver (if assigned), user, and admins
  if (data.driver) {
    io.to(`driver_${data.driver}`).emit(EVENTS.RIDE_CANCELLED, data);
  }
  
  if (data.user) {
    io.to(`user_${data.user}`).emit(EVENTS.RIDE_CANCELLED, data);
  }
  
  io.to('admin').emit(EVENTS.RIDE_CANCELLED, data);
  
  console.log('Emitted rideCancelled event');
};

// Emit refund processed event
const emitRefundProcessed = (data) => {
  if (!io) return console.log('Socket.io not initialized');
  
  // Notify the user and admins (driver doesn't need this information)
  if (data.user) {
    io.to(`user_${data.user}`).emit(EVENTS.REFUND_PROCESSED, data);
  }
  
  io.to('admin').emit(EVENTS.REFUND_PROCESSED, data);
  
  console.log('Emitted refundProcessed event');
};

// Emit ride completed event
const emitRideCompleted = (data) => {
  if (!io) return console.log('Socket.io not initialized');
  
  // Notify the driver, user, and admins
  if (data.driver) {
    io.to(`driver_${data.driver}`).emit(EVENTS.RIDE_COMPLETED, data);
  }
  
  if (data.user) {
    io.to(`user_${data.user}`).emit(EVENTS.RIDE_COMPLETED, data);
  }
  
  io.to('admin').emit(EVENTS.RIDE_COMPLETED, data);
  
  console.log('Emitted rideCompleted event');
};

// Emit rating submitted event
const emitRatingSubmitted = (data) => {
  if (!io) return console.log('Socket.io not initialized');
  
  // Depending on who submitted the rating, notify the other party
  if (data.ratingType === 'driverRating') {
    // Driver rated the user, notify the user
    if (data.userId) {
      io.to(`user_${data.userId}`).emit(EVENTS.RATING_SUBMITTED, data);
    }
  } else if (data.ratingType === 'userRating') {
    // User rated the driver, notify the driver
    if (data.driverId) {
      io.to(`driver_${data.driverId}`).emit(EVENTS.RATING_SUBMITTED, data);
    }
  }
  
  // Admins see all ratings
  io.to('admin').emit(EVENTS.RATING_SUBMITTED, data);
  
  console.log('Emitted ratingSubmitted event');
};

module.exports = {
  initializeSocket,
  emitDriverAssigned,
  emitBookingStatusChanged,
  emitRideCancelled,
  emitRefundProcessed,
  emitRideCompleted,
  emitRatingSubmitted,
  getIO: () => io,
  EVENTS
};
