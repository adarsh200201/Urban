/**
 * API Configuration
 * 
 * This file centralizes API configuration, making it easier to switch between
 * development and production environments.
 */

// Use environment variable if available, otherwise fallback to localhost
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export { API_URL, SOCKET_URL };
