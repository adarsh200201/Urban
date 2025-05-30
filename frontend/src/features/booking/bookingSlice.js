import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Import base API URL or use environment variable
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_URL = `${BASE_URL}/booking`;

const initialState = {
  bookings: [],
  currentBooking: null,
  bookingForm: {
    pickupLocation: '',
    dropLocation: '',
    journeyType: 'oneWay', // oneWay, roundTrip, local, airport
    pickupDate: '',
    pickupTime: '',
    returnDate: '',
    returnTime: '',
    cabType: '',
    passengers: 1,
    distance: 0,
    duration: 0,
    fareDetails: {
      baseAmount: 0,
      taxAmount: 0,
      tollCharges: 0,
      driverAllowance: 0,
      nightCharges: 0,
      totalAmount: 0
    }
  },
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: ''
};

// Create new booking
export const createBooking = createAsyncThunk(
  'booking/create',
  async (bookingData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.post(API_URL, bookingData, config);
      
      return response.data;
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
        
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get user bookings
export const getUserBookings = createAsyncThunk(
  'booking/getUserBookings',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.get(API_URL, config);
      
      return response.data;
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
        
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get booking by ID
export const getBookingById = createAsyncThunk(
  'booking/getById',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`${API_URL}/${id}`, config);
      
      return response.data;
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
        
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Track booking by booking ID (public)
export const trackBooking = createAsyncThunk(
  'booking/track',
  async (bookingId, thunkAPI) => {
    try {
      const response = await axios.get(`${API_URL}/track/${bookingId}`);
      
      return response.data;
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
        
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Cancel booking
export const cancelBooking = createAsyncThunk(
  'booking/cancel',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.put(`${API_URL}/${id}/cancel`, {}, config);
      
      return response.data;
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
        
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = '';
    },
    resetCurrentBooking: (state) => {
      state.currentBooking = null;
    },
    updateBookingForm: (state, action) => {
      state.bookingForm = { ...state.bookingForm, ...action.payload };
    },
    calculateFare: (state, action) => {
      const { distance, cabType, journeyType } = action.payload;
      
      // This is a simplified fare calculation, actual implementation
      // would use more complex logic based on cab type, distance, etc.
      const basePrice = cabType.baseKmPrice * distance;
      const taxAmount = basePrice * 0.18; // 18% GST
      let tollCharges = cabType.tollCharges || 0;
      let driverAllowance = 0;
      let nightCharges = 0;
      
      // Add driver allowance for round trips
      if (journeyType === 'roundTrip') {
        driverAllowance = cabType.driverAllowance;
      }
      
      // Check if night charges apply (simplified check, actual would be more complex)
      const pickupHour = parseInt(state.bookingForm.pickupTime.split(':')[0]);
      if (pickupHour >= 22 || pickupHour < 6) {
        nightCharges = cabType.nightCharges;
      }
      
      const totalAmount = basePrice + taxAmount + tollCharges + driverAllowance + nightCharges;
      
      state.bookingForm.fareDetails = {
        baseAmount: basePrice,
        taxAmount,
        tollCharges,
        driverAllowance,
        nightCharges,
        totalAmount
      };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBooking.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentBooking = action.payload.data;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getUserBookings.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUserBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.bookings = action.payload.data;
      })
      .addCase(getUserBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getBookingById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getBookingById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentBooking = action.payload.data;
      })
      .addCase(getBookingById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(trackBooking.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(trackBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentBooking = action.payload.data;
      })
      .addCase(trackBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(cancelBooking.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentBooking = action.payload.data;
        
        // Update booking in the bookings list as well
        if (state.bookings.length > 0) {
          state.bookings = state.bookings.map(booking => 
            booking._id === action.payload.data._id ? action.payload.data : booking
          );
        }
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  }
});

export const { reset, resetCurrentBooking, updateBookingForm, calculateFare } = bookingSlice.actions;
export default bookingSlice.reducer;
