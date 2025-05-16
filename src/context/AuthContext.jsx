import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const api = axios.create({
  baseURL: process.env.REACT_APP_SERVER_URL || "http://localhost:3900",
  withCredentials: true,
});

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
        const token = localStorage.getItem("accessToken");

        if (!token) {
          setLoading(false);
          return;
        }

        // Validate token by fetching current user
        const response = await api.get("/api/v1/users/current-user");

        if (response.data?.data) {
          setUser(response.data.data);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);

        // Clear invalid auth data
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userId");
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function - stores token and user data
  const login = async ({ type = "credentials", payload }) => {
    try {
      let response;

      if (type === "credentials") {
        response = await api.post("/api/v1/users/login", payload);
      } else if (type === "google") {
        response = await api.post("/api/v1/users/google-auth", {
          token: payload,
        });
      }

      const { accessToken, user } = response?.data?.data || {};

      if (!accessToken) {
        throw new Error("No access token received.");
      }

      // Store token
      localStorage.setItem("accessToken", accessToken);
      if (user?.id) {
        localStorage.setItem("userId", user.id);
      }

      setUser(user);
      setIsAuthenticated(true);

      return { success: true, user };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Login failed. Please try again.",
      };
    }
  };

  // Logout function - clears token and user data
  const logout = async () => {
    try {
      // Call logout API
      await api.post("/api/v1/users/logout");
    } catch (error) {
      console.error("Logout API error:", error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear all auth data
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userId");
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
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
