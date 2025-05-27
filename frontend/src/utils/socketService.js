import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

// List of all available socket events - centralized for consistency
const EVENTS = {
  // Connection events
  JOIN_DRIVER_ROOM: 'joinDriverRoom',
  JOIN_USER_ROOM: 'joinUserRoom',
  JOIN_ADMIN_ROOM: 'joinAdminRoom',
  
  // Booking lifecycle events
  DRIVER_ASSIGNED: 'driverAssigned',
  BOOKING_UPDATED: 'bookingUpdated',
  BOOKING_STATUS_CHANGED: 'bookingStatusChanged',
  RIDE_CANCELLED: 'rideCancelled',
  RIDE_STARTED: 'rideStarted',
  RIDE_COMPLETED: 'rideCompleted',
  
  // Payment and refund events
  PAYMENT_RECEIVED: 'paymentReceived',
  REFUND_INITIATED: 'refundInitiated',
  REFUND_PROCESSED: 'refundProcessed',
  REFUND_FAILED: 'refundFailed',
  
  // Rating events
  RATING_REQUESTED: 'ratingRequested',
  RATING_SUBMITTED: 'ratingSubmitted',
  
  // Driver location events
  DRIVER_LOCATION_UPDATED: 'driverLocationUpdated'
};

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.events = EVENTS;
  }

  // Initialize the socket connection
  connect() {
    // If already connected or connecting, don't try to reconnect
    if (this.socket) {
      // If the socket exists but is disconnected, just reconnect it
      if (!this.isConnected && !this._isConnecting) {
        this.socket.connect();
      }
      return this.socket;
    }
    
    // Set a connecting flag to prevent multiple simultaneous connection attempts
    this._isConnecting = true;
    
    // Implement connection debouncing - only allow one connection attempt per second
    const now = Date.now();
    if (this._lastConnectionAttempt && (now - this._lastConnectionAttempt < 1000)) {
      console.log('Throttling connection attempts, tried too recently');
      this._isConnecting = false;
      return null;
    }
    this._lastConnectionAttempt = now;
    
    // Create new socket instance with improved configuration
    this.socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 2000,  // Increased to reduce frequent reconnection attempts
      reconnectionAttempts: 5,
      timeout: 10000,          // Timeout after 10 seconds if can't connect
      transports: ['websocket']
    });

    // Connection successful
    this.socket.on('connect', () => {
      console.log('Socket.io connected');
      this.isConnected = true;
      this._isConnecting = false;
      this._connectionAttempts = 0;
    });

    // Handle disconnection
    this.socket.on('disconnect', () => {
      console.log('Socket.io disconnected');
      this.isConnected = false;
    });

    // Handle connection errors
    this.socket.on('connect_error', (error) => {
      this._connectionAttempts = (this._connectionAttempts || 0) + 1;
      console.error(`Socket.io connection error (attempt ${this._connectionAttempts}):`, error);
      this.isConnected = false;
      this._isConnecting = false;
      
      // If we've tried to connect too many times, give up and reset the socket
      if (this._connectionAttempts > 3) {
        console.warn('Too many connection attempts, resetting socket instance');
        this.socket.removeAllListeners();
        this.socket = null;
      }
    });

    return this.socket;
  }

  // Join a room as a driver
  joinDriverRoom(driverId) {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit(EVENTS.JOIN_DRIVER_ROOM, driverId);
    console.log(`Joined driver room: driver_${driverId}`);
  }

  // Join a room as a user
  joinUserRoom(userId) {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit(EVENTS.JOIN_USER_ROOM, userId);
    console.log(`Joined user room: user_${userId}`);
  }

  // Join the admin room
  joinAdminRoom() {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit(EVENTS.JOIN_ADMIN_ROOM);
    console.log('Joined admin room');
  }

  /**
   * Generic method to listen for any socket event
   * @param {string} eventName - Event name from EVENTS object
   * @param {Function} callback - Callback function to handle the event
   */
  listenForEvent(eventName, callback) {
    if (!this.socket) {
      console.warn(`Cannot listen for event ${eventName}: Socket not initialized`);
      return;
    }
    
    if (!Object.values(EVENTS).includes(eventName)) {
      console.error(`Unknown event: ${eventName}`);
      return;
    }
    
    // Remove any existing listeners for this event to prevent duplicates
    this.socket.off(eventName);
    
    // Add the new listener
    this.socket.on(eventName, (data) => {
      console.log(`${eventName} event received:`, data);
      callback(data);
    });
    
    return () => {
      // Provide a cleanup function that can be called to remove this listener
      if (this.socket) {
        this.socket.off(eventName);
      }
    };
  }

  /**
   * Subscribe to all booking updates (status changes, assignments, etc.)
   * @param {Function} callback - Callback function to handle the event
   */
  listenForBookingUpdates(callback) {
    this.listenForEvent(EVENTS.BOOKING_UPDATED, callback);
    this.listenForEvent(EVENTS.BOOKING_STATUS_CHANGED, callback);
  }
  
  /**
   * Subscribe to driver assignment events
   * @param {Function} callback - Callback function to handle the event
   */
  listenForDriverAssignment(callback) {
    this.listenForEvent(EVENTS.DRIVER_ASSIGNED, callback);
  }
  
  /**
   * Subscribe to ride cancellation events
   * @param {Function} callback - Callback function to handle the event
   */
  listenForRideCancellation(callback) {
    this.listenForEvent(EVENTS.RIDE_CANCELLED, callback);
  }
  
  /**
   * Subscribe to payment and refund events
   * @param {Function} callback - Callback function to handle the event
   */
  listenForPaymentUpdates(callback) {
    this.listenForEvent(EVENTS.PAYMENT_RECEIVED, callback);
    this.listenForEvent(EVENTS.REFUND_INITIATED, callback);
    this.listenForEvent(EVENTS.REFUND_PROCESSED, callback);
    this.listenForEvent(EVENTS.REFUND_FAILED, callback);
  }
  
  /**
   * Subscribe to ride lifecycle events (started, completed)
   * @param {Function} callback - Callback function to handle the event
   */
  listenForRideLifecycle(callback) {
    this.listenForEvent(EVENTS.RIDE_STARTED, callback);
    this.listenForEvent(EVENTS.RIDE_COMPLETED, callback);
  }
  
  /**
   * Subscribe to rating events
   * @param {Function} callback - Callback function to handle the event
   */
  listenForRatingEvents(callback) {
    this.listenForEvent(EVENTS.RATING_REQUESTED, callback);
    this.listenForEvent(EVENTS.RATING_SUBMITTED, callback);
  }
  
  /**
   * Subscribe to driver location updates
   * @param {Function} callback - Callback function to handle the event
   */
  listenForDriverLocationUpdates(callback) {
    this.listenForEvent(EVENTS.DRIVER_LOCATION_UPDATED, callback);
  }
  
  // Legacy methods for backward compatibility
  onDriverAssigned(callback) {
    this.listenForDriverAssignment(callback);
  }
  
  onBookingUpdated(callback) {
    this.listenForEvent(EVENTS.BOOKING_UPDATED, callback);
  }
  
  onBookingStatusChanged(callback) {
    this.listenForEvent(EVENTS.BOOKING_STATUS_CHANGED, callback);
  }
  
  onRideCancelled(callback) {
    this.listenForRideCancellation(callback);
  }
  
  onRefundProcessed(callback) {
    this.listenForEvent(EVENTS.REFUND_PROCESSED, callback);
  }
  
  onRideCompleted(callback) {
    this.listenForEvent(EVENTS.RIDE_COMPLETED, callback);
  }
  
  onRatingSubmitted(callback) {
    this.listenForEvent(EVENTS.RATING_SUBMITTED, callback);
  }

  // Disconnect the socket safely
  disconnect() {
    if (this.socket) {
      try {
        // Only attempt to disconnect if socket is actually connected
        if (this.socket.connected) {
          this.socket.disconnect();
          console.log('Socket.io disconnected');
        } else {
          // If not connected yet, just remove all listeners to prevent memory leaks
          this.socket.removeAllListeners();
          console.log('Socket.io connection aborted (not fully established)');
        }
      } catch (error) {
        console.warn('Error during socket disconnection:', error);
      } finally {
        // Always clean up resources regardless of disconnection success
        this.socket = null;
        this.isConnected = false;
      }
    }
  }
}

// Create a singleton instance
const socketService = new SocketService();

export default socketService;
