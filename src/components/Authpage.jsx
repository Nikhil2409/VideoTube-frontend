import React, { useState } from 'react';
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import axios from "axios";

const AuthPage = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setMessage('');
      
      const payload = { username, password };
      
      console.log("Sending auth request:", {
        endpoint: "login",
        payload: { username, password: "********" },
        url: `${process.env.REACT_APP_SERVER_URL}/api/v1/users/login`
      });

      // Use axios instead of fetch for consistent handling
      const response = await axios.post(
        `${process.env.REACT_APP_SERVER_URL}/api/v1/users/login`,
        payload,
        { 
          headers: { "Content-Type": "application/json" },
          withCredentials: true  // Important for cookies
        }
      );
      
      console.log("Login response:", response.data);
      
      if (response.data && response.data.data && response.data.data.accessToken) {
        // Store token in localStorage for non-cookie auth
        localStorage.setItem('accessToken', response.data.data.accessToken);
        localStorage.setItem('userId', response.data.data.user.id);
        
        // Also pass the token and user data to context
        const loginSuccess = login(response.data.data.accessToken, response.data.data.user);
        
        if (loginSuccess) {
          setMessage("Success! You are logged in.");
          navigate("/dashboard", { state: { user: response.data.data } });
        } else {
          setMessage("Login failed. Please try again.");
        }
      } else {
        setMessage("Login successful but token was not received.");
      }
    } catch (error) {
      console.error("Login error details:", error);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setMessage(error.response.data?.message || "Authentication failed");
      } else if (error.request) {
        // The request was made but no response was received
        setMessage("No response from server. Please try again later.");
      } else {
        // Something happened in setting up the request that triggered an Error
        setMessage(error.message || "Server error. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsLoading(true);
      setMessage('');
      
      // Decode the credential to get user info
      const decoded = jwtDecode(credentialResponse.credential);
      console.log("Decoded Google credential:", decoded);

      const response = await axios.post(
        `${process.env.REACT_APP_SERVER_URL}/api/v1/users/google-auth`,
        { token: credentialResponse.credential },
        { 
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        }
      );

      if (response.data && response.data.data && response.data.data.accessToken) {
        // Store token in localStorage
        localStorage.setItem('accessToken', response.data.data.accessToken);
        localStorage.setItem('userId', response.data.data.user.id);
        
        // Pass token and user data to context
        const loginSuccess = login(response.data.data.accessToken, response.data.data.user);
        
        if (loginSuccess) {
          setMessage("Success! You are logged in with Google.");
          navigate("/dashboard", { state: { user: response.data.data } });
        } else {
          setMessage("Google login failed. Please try again.");
        }
      } else {
        setMessage("Google login successful but token was not received.");
      }
    } catch (error) {
      console.error("Google auth error:", error);
      if (error.response) {
        setMessage(error.response.data?.message || "Google authentication failed.");
      } else {
        setMessage("An error occurred with Google authentication. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setMessage("Google authentication failed. Please try again.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 md:px-16 relative">
        {/* Logo */}
        <div className="absolute top-8 left-8 flex items-center">
          <span className="ml-2 text-xl font-semibold text-gray-700">VideoTube</span>
        </div>

        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold text-gray-900 mb-20">Login to Your Account</h1>
          
          {/* Google Login */}
          <div className="mb-8">
            <p className="text-center text-gray-400 mb-4">Login using Google</p>
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="filled_blue"
                text="signin_with"
                shape="circle"
                size="large"
              />
            </div>
          </div>

          {/* OR Divider */}
          <div className="flex items-center mb-8">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-gray-500 text-sm">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full px-4 py-3 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
            <div className="mb-6 relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showPassword ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  )}
                </svg>
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full ${isLoading ? 'bg-blue-400' : 'bg-blue-400 hover:bg-teal-600'} text-white py-3 rounded-full font-medium transition-colors`}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>
          
          {message && <p className={`text-center text-sm mt-4 ${message.includes("Success") ? "text-green-600" : "text-red-600"}`}>{message}</p>}
        
        </div>
      </div>

      {/* Right Side - Register CTA */}
      <div className="hidden md:flex md:flex-1 bg-gradient-to-br from-blue-400 to-blue-700 text-white flex-col items-center justify-center relative">
        <div className="text-center px-12 max-w-md">
          <h2 className="text-5xl font-bold mb-6">New Here?</h2>
          <p className="text-xl mb-10">Sign up and discover a great amount of new opportunities!</p>
          <button 
            onClick={() => navigate("/register")}
            className="bg-white text-blue-600 px-10 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;