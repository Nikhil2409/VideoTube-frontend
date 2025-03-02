import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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

      console.log("FormData entries:");
      for (let [key, value] of formDataToSend.entries()) {
        console.log(key, value);
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
      navigate("/");
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

  // Handle navigation to login page
  const goToLogin = () => {
    navigate("/");
  };

  return (
    <div>
      <div style={styles.registerContainer}>
        <h2>Register User</h2>
        {message && <p style={styles.success}>{message}</p>}
        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          {/* Image Preview Section */}
          <div style={styles.imagePreviewSection}>
            {coverPreview && (
              <div style={styles.coverPreviewContainer}>
                <img src={coverPreview} alt="Cover Preview" style={styles.coverPreview} />
              </div>
            )}

            {avatarPreview && (
              <div style={styles.avatarPreviewContainer}>
                <img src={avatarPreview} alt="Avatar Preview" style={styles.avatarPreview} />
              </div>
            )}
          </div>

          {/* File Inputs */}
          <div style={styles.fileInputs}>
            <div style={styles.fileInputGroup}>
              <label htmlFor="avatar" style={styles.fileInputLabel}>Avatar</label>
              <input 
                type="file" 
                id="avatar" 
                name="avatar" 
                accept="image/*" 
                onChange={handleFileChange} 
                required 
                style={styles.fileInput}
              />
            </div>

            <div style={styles.fileInputGroup}>
              <label htmlFor="coverImage" style={styles.fileInputLabel}>Cover Image (Optional)</label>
              <input 
                type="file" 
                id="coverImage" 
                name="coverImage" 
                accept="image/*" 
                onChange={handleFileChange} 
                style={styles.fileInput}
              />
            </div>
          </div>

          {/* User Info Inputs */}
          <input 
            type="text" 
            name="fullName" 
            placeholder="Full Name" 
            value={formData.fullName}
            onChange={handleChange} 
            required 
            style={styles.input}
          />
          <input 
            type="email" 
            name="email" 
            placeholder="Email" 
            value={formData.email}
            onChange={handleChange} 
            required 
            style={styles.input}
          />
          <input 
            type="text" 
            name="username" 
            placeholder="Username" 
            value={formData.username}
            onChange={handleChange} 
            required 
            style={styles.input}
          />
          <input 
            type="password" 
            name="password" 
            placeholder="Password" 
            value={formData.password}
            onChange={handleChange} 
            required 
            style={styles.input}
          />

          <button 
            type="submit" 
            disabled={isLoading}
            style={isLoading ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
          >
            {isLoading ? "Registering..." : "Register"}
          </button>
        </form>

        {/* Added Login Navigation */}
        <div style={styles.loginSection}>
          <p>Already have an account?</p>
          <button 
            onClick={goToLogin}
            style={styles.loginButton}
          >
            Go to Login
          </button>
        </div>
      </div>

      {/* Add the global styling */}
      <style jsx global>{`
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        
        /* Theming Variables */
        :root {
          --background: oklch(1 0 0);
          --foreground: oklch(0.145 0 0);
          --card: oklch(1 0 0);
          --primary: oklch(0.205 0 0);
          --border: oklch(0.922 0 0);
          --ring: oklch(0.87 0 0);
        }
        
        .dark {
          --background: oklch(0.145 0 0);
          --foreground: oklch(0.985 0 0);
          --primary: oklch(0.985 0 0);
          --border: oklch(0.269 0 0);
        }
      `}</style>
    </div>
  );
};

// Styles object for inline styling
const styles = {
  registerContainer: {
    background: 'white',
    padding: '50px 60px',
    borderRadius: '8px',
    boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
    width: '400px',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: '10px',
    margin: '10px 0',
    border: '1px solid #ccc',
    borderRadius: '5px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '10px',
    marginTop: '20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
    cursor: 'not-allowed',
  },
  success: {
    color: 'green',
    fontSize: '14px',
  },
  error: {
    color: 'red',
    fontSize: '14px',
  },
  imagePreviewSection: {
    marginBottom: '15px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  coverPreviewContainer: {
    width: '100%',
    height: '100px',
    overflow: 'hidden',
    marginBottom: '10px',
    borderRadius: '5px',
    backgroundColor: '#f8f8f8',
  },
  coverPreview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarPreviewContainer: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    overflow: 'hidden',
    marginTop: '-40px',
    border: '3px solid white',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
    backgroundColor: '#f8f8f8',
  },
  avatarPreview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  fileInputs: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '15px',
  },
  fileInputGroup: {
    textAlign: 'left',
  },
  fileInputLabel: {
    display: 'block',
    marginBottom: '5px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  fileInput: {
    border: '1px dashed #ccc',
    padding: '8px',
    backgroundColor: '#f9f9f9',
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box',
  },
  loginSection: {
    marginTop: '20px',
    borderTop: '1px solid #eee',
    paddingTop: '20px',
  },
  loginButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    padding: '8px 15px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    marginTop: '5px',
  }
};

export default RegisterUser;
