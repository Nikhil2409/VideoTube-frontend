// AuthContext.js - Improved version with consistent auth handling
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from './api-client'; 

// Create Auth Context
const AuthContext = createContext(null);

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have a token
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          setLoading(false);
          return;
        }
        
        // Validate token by fetching current user
        const response = await api.get('/api/v1/users/current-user');
        
        if (response.data?.data) {
          setUser(response.data.data);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        
        // Clear invalid auth data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userId');
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  // Login function - stores token and user data
  const login = (token, userData) => {
    if (!token) {
      console.error('Login failed: No token provided');
      return false;
    }
    
    try {
      // Store token in localStorage
      localStorage.setItem('accessToken', token);
      
      // If we have user data, use it directly
      if (userData) {
        setUser(userData);
        if (userData.id) {
          localStorage.setItem('userId', userData.id);
        }
      }
      
      // Set auth state
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Logout function - clears token and user data
  const logout = async () => {
    try {
      // Call logout API
      await api.post('/api/v1/users/logout');
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear all auth data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userId');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Auth context value
  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;