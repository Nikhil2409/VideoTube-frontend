import { createContext, useContext, useState, useEffect } from "react";
import Cookies from 'js-cookie';
import { cacheUtils } from "../components/utils/cacheUtils"

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = Cookies.get("accessToken");
        
        if (token) {
          // Parse the JWT token to get user info (without verification)
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));
          
          // Explicitly log the payload to see its structure
          console.log("JWT Payload:", payload);
  
          setUser({
            accessToken: token,
            id: payload._id || payload.id || payload.sub, 
            username: payload.username,
            email: payload.email,
          });
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        Cookies.remove("accessToken");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function - store token and set user state
  const login = (token) => {
    try {
      Cookies.set("accessToken", token, { 
        expires: 7, 
        secure: window.location.protocol === "https:", 
        sameSite: "Lax"
      });
      
      // Parse the JWT token to get user info
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      
      // Explicitly log the payload to see its structure
      console.log("Login Payload:", payload);

      // Attempt to extract watchHistoryIds with multiple fallback methods
      const watchHistoryIds = 
        payload.watchHistoryIds || 
        payload.watchHistory || 
        payload.watchHistoryId || 
        payload.watchHistoryids || 
        payload.watchhistoryIds || 
        [];

      const userData = {
        accessToken: token,
        id: payload._id || payload.id || payload.sub,
        username: payload.username,
        email: payload.email,
        watchHistoryIds: watchHistoryIds
      };
      
      // Additional debug logging
      console.log("Login Extracted Watch History IDs:", watchHistoryIds);
      
      setUser(userData);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  // Logout function - remove token and clear user state
  const logout = () => {
    if (user) {
      cacheUtils.clearUserCache(user.id);
    }
    Cookies.remove("accessToken");
    setUser(null);
    localStorage.clear();
    sessionStorage.clear();
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};