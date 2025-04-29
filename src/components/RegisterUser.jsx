import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

const RegisterUser = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    avatar: null,
    coverImage: null,
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [avatarPreview, coverPreview]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const { name } = e.target;

    if (!file) return;

    // Store the file in formData
    setFormData(prev => ({
      ...prev,
      [name]: file
    }));

    // Create and store preview URL
    const previewUrl = URL.createObjectURL(file);
    if (name === "avatar") {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(previewUrl);
    } else if (name === "coverImage") {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverPreview(previewUrl);
    }
  };

  const validateForm = () => {
    if (!formData.fullName || !formData.email || !formData.username || !formData.password || !formData.avatar) {
      setError("All fields including profile picture are required.");
      return false;
    }
    
    // Add email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    
    // Add password strength validation
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();

      // Append text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'avatar' && key !== 'coverImage') {
          formDataToSend.append(key, value);
        }
      });

      // Append files
      if (formData.avatar) {
        formDataToSend.append("avatar", formData.avatar);
      }
      if (formData.coverImage) {
        formDataToSend.append("coverImage", formData.coverImage);
      }

      const response = await axios.post(
        "http://localhost:3900/api/v1/users/register",
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setMessage(response.data.message || "Registration successful!");
      
      // Redirect to login page after successful registration
      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      console.error("Registration error:", error);
      if (error.response) {
        // Server responded with an error
        setError(error.response.data.message || `Registration failed (${error.response.status})`);
      } else if (error.request) {
        // No response received
        setError("Server not responding. Please try again later.");
      } else {
        // Request setup error
        setError("An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsLoading(true);
      setMessage("");
      
      // Decode the credential to get user info (optional, your backend will also verify this)
      const decoded = jwtDecode(credentialResponse.credential);
      console.log("Decoded Google credential:", decoded);

      // Send the ID token to your backend for verification and processing
      const response = await axios.post(
        "http://localhost:3900/api/v1/users/google-auth",
        { token: credentialResponse.credential },
        { headers: { "Content-Type": "application/json" } }
      );

      setMessage(response.data.message || "Google registration successful!");
      
      // Store the token and redirect
      if (response.data.data && response.data.data.accessToken) {
        localStorage.setItem("token", response.data.data.accessToken);
        setTimeout(() => navigate("/dashboard"), 2000);
      }
    } catch (error) {
      console.error("Google auth error:", error);
      if (error.response) {
        setError(error.response.data.message || "Google authentication failed.");
      } else {
        setError("An error occurred with Google authentication. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google authentication failed. Please try again.");
  };

  return (
    <div className="flex h-screen w-full">
      {/* Left Side - Blue Gradient */}
      <div className="hidden md:flex md:flex-1 bg-gradient-to-br from-blue-400 to-blue-700 text-white flex-col items-center justify-center relative">
        {/* Close Button */}
        <div className="absolute top-8 left-8 flex items-center">
          <span className="ml-2 text-xl font-semibold text-white">VideoTube</span>
        </div>
        <div className="text-center px-12 max-w-md">
          <h2 className="text-5xl font-bold mb-6">Already have an account?</h2>
          <p className="text-xl mb-10">Sign in and continue your journey with us!</p>
          <button 
            onClick={() => navigate("/")}
            className="bg-white text-blue-600 px-10 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 md:px-16 relative">
        {/* Logo */}
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold text-gray-900 mb-12">Create Your Account</h1>
          
          {/* Google Registration Option */}
          <div className="mb-8">
            <p className="text-center text-gray-400 mb-4">Register using Google</p>
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="filled_blue"
                text="signup_with"
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

          {message && <p className="text-center text-sm mb-4 text-green-600">{message}</p>}
          {error && <p className="text-center text-sm mb-4 text-red-600">{error}</p>}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            {/* Profile Avatar Preview */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className={`w-20 h-20 rounded-full overflow-hidden ${avatarPreview ? "" : "bg-gray-100"} flex items-center justify-center border-2 border-blue-400`}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <label htmlFor="avatar" className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-2 cursor-pointer hover:bg-blue-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input
                    type="file"
                    id="avatar"
                    name="avatar"
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                    required
                  />
                </label>
              </div>
            </div>

            <div className="mb-4">
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Full Name"
                className="w-full px-4 py-3 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className="w-full px-4 py-3 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Username"
                className="w-full px-4 py-3 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-6 relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password (minimum 8 characters)"
                className="w-full px-4 py-3 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            
            {/* Cover Image - Optional */}
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">Cover Image (Optional)</p>
              <div className={`w-full h-16 rounded-lg overflow-hidden relative ${coverPreview ? "" : "bg-gray-100 border-2 border-dashed border-gray-300"}`}>
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <input
                  type="file"
                  id="coverImage"
                  name="coverImage"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept="image/*"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full ${isLoading ? 'bg-blue-400' : 'bg-blue-500 hover:bg-blue-600'} text-white py-3 rounded-full font-medium transition-colors`}
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            By registering, you agree to our{" "}
            <a href="#" className="text-blue-600 hover:text-blue-800">Terms of Service</a>{" "}
            and{" "}
            <a href="#" className="text-blue-600 hover:text-blue-800">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterUser;