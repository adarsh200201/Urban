import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/cab';

const initialState = {
  cabTypes: [],
  availableCabs: [],
  selectedCab: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: ''
};

// Get all cab types
export const getAllCabTypes = createAsyncThunk(
  'cab/getAll',
  async (thunkAPI) => {
    try {
      const response = await axios.get(API_URL);
      
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

// Get single cab type
export const getCabType = createAsyncThunk(
  'cab/getById',
  async (id, thunkAPI) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      
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

// Get available cabs based on search criteria
export const getAvailableCabs = createAsyncThunk(
  'cab/getAvailable',
  async (searchData, thunkAPI) => {
    try {
      const response = await axios.post(`${API_URL}/available`, searchData);
      
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

// Admin: Create new cab type
export const createCabType = createAsyncThunk(
  'cab/create',
  async (cabData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.post(API_URL, cabData, config);
      
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

// Admin: Update cab type
export const updateCabType = createAsyncThunk(
  'cab/update',
  async ({ id, cabData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.put(`${API_URL}/${id}`, cabData, config);
      
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

// Admin: Delete cab type
export const deleteCabType = createAsyncThunk(
  'cab/delete',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.delete(`${API_URL}/${id}`, config);
      
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

export const cabSlice = createSlice({
  name: 'cab',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = '';
    },
    setSelectedCab: (state, action) => {
      state.selectedCab = action.payload;
    },
    resetSelectedCab: (state) => {
      state.selectedCab = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllCabTypes.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllCabTypes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.cabTypes = action.payload.data;
      })
      .addCase(getAllCabTypes.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getCabType.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCabType.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.selectedCab = action.payload.data;
      })
      .addCase(getCabType.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getAvailableCabs.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAvailableCabs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.availableCabs = action.payload.data;
      })
      .addCase(getAvailableCabs.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(createCabType.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createCabType.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.cabTypes.push(action.payload.data);
      })
      .addCase(createCabType.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateCabType.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateCabType.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.cabTypes = state.cabTypes.map(cab => 
          cab._id === action.payload.data._id ? action.payload.data : cab
        );
      })
      .addCase(updateCabType.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteCabType.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteCabType.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.cabTypes = state.cabTypes.filter(cab => cab._id !== action.meta.arg);
      })
      .addCase(deleteCabType.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  }
});

export const { reset, setSelectedCab, resetSelectedCab } = cabSlice.actions;
export default cabSlice.reducer;
