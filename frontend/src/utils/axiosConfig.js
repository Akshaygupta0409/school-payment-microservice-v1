import axios from 'axios';

// Use environment variable for API base URL; default to local proxy
const API_URL = import.meta.env.VITE_BACKEND_API_URL || '/api';

// Create a debug logger function that logs to console with timestamp
const debugLog = (message, data) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [AXIOS-DEBUG] ${message}`, data);
};

// Log environment and config details on startup
debugLog('Axios config initialized with:', { 
  API_URL, 
  NODE_ENV: import.meta.env.MODE,
  IS_PROD: import.meta.env.PROD,
  BASE_URL: import.meta.env.BASE_URL
});

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request if available
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Log request details
    debugLog(`Request: ${config.method.toUpperCase()} ${config.url}`, {
      headers: config.headers,
      params: config.params,
      data: config.data
    });
    
    // Ensure auth endpoints are properly formatted
    if (config.url && config.url.startsWith('/auth') && !API_URL.endsWith('/api')) {
      // If we're using a direct URL (not the /api proxy), ensure auth endpoints have /api prefix
      debugLog('Auth endpoint detected, ensuring proper API path');
      if (API_URL.includes('onrender.com') || API_URL.includes('localhost')) {
        // Only modify if it's a direct backend URL
        config.url = `/api${config.url}`;
        debugLog('Modified auth URL path:', config.url);
      }
    }
    
    return config;
  },
  (error) => {
    debugLog('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
axiosInstance.interceptors.response.use(
  (response) => {
    debugLog(`Response: ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`, {
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  (error) => {
    debugLog('Response error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    });
    return Promise.reject(error);
  }
);

export default axiosInstance;
