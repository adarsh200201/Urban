import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

/**
 * Service to handle all rating-related operations
 * Centralizes rating logic in one place to avoid duplication
 */
class RatingService {
  /**
   * Submit a user rating for a driver
   * @param {string} bookingId - The ID of the booking
   * @param {string} driverId - The ID of the driver being rated
   * @param {number} rating - Rating value (1-5)
   * @param {string} comment - Optional comment
   * @param {string} token - Authentication token
   * @returns {Promise} - Promise with rating result
   */
  async submitUserRating(bookingId, driverId, rating, comment, token) {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.post(
        `${API_URL}/rating/driver`,
        { 
          bookingId, 
          driverId, 
          rating, 
          comment 
        },
        config
      );

      return response.data;
    } catch (error) {
      console.error('Submit user rating error:', error);
      throw error;
    }
  }

  /**
   * Submit a driver rating for a user
   * @param {string} bookingId - The ID of the booking
   * @param {string} userId - The ID of the user being rated
   * @param {number} rating - Rating value (1-5)
   * @param {string} comment - Optional comment
   * @param {string} token - Authentication token
   * @returns {Promise} - Promise with rating result
   */
  async submitDriverRating(bookingId, userId, rating, comment, token) {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.post(
        `${API_URL}/rating/user`,
        { 
          bookingId, 
          userId, 
          rating, 
          comment 
        },
        config
      );

      return response.data;
    } catch (error) {
      console.error('Submit driver rating error:', error);
      throw error;
    }
  }

  /**
   * Get driver's average rating
   * @param {string} driverId - The ID of the driver
   * @returns {Promise} - Promise with driver rating data
   */
  async getDriverRating(driverId) {
    try {
      const response = await axios.get(`${API_URL}/rating/driver/${driverId}`);
      return response.data;
    } catch (error) {
      console.error('Get driver rating error:', error);
      throw error;
    }
  }

  /**
   * Get user's average rating
   * @param {string} userId - The ID of the user
   * @param {string} token - Authentication token
   * @returns {Promise} - Promise with user rating data
   */
  async getUserRating(userId, token) {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.get(
        `${API_URL}/rating/user/${userId}`,
        config
      );

      return response.data;
    } catch (error) {
      console.error('Get user rating error:', error);
      throw error;
    }
  }

  /**
   * Check if rating is needed for a booking
   * @param {Object} booking - The booking object
   * @param {string} userType - 'user' or 'driver'
   * @returns {Object} - Whether rating is needed and related information
   */
  checkRatingStatus(booking, userType) {
    if (!booking) {
      return { needed: false, reason: 'Booking not found' };
    }
    
    // Only completed rides can be rated
    if (booking.status !== 'completed') {
      return { needed: false, reason: 'Only completed rides can be rated' };
    }
    
    // Check rating deadline (if applicable - e.g., 7 days after completion)
    const completedAt = booking.completedAt ? new Date(booking.completedAt) : null;
    if (completedAt) {
      const now = new Date();
      const daysSinceCompletion = (now - completedAt) / (1000 * 60 * 60 * 24);
      
      // Only allow ratings within 7 days of completion
      if (daysSinceCompletion > 7) {
        return { needed: false, reason: 'Rating period has expired (7 days)' };
      }
    }
    
    // Check if this user type has already rated
    if (userType === 'user') {
      if (booking.userRating) {
        return { 
          needed: false, 
          reason: 'You have already rated this ride', 
          existingRating: booking.userRating 
        };
      }
    } else if (userType === 'driver') {
      if (booking.driverRating) {
        return { 
          needed: false, 
          reason: 'You have already rated this passenger', 
          existingRating: booking.driverRating 
        };
      }
    }
    
    // Rating is needed
    return { 
      needed: true, 
      reason: userType === 'user' ? 'Please rate your driver' : 'Please rate your passenger'
    };
  }
  
  /**
   * Legacy method for backward compatibility
   * @param {Object} booking - The booking object
   * @param {string} userType - 'user' or 'driver'
   * @returns {boolean} - Whether rating is needed
   */
  isRatingNeeded(booking, userType) {
    const status = this.checkRatingStatus(booking, userType);
    return status.needed;
  }
  
  /**
   * Get all ratings for a user or driver
   * @param {string} id - User or driver ID
   * @param {string} type - 'user' or 'driver'
   * @param {string} token - Authentication token (required for user ratings)
   * @returns {Promise} - Promise with ratings data
   */
  async getAllRatings(id, type, token) {
    try {
      const config = type === 'user' ? {
        headers: { Authorization: `Bearer ${token}` }
      } : {};
      
      const endpoint = type === 'user' ? 
        `${API_URL}/rating/user/${id}/all` : 
        `${API_URL}/rating/driver/${id}/all`;
      
      const response = await axios.get(endpoint, config);
      return response.data;
    } catch (error) {
      console.error(`Get ${type} ratings error:`, error);
      throw error;
    }
  }
  
  /**
   * Get rating prompt status - checks if user/driver needs to rate any recent rides
   * @param {string} id - User or driver ID
   * @param {string} type - 'user' or 'driver'
   * @param {string} token - Authentication token
   * @returns {Promise} - Promise with rating prompt status
   */
  async getRatingPromptStatus(id, type, token) {
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      
      const endpoint = `${API_URL}/rating/${type}/${id}/pending`;
      const response = await axios.get(endpoint, config);
      
      return response.data;
    } catch (error) {
      console.error('Get rating prompt status error:', error);
      throw error;
    }
  }
}



export default new RatingService();
