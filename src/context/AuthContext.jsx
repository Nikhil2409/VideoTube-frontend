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

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const response = await api.get("/api/v1/users/current-user");
        if (response.data?.data) {
          setUser(response.data.data);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
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

  const logout = async () => {
    try {
      await api.post("/api/v1/users/logout");
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
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
