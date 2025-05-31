import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Import base API URL or use environment variable
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_URL = `${BASE_URL}/admin`;
const CAB_API_URL = `${BASE_URL}/cab`;
const DRIVER_API_URL = `${BASE_URL}/driver`;
const BOOKING_API_URL = `${BASE_URL}/booking`;

const initialState = {
  dashboardStats: null,
  users: [],
  testimonials: [],
  cabs: [],
  cities: [],
  routes: [],
  drivers: [],
  availableDrivers: [],
  pendingBookings: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
  cityToEdit: null,
  routeToEdit: null
};

// Get dashboard stats
export const getDashboardStats = createAsyncThunk(
  'admin/getDashboardStats',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`${API_URL}/dashboard`, config);
      
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

// Get all users
export const getAllUsers = createAsyncThunk(
  'admin/getAllUsers',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`${API_URL}/users`, config);
      
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

// Update user details (admin only)
export const updateUser = createAsyncThunk(
  'admin/updateUser',
  async ({ id, userData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.put(`${API_URL}/users/${id}`, userData, config);
      
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

// Delete user (admin only)
export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.delete(`${API_URL}/users/${id}`, config);
      
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

// Toggle user status (active/inactive)
export const toggleUserStatus = createAsyncThunk(
  'admin/toggleUserStatus',
  async ({ userId, newStatus }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.put(
        `${API_URL}/users/${userId}/status`,
        { status: newStatus },
        config
      );
      
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

// Get all testimonials for moderation (admin only)
export const getAllTestimonials = createAsyncThunk(
  'admin/getAllTestimonials',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`${API_URL}/testimonials`, config);
      
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

// Approve/reject testimonial (admin only)
export const moderateTestimonial = createAsyncThunk(
  'admin/moderateTestimonial',
  async ({ id, isApproved }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.put(
        `${API_URL}/testimonials/${id}`,
        { isApproved },
        config
      );
      
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

// Get all cab types
export const getAllCabs = createAsyncThunk(
  'admin/getAllCabs',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`${CAB_API_URL}`, config);
      
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

// Simple direct approach for adding a new cab type with image upload
export const addCab = createAsyncThunk(
  'admin/addCab',
  async (formData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      // Extract the image file from FormData
      let imageFile = null;
      let formDataObj = {};
      
      // Extract all form fields and the image file
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          imageFile = value;
          console.log(`${key}: [File] ${value.name} (${value.type}, ${value.size} bytes)`);
        } else {
          formDataObj[key] = value;
          console.log(`${key}: ${value}`);
        }
      }
      
      // STEP 1: First, create the cab without the image
      console.log('Step 1: Creating cab with data:', formDataObj);
      const configJson = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };
      
      // Check if name field exists
      if (!formDataObj.name) {
        throw new Error('Cab name is required but missing from form data');
      }
      
      // Send the JSON data to create the cab
      const jsonResponse = await axios.post(CAB_API_URL + '/noimage', formDataObj, configJson);
      console.log('Cab created successfully:', jsonResponse.data);
      
      // STEP 2: If there's an image, upload it separately
      if (imageFile) {
        console.log('Step 2: Uploading image for cab:', jsonResponse.data.data._id);
        const imageFormData = new FormData();
        imageFormData.append('image', imageFile);
        
        const configMultipart = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };
        
        try {
          // Upload image to the cab
          console.log('Sending image to:', `${CAB_API_URL}/${jsonResponse.data.data._id}/image`);
          const imageResponse = await axios.post(
            `${CAB_API_URL}/${jsonResponse.data.data._id}/image`, 
            imageFormData, 
            configMultipart
          );
          console.log('Image upload response:', imageResponse.data);
          
          // Update the jsonResponse with the image URL
          if (imageResponse.data && imageResponse.data.data) {
            jsonResponse.data.data = imageResponse.data.data;
          }
        } catch (imageError) {
          console.error('Error uploading image:', imageError);
          if (imageError.response) {
            console.error('Image upload error details:', imageError.response.data);
          }
        }
      }
      
      return jsonResponse.data;
    } catch (error) {
      console.error('Error in addCab:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
        console.error('Error data:', error.response.data);
      } else if (error.request) {
        console.error('No response received, request:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      
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

// Add new cab type using JSON approach instead of FormData
export const addCabSimple = createAsyncThunk(
  'admin/addCabSimple',
  async (formData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      // Convert FormData to a regular JSON object
      const entries = Object.fromEntries(formData.entries());
      console.log('Sending simplified cab data:', entries);
      
      // Don't append AC type if it's already in the name
      const nameAlreadyHasAcType = entries.name && entries.name.includes('(AC)') || entries.name.includes('(Non-AC)');
      const cabName = entries.name && entries.acType && !nameAlreadyHasAcType ? 
                      `${entries.name} (${entries.acType})` : 
                      entries.name || '';
      
      // Create a clean JSON object with explicit type conversions
      const cabData = {
        name: cabName,
        description: String(entries.description || entries.desc || ''),
        acType: String(entries.acType || 'AC'),
        seatingCapacity: Number(entries.seatingCapacity) || 4,
        luggageCapacity: Number(entries.luggageCapacity) || 2,
        baseKmPrice: Number(entries.baseKmPrice) || 0,
        extraFarePerKm: Number(entries.extraFarePerKm) || 0,
        includedKm: Number(entries.includedKm) || 0,
        vehicleLocation: String(entries.vehicleLocation || ''),
        active: true,
        features: []
      };
      
      // Handle charges - convert to proper backend format
      // Format used by the backend might be nested objects or flat properties
      if (entries.fuelCharges && typeof entries.fuelCharges === 'object') {
        cabData.fuelCharges = {
          included: String(entries.fuelCharges.included || 'true').toLowerCase() === 'true',
          charge: Number(entries.fuelCharges.charge) || 0
        };
      } else {
        cabData.fuelChargesIncluded = String(entries.fuelChargesIncluded || 'true').toLowerCase() === 'true';
        cabData.fuelChargesCharge = Number(entries.fuelChargesCharge) || 0;
      }
      
      if (entries.driverCharges && typeof entries.driverCharges === 'object') {
        cabData.driverCharges = {
          included: String(entries.driverCharges.included || 'true').toLowerCase() === 'true',
          charge: Number(entries.driverCharges.charge) || 0
        };
      } else {
        cabData.driverChargesIncluded = String(entries.driverChargesIncluded || 'true').toLowerCase() === 'true';
        cabData.driverChargesCharge = Number(entries.driverChargesCharge) || 0;
      }
      
      if (entries.nightCharges && typeof entries.nightCharges === 'object') {
        cabData.nightCharges = {
          included: String(entries.nightCharges.included || 'true').toLowerCase() === 'true',
          charge: Number(entries.nightCharges.charge) || 0
        };
      } else {
        cabData.nightChargesIncluded = String(entries.nightChargesIncluded || 'true').toLowerCase() === 'true';
        cabData.nightChargesCharge = Number(entries.nightChargesCharge) || 0;
      }
      
      // Handle features array properly
      if (entries.features) {
        if (Array.isArray(entries.features)) {
          cabData.features = [...entries.features]; // Clone the array
        } else {
          cabData.features.push(String(entries.features)); // Add as single item
        }
      }
      
      // Also process entries.feat if it exists (for backward compatibility)
      if (entries.feat) {
        if (Array.isArray(entries.feat)) {
          // Add any features not already in the array
          entries.feat.forEach(feature => {
            if (!cabData.features.includes(feature)) {
              cabData.features.push(String(feature));
            }
          });
        } else if (!cabData.features.includes(entries.feat)) {
          cabData.features.push(String(entries.feat));
        }
      }
      
      console.log('Prepared cab data for server:', cabData);
      
      // Use JSON for this request with explicit content type header
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      // Log the full URL being called for debugging
      const targetUrl = `${CAB_API_URL}/noimage`;
      console.log('Sending request to URL:', targetUrl);
      console.log('With headers:', config.headers);
      
      // Send to the dedicated no-image endpoint
      const response = await axios.post(targetUrl, cabData, config);
      
      return response.data;
    } catch (error) {
      console.error('Error in addCabSimple:', error);
      console.error('Error response:', error.response?.data);
      
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

// Update cab type
export const updateCab = createAsyncThunk(
  'admin/updateCab',
  async ({ id, cabData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };
      
      const response = await axios.put(`${CAB_API_URL}/${id}`, cabData, config);
      
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

// Delete cab type
export const deleteCab = createAsyncThunk(
  'admin/deleteCab',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.delete(`${CAB_API_URL}/${id}`, config);
      
      return { ...response.data, id };
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

// Get all cities
export const getAllCities = createAsyncThunk(
  'admin/getAllCities',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`/api/city`, config);
      
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

// Get all drivers
export const getAllDrivers = createAsyncThunk(
  'admin/getAllDrivers',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      console.log('Fetching drivers from:', `${DRIVER_API_URL}`);
      const response = await axios.get(`${DRIVER_API_URL}`, config);
      
      console.log('Driver API response:', response.data);
      if (response.data && response.data.data) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
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

// Get available drivers
export const getAvailableDrivers = createAsyncThunk(
  'admin/getAvailableDrivers',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`${DRIVER_API_URL}/available`, config);
      
      return response.data.data;
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

// Toggle driver status
export const toggleDriverStatus = createAsyncThunk(
  'admin/toggleDriverStatus',
  async ({ driverId, isAvailable }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.put(
        `${DRIVER_API_URL}/${driverId}/availability`,
        { isAvailable },
        config
      );
      
      return response.data.data;
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

// Toggle driver approval status
export const toggleDriverApproval = createAsyncThunk(
  'admin/toggleDriverApproval',
  async ({ driverId, isApproved }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.put(
        `${DRIVER_API_URL}/${driverId}/approval`,
        { isApproved },
        config
      );
      
      return response.data.data;
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

// Update driver documents directly
export const updateDriverDocuments = createAsyncThunk(
  'admin/updateDriverDocuments',
  async ({ driverId, documents }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      // Call the admin API endpoint for document update
      const response = await axios.put(
        `${API_URL}/driver/${driverId}/update-documents`, 
        { documents }, 
        config
      );
      
      return response.data.data;
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

// Verify driver document
export const verifyDriverDocument = createAsyncThunk(
  'admin/verifyDriverDocument',
  async ({ driverId, documentKey, isApproved }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      // Call the admin API endpoint for document verification
      const response = await axios.put(
        `${API_URL}/driver/${driverId}/verify-documents`, 
        { documentKey, isApproved }, 
        config
      );
      
      return response.data.data;
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

// Update driver details
export const updateDriverDetails = createAsyncThunk(
  'admin/updateDriverDetails',
  async ({ driverId, driverDetails }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      // Ensure numeric fields are properly converted to numbers
      const formattedData = {
        ...driverDetails,
        vehicleYear: driverDetails.vehicleYear ? parseInt(driverDetails.vehicleYear) : undefined
      };
      
      const response = await axios.put(
        `${API_URL}/driver/${driverId}`, 
        formattedData, 
        config
      );
      
      return response.data.data;
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

// Get pending bookings
export const getPendingBookings = createAsyncThunk(
  'admin/getPendingBookings',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`${BOOKING_API_URL}/confirmed`, config);
      
      return response.data.data;
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

// Assign driver to booking
// City Management
export const getCityManagementList = createAsyncThunk(
  'admin/getCityManagementList',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`${API_URL}/cities`, config);
      
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

export const addCity = createAsyncThunk(
  'admin/addCity',
  async (cityData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.post(`${API_URL}/cities`, cityData, config);
      
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

export const updateCity = createAsyncThunk(
  'admin/updateCity',
  async ({ cityId, cityData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.put(`${API_URL}/cities/${cityId}`, cityData, config);
      
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

export const deleteCity = createAsyncThunk(
  'admin/deleteCity',
  async (cityId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      await axios.delete(`${API_URL}/cities/${cityId}`, config);
      
      return { id: cityId };
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

export const assignDriverToBooking = createAsyncThunk(
  'admin/assignDriverToBooking',
  async ({ bookingId, driverId }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      // The request is failing because we're using the wrong endpoint
      // First try the correct endpoint
      let response;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          attempts++;
          console.log(`Attempt ${attempts}/${maxAttempts} to assign driver`);
          
          // Try the driver API endpoint first
          response = await axios.put(
            `${DRIVER_API_URL}/assign`,
            { bookingId, driverId },
            config
          );
          break; // If successful, exit the loop
        } catch (assignError) {
          console.log(`Attempt ${attempts}/${maxAttempts} failed:`, assignError);
          
          if (attempts === maxAttempts) {
            // If all attempts with driver API fail, try the booking API as fallback
            try {
              response = await axios.put(
                `${BOOKING_API_URL}/assign-driver`,
                { bookingId, driverId },
                config
              );
              break;
            } catch (bookingAssignError) {
              console.error('All assignment endpoints failed:', bookingAssignError);
              throw bookingAssignError; // Rethrow to be caught by the outer catch
            }
          }
          
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      return response.data.data;
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

export const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = '';
    },
    setCityToEdit: (state, action) => {
      state.cityToEdit = action.payload;
    },
    setRouteToEdit: (state, action) => {
      state.routeToEdit = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getDashboardStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.dashboardStats = action.payload.data;
      })
      .addCase(getDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getAllUsers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.users = action.payload.data;
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.users = state.users.map(user => 
          user._id === action.payload.data._id ? action.payload.data : user
        );
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(toggleUserStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = `User status updated to ${action.payload.status}`;
        // Update the user in the users list
        state.users = state.users.map(user => 
          user._id === action.payload._id ? action.payload : user
        );
      })
      .addCase(toggleUserStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.users = state.users.filter(user => user._id !== action.meta.arg);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getAllTestimonials.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllTestimonials.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.testimonials = action.payload.data;
      })
      .addCase(getAllTestimonials.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(moderateTestimonial.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(moderateTestimonial.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.testimonials = state.testimonials.map(testimonial => 
          testimonial._id === action.payload.data._id ? action.payload.data : testimonial
        );
      })
      .addCase(moderateTestimonial.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Cab operations reducers
      .addCase(getAllCabs.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllCabs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.cabs = action.payload.data;
      })
      .addCase(getAllCabs.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(addCab.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addCab.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.cabs.push(action.payload.data);
      })
      .addCase(addCab.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateCab.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateCab.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.cabs = state.cabs.map(cab => 
          cab._id === action.payload.data._id ? action.payload.data : cab
        );
      })
      .addCase(updateCab.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteCab.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteCab.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.cabs = state.cabs.filter(cab => cab._id !== action.payload.id);
      })
      .addCase(deleteCab.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // City operations reducers
      .addCase(getAllCities.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllCities.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.cities = action.payload.data;
      })
      .addCase(getAllCities.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // City management reducers
      .addCase(getCityManagementList.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCityManagementList.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.cities = action.payload.data;
      })
      .addCase(getCityManagementList.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Driver management reducers
      .addCase(getAllDrivers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllDrivers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.drivers = action.payload;
      })
      .addCase(getAllDrivers.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getAvailableDrivers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAvailableDrivers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.availableDrivers = action.payload;
      })
      .addCase(getAvailableDrivers.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(toggleDriverStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(toggleDriverStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = 'Driver status updated successfully';
        state.drivers = state.drivers.map(driver => 
          driver._id === action.payload._id ? action.payload : driver
        );
        // Also update in available drivers if present
        if (state.availableDrivers.some(driver => driver._id === action.payload._id)) {
          if (action.payload.isAvailable) {
            state.availableDrivers = state.availableDrivers.map(driver => 
              driver._id === action.payload._id ? action.payload : driver
            );
          } else {
            state.availableDrivers = state.availableDrivers.filter(driver => 
              driver._id !== action.payload._id
            );
          }
        } else if (action.payload.isAvailable) {
          state.availableDrivers.push(action.payload);
        }
      })
      .addCase(toggleDriverStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateDriverDetails.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateDriverDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = 'Driver details updated successfully';
        // Update the driver in the drivers list
        state.drivers = state.drivers.map(driver => 
          driver._id === action.payload._id ? action.payload : driver
        );
        // Also update in available drivers if present
        if (state.availableDrivers.some(driver => driver._id === action.payload._id)) {
          state.availableDrivers = state.availableDrivers.map(driver => 
            driver._id === action.payload._id ? action.payload : driver
          );
        }
      })
      .addCase(updateDriverDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(toggleDriverApproval.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(toggleDriverApproval.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = `Driver ${action.payload.isApproved ? 'approved' : 'rejected'} successfully`;
        state.drivers = state.drivers.map(driver => 
          driver._id === action.payload._id ? action.payload : driver
        );
      })
      .addCase(toggleDriverApproval.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Booking assignment reducers
      .addCase(getPendingBookings.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPendingBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.pendingBookings = action.payload;
      })
      .addCase(getPendingBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(assignDriverToBooking.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(assignDriverToBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = 'Driver assigned successfully';
        // Remove the booking from pending bookings
        state.pendingBookings = state.pendingBookings.filter(booking => 
          booking._id !== action.payload.booking._id
        );
        // Update the driver in the drivers list
        state.drivers = state.drivers.map(driver => 
          driver._id === action.payload.driver._id ? action.payload.driver : driver
        );
        // Remove the driver from available drivers
        state.availableDrivers = state.availableDrivers.filter(driver => 
          driver._id !== action.payload.driver._id
        );
      })
      .addCase(assignDriverToBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // City management additional reducers
      .addCase(addCity.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addCity.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.cities.push(action.payload.data);
        state.message = 'City added successfully';
      })
      .addCase(addCity.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateCity.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateCity.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.cities = state.cities.map(city => 
          city._id === action.payload.data._id ? action.payload.data : city
        );
        state.cityToEdit = null;
        state.message = 'City updated successfully';
      })
      .addCase(updateCity.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteCity.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteCity.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.cities = state.cities.filter(city => city._id !== action.payload.id);
        state.message = 'City deleted successfully';
      })
      .addCase(deleteCity.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  }
});

export const { reset, setCityToEdit, setRouteToEdit } = adminSlice.actions;
export default adminSlice.reducer;
