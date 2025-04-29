// api-client.js - A consistent API client for your application

import axios from 'axios';

const API_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:3900";

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor to add authentication token
api.interceptors.request.use(
  config => {
    // Get token from localStorage
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      // Send token via Authorization header
      config.headers['Authorization'] = `Bearer ${token}`;
      
      // Also send as x-access-token for backward compatibility
      config.headers['x-access-token'] = token;
    }
    
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling expired tokens
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        console.log('Attempting to refresh token...');
        
        // Try to refresh the token
        const refreshResponse = await axios.post(
          `${API_URL}/api/v1/users/refresh-token`,
          {},
          { withCredentials: true }
        );
        
        if (refreshResponse.data?.data?.accessToken) {
          const newToken = refreshResponse.data.data.accessToken;
          console.log('Token refreshed successfully');
          
          // Save the new token
          localStorage.setItem('accessToken', newToken);
          
          // Update the authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          originalRequest.headers['x-access-token'] = newToken;
          
          // Retry the original request
          return api(originalRequest);
        } else {
          console.log('Token refresh failed - no new token received');
          // Force logout
          localStorage.removeItem('accessToken');
          localStorage.removeItem('userId');
          window.location.href = '/login';
          return Promise.reject(new Error('Session expired. Please login again.'));
        }
      } catch (refreshError) {
        console.error('Token refresh error:', refreshError);
        
        // Force logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userId');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // For all other errors, just reject the promise
    return Promise.reject(error);
  }
);

// Debug API calls in development
if (process.env.NODE_ENV === 'development') {
  api.interceptors.request.use(request => {
    console.log('API Request:', {
      url: request.url,
      method: request.method,
      data: request.data,
      headers: {
        Authorization: request.headers.Authorization ? 'Bearer [HIDDEN]' : 'None',
        'Content-Type': request.headers['Content-Type'],
      }
    });
    return request;
  });
  
  api.interceptors.response.use(
    response => {
      console.log('API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
      return response;
    },
    error => {
      console.error('API Error:', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
      return Promise.reject(error);
    }
  );
}

// Export a customized version of the API client ready to use
export default api;