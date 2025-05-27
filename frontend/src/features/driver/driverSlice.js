import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/driver';

// Get driver profile
export const getDriverProfile = createAsyncThunk(
  'driver/getProfile',
  async (userId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().driverAuth.driver.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`${API_URL}/${userId}`, config);
      return response.data.data;
    } catch (error) {
      const message = error.response && error.response.data.message
        ? error.response.data.message
        : error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update driver availability
export const updateDriverAvailability = createAsyncThunk(
  'driver/updateAvailability',
  async ({ driverId, isAvailable }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().driverAuth.driver.token;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.put(
        `${API_URL}/${driverId}/availability`,
        { isAvailable },
        config
      );
      return response.data.data;
    } catch (error) {
      const message = error.response && error.response.data.message
        ? error.response.data.message
        : error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Keep track of pending location updates to prevent overlapping requests
let pendingLocationUpdate = false;

// Update driver location
export const updateDriverLocation = createAsyncThunk(
  'driver/updateLocation',
  async ({ driverId, longitude, latitude }, thunkAPI) => {
    // Skip this update if there's already one in progress
    if (pendingLocationUpdate) {
      // Silent rejection - no console logs
      return thunkAPI.rejectWithValue('Update already in progress');
    }
    
    pendingLocationUpdate = true;
    
    try {
      const token = thunkAPI.getState().driverAuth.driver.token;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.put(
        `${API_URL}/${driverId}/location`,
        { longitude, latitude },
        config
      );
      
      pendingLocationUpdate = false;
      return response.data.data;
    } catch (error) {
      pendingLocationUpdate = false;
      // Silent error handling - no logs
      const message = error.response && error.response.data.message
        ? error.response.data.message
        : error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get current booking
export const getCurrentBooking = createAsyncThunk(
  'driver/getCurrentBooking',
  async (driverId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().driverAuth.driver.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`${API_URL}/${driverId}/current-booking`, config);
      return response.data.data;
    } catch (error) {
      const message = error.response && error.response.data.message
        ? error.response.data.message
        : error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Start trip
export const startTrip = createAsyncThunk(
  'driver/startTrip',
  async ({ driverId, bookingId }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().driverAuth.driver.token;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      // Using the special trip management endpoint to avoid middleware conflicts
      const response = await axios.put(
        `http://localhost:5000/api/trip-management/start`,
        { driverId, bookingId },
        config
      );
      return response.data.data;
    } catch (error) {
      const message = error.response && error.response.data.message
        ? error.response.data.message
        : error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Complete trip
export const completeTrip = createAsyncThunk(
  'driver/completeTrip',
  async ({ driverId, bookingId }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().driverAuth.driver.token;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      // Using the special trip management endpoint to avoid middleware conflicts
      const response = await axios.put(
        `http://localhost:5000/api/trip-management/complete`,
        { driverId, bookingId },
        config
      );
      return response.data.data;
    } catch (error) {
      const message = error.response && error.response.data.message
        ? error.response.data.message
        : error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get booking history
export const getBookingHistory = createAsyncThunk(
  'driver/getBookingHistory',
  async (driverId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().driverAuth.driver.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`${API_URL}/${driverId}/bookings`, config);
      return response.data.data;
    } catch (error) {
      const message = error.response && error.response.data.message
        ? error.response.data.message
        : error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const initialState = {
  driver: null,
  currentBooking: null,
  bookingHistory: [],
  loading: false,
  error: null,
  success: false,
  message: ''
};

const driverSlice = createSlice({
  name: 'driver',
  initialState,
  reducers: {
    reset: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = '';
    }
  },
  extraReducers: (builder) => {
    builder
      // Get driver profile
      .addCase(getDriverProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(getDriverProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.driver = action.payload;
      })
      .addCase(getDriverProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update driver availability
      .addCase(updateDriverAvailability.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateDriverAvailability.fulfilled, (state, action) => {
        state.loading = false;
        state.driver = action.payload;
        state.success = true;
        state.message = 'Availability updated successfully';
      })
      .addCase(updateDriverAvailability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update driver location
      .addCase(updateDriverLocation.pending, (state) => {
        // We won't set loading to true for location updates to avoid UI flicker
        // These updates happen in the background
      })
      .addCase(updateDriverLocation.fulfilled, (state, action) => {
        state.loading = false;
        if (state.driver) {
          state.driver = {
            ...state.driver,
            currentLocation: action.payload
          };
        }
      })
      .addCase(updateDriverLocation.rejected, (state, action) => {
        state.loading = false;
        // Only set error if it's not just a 'Update already in progress' message
        if (action.payload !== 'Update already in progress') {
          state.error = action.payload;
        }
      })
      
      // Get current booking
      .addCase(getCurrentBooking.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload;
      })
      .addCase(getCurrentBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Start trip
      .addCase(startTrip.pending, (state) => {
        state.loading = true;
      })
      .addCase(startTrip.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload;
        state.success = true;
        state.message = 'Trip started successfully';
      })
      .addCase(startTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Complete trip
      .addCase(completeTrip.pending, (state) => {
        state.loading = true;
      })
      .addCase(completeTrip.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = null;
        state.driver = action.payload.driver;
        state.success = true;
        state.message = 'Trip completed successfully';
      })
      .addCase(completeTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get booking history
      .addCase(getBookingHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(getBookingHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.bookingHistory = action.payload;
      })
      .addCase(getBookingHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { reset } = driverSlice.actions;
export default driverSlice.reducer;
