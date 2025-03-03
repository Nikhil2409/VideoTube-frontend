import { createContext, useContext, useState, useEffect } from "react";
import Cookies from 'js-cookie';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on initial load
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = Cookies.get("accessToken");
        
        if (token) {
          // Parse the JWT token to get user info (without verification)
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));
          
          setUser({
            accessToken: token,
            id: payload._id || payload.id || payload.sub, // Include _id as well
            username: payload.username,
            email: payload.email
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
      console.log("Just set accessToken:", Cookies.get("accessToken"));
      // Parse the JWT token to get user info
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      
      const userData = {
        accessToken: token,
        id: payload._id || payload.id || payload.sub, // Include _id as well
        username: payload.username,
        email: payload.email
      };
      
      setUser(userData);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  // Logout function - remove token and clear user state
  const logout = () => {
    Cookies.remove("accessToken");
    setUser(null);
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
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
