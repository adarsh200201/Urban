import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/driver/auth';

// No longer getting driver from localStorage
const initialState = {
  driver: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  isPendingApproval: false,
  message: '',
};

// Register driver
export const registerDriver = createAsyncThunk(
  'driverAuth/register',
  async (formData, thunkAPI) => {
    try {
      console.log('Preparing driver registration data...');
      
      // Create a timestamp for uniqueness
      const timestamp = Date.now();
      
      // Extract form values
      const name = formData.get('name');
      const originalEmail = formData.get('email');
      const phone = formData.get('phone');
      const password = formData.get('password');
      const vehicleModel = formData.get('vehicleModel');
      const vehicleNumber = formData.get('vehicleNumber');
      const licenseNumber = formData.get('licenseNumber');
      const licenseExpiry = formData.get('licenseExpiry');
      
      // We'll use the original email to avoid login confusion
      // but still make vehicle and license numbers unique
      const uniqueVehicleNumber = `${vehicleNumber}-${timestamp}`;
      const uniqueLicenseNumber = `${licenseNumber}-${timestamp}`;
      
      // Store the original email for better user experience
      const registrationEmail = originalEmail;
      
      console.log('Using unique identifiers to avoid conflicts:');
      console.log('- Email:', registrationEmail); // Now using original email
      console.log('- Vehicle Number:', uniqueVehicleNumber);
      console.log('- License Number:', uniqueLicenseNumber);
      
      // Get the documents file from the formData
      const documents = formData.get('documents');
      const vehicleType = formData.get('vehicleType');
      
      // Check if we have documents to upload
      if (documents) {
        console.log('Documents file found, preparing for upload:', documents.name);
        
        // Create a proper FormData object for file upload
        const uploadFormData = new FormData();
        uploadFormData.append('name', name);
        uploadFormData.append('email', registrationEmail);
        uploadFormData.append('phone', phone);
        uploadFormData.append('password', password);
        uploadFormData.append('vehicleModel', vehicleModel);
        uploadFormData.append('vehicleNumber', uniqueVehicleNumber);
        uploadFormData.append('licenseNumber', uniqueLicenseNumber);
        uploadFormData.append('licenseExpiry', licenseExpiry);
        uploadFormData.append('vehicleType', vehicleType);
        uploadFormData.append('documents', documents);
        
        console.log('Making POST request with documents to: http://localhost:5000/api/driver/auth/register');
        const response = await axios.post('http://localhost:5000/api/driver/auth/register', uploadFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        console.log('Server response with documents:', response.data);
        return {
          ...response.data,
          loginEmail: registrationEmail
        };
      } else {
        // No documents, fall back to JSON registration
        console.log('No documents file found, using simplified registration');
        
        const simplifiedData = {
          name,
          email: registrationEmail,
          phone,
          password,
          vehicleModel,
          vehicleNumber: uniqueVehicleNumber,
          licenseNumber: uniqueLicenseNumber,
          licenseExpiry,
          vehicleType,
          documentUploaded: false
        };
        
        console.log('Simplified registration data:', simplifiedData);
        
        // Use JSON data format for registration without documents
        console.log('Making POST request to: http://localhost:5000/api/driver/auth/direct-register');
        const response = await axios.post('http://localhost:5000/api/driver/auth/direct-register', simplifiedData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Server response without documents:', response.data);
        
        // Return the response with the login email
        return {
          ...response.data,
          loginEmail: registrationEmail  // Include the email to use for login
        };
      }
    } catch (error) {
      console.error('Registration failed with error:', error);
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

// Login driver
export const loginDriver = createAsyncThunk(
  'driverAuth/login',
  async (driverData, thunkAPI) => {
    try {
      console.log('Attempting login with:', driverData.email);
      const response = await axios.post(`${API_URL}/login`, driverData);
      
      if (response.data) {
        // No longer storing in localStorage, only using Redux state
        console.log('Driver login successful:', response.data);
      }
      
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

// Logout driver
export const logoutDriver = createAsyncThunk('driverAuth/logout', async () => {
  // No longer using localStorage, just clearing Redux state
  return {};
});

export const driverAuthSlice = createSlice({
  name: 'driverAuth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.isPendingApproval = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerDriver.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(registerDriver.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(registerDriver.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(loginDriver.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginDriver.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.driver = action.payload;
      })
      .addCase(loginDriver.rejected, (state, action) => {
        state.isLoading = false;
        
        // Check if this is a pending approval error (403)
        if (action.payload && action.payload.includes('pending approval')) {
          state.isPendingApproval = true;
          state.isError = false; // Not treating as an error
        } else {
          state.isError = true;
          state.isPendingApproval = false;
        }
        
        state.message = action.payload;
        state.driver = null;
      })
      .addCase(logoutDriver.fulfilled, (state) => {
        state.driver = null;
      });
  },
});

export const { reset } = driverAuthSlice.actions;
export default driverAuthSlice.reducer;
