import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import bookingReducer from '../features/booking/bookingSlice';
import cabReducer from '../features/cab/cabSlice';
import paymentReducer from '../features/payment/paymentSlice';
import adminReducer from '../features/admin/adminSlice';
import driverReducer from '../features/driver/driverSlice';
import driverAuthReducer from '../features/driver/driverAuthSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    booking: bookingReducer,
    cab: cabReducer,
    payment: paymentReducer,
    admin: adminReducer,
    driver: driverReducer,
    driverAuth: driverAuthReducer,
  },
});
