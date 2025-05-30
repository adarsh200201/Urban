import axios from 'axios';
import { API_URL } from '../config/apiConfig';


/**
 * Check if a fixed route exists between two cities
 * @param {string} fromCityId - Origin city ID
 * @param {string} toCityId - Destination city ID
 * @returns {Promise} - Promise resolving to fixed route data or null
 */
export const checkFixedRoute = async (fromCityId, toCityId) => {
  try {
    const response = await axios.post(`${API_URL}/fixed-routes/check`, {
      fromCityId,
      toCityId
    });
    
    if (response.data.success && response.data.isFixedRoute) {
      return response.data.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error checking for fixed route:', error);
    return null;
  }
};

/**
 * Get all fixed routes (for admin panel)
 * @returns {Promise} - Promise resolving to array of fixed routes
 */
export const getAllFixedRoutes = async () => {
  try {
    // First try the fixed-routes endpoint
    try {
      const response = await axios.get(`${API_URL}/fixed-routes`);
      if (response.data.success) {
        return response.data.data;
      }
    } catch (routeError) {
      console.warn('Fixed routes API not available, using fallback empty data');
      // API endpoint not available - this is expected on first run
    }
    
    // Return empty array if no data or endpoint not available
    return [];
  } catch (error) {
    console.error('Error fetching fixed routes:', error);
    return [];
  }
};

/**
 * Create a new fixed route (admin only)
 * @param {Object} routeData - Fixed route data
 * @param {string} token - Admin auth token
 * @returns {Promise} - Promise resolving to created route data
 */
export const createFixedRoute = async (routeData, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    const response = await axios.post(`${API_URL}/fixed-routes`, routeData, config);
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create fixed route');
  }
};

/**
 * Update an existing fixed route (admin only)
 * @param {string} id - Fixed route ID
 * @param {Object} routeData - Updated route data
 * @param {string} token - Admin auth token
 * @returns {Promise} - Promise resolving to updated route data
 */
export const updateFixedRoute = async (id, routeData, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    const response = await axios.put(`${API_URL}/fixed-routes/${id}`, routeData, config);
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update fixed route');
  }
};

/**
 * Delete a fixed route (admin only)
 * @param {string} id - Fixed route ID
 * @param {string} token - Admin auth token
 * @returns {Promise} - Promise resolving to success message
 */
export const deleteFixedRoute = async (id, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    const response = await axios.delete(`${API_URL}/fixed-routes/${id}`, config);
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete fixed route');
  }
};
