import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { useAuth } from "../../context/AuthContext";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const accessToken = Cookies.get("accessToken");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
  });

  const api = axios.create({
    baseURL: "http://localhost:3900",
    withCredentials: true,
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  // Separate state for file uploads
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);

  const [avatarPreview, setAvatarPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  useEffect(() => {
    // Clean up object URLs when component unmounts
    return () => {
      if (
        avatarPreview &&
        typeof avatarPreview === "string" &&
        avatarPreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(avatarPreview);
      }
      if (
        coverPreview &&
        typeof coverPreview === "string" &&
        coverPreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [avatarPreview, coverPreview]);

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated() || !accessToken) return;
      
      try {
        const response = await api.get("/api/v1/users/current-user");
        const userData = response.data.data;
        
        // Check if user is authenticated with Google
        setIsGoogleUser(userData.googleId ? true : false);
        
        setFormData({
          fullName: userData.fullName || "",
          email: userData.email || "",
          username: userData.username || "",
        });
        
        setAvatarPreview(userData.avatar);
        setCoverPreview(userData.coverImage);
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (error.response?.status === 401) {
          setError("Your session has expired. Please log in again.");
          setTimeout(() => navigate("/login"), 2000);
        }
      }
    };
    
    fetchUserData();
  }, [isAuthenticated, accessToken, navigate]);

  // Update form data if user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        username: user.username || "",
      });
      setAvatarPreview(user.avatar);
      setCoverPreview(user.coverImage);
      
      // Check if user is authenticated with Google
      setIsGoogleUser(user.googleId ? true : false);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If user is authenticated with Google, don't allow email changes
    if (isGoogleUser && name === "email") {
      setError("Email cannot be changed for Google-authenticated accounts");
      return;
    }
    
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const { name } = e.target;
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    if (name === "avatar") {
      setAvatarFile(file);

      if (
        avatarPreview &&
        typeof avatarPreview === "string" &&
        avatarPreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarPreview(previewUrl);
    } else if (name === "coverImage") {
      setCoverImageFile(file);

      if (
        coverPreview &&
        typeof coverPreview === "string" &&
        coverPreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(coverPreview);
      }
      setCoverPreview(previewUrl);
    }
  };

  // Function to update avatar
  const updateAvatar = async () => {
    if (!avatarFile) return true;

    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      await api.patch("/api/v1/users/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return true;
    } catch (error) {
      console.error("Error updating avatar:", error);
      throw error;
    }
  };

  // Function to update cover image
  const updateCoverImage = async () => {
    if (!coverImageFile) return true;

    try {
      const formData = new FormData();
      formData.append("coverImage", coverImageFile);

      await api.patch("/api/v1/users/cover-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return true;
    } catch (error) {
      console.error("Error updating cover image:", error);
      throw error;
    }
  };

  // Function to update basic profile info
  const updateProfileInfo = async () => {
    // For Google users, remove email from the update data
    const updateData = { ...formData };
    if (isGoogleUser) {
      delete updateData.email;
    }
    
    try {
      await api.patch("/api/v1/users/update-account", updateData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return true;
    } catch (error) {
      console.error("Error updating profile info:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setIsLoading(true);

    try {
      // Update profile info first
      await updateProfileInfo();

      // Update avatar and cover image if files are selected
      if (avatarFile) {
        await updateAvatar();
      }

      if (coverImageFile) {
        await updateCoverImage();
      }

      setMessage("Profile updated successfully!");
      setTimeout(() => navigate("/profile"), 2000);
    } catch (error) {
      console.error("Error updating profile:", error);
      
      // Handle different error types
      if (error.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
        setTimeout(() => navigate("/login"), 2000);
      } else if (error.response?.status === 400 && error.response?.data?.message?.includes("already taken")) {
        setError("Username or email is already taken by another user.");
      } else {
        setError(
          error.response?.data?.message ||
            "Failed to update profile. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = () => {
    if (isGoogleUser) {
      setError("Password cannot be changed for Google-authenticated accounts. Please use Google to manage your password.");
      return;
    }
    setShowPasswordPopup(true);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }
    
    try {
      setIsLoading(true);
      // Use the dedicated password change endpoint
      await api.patch(
        "/api/v1/users/change-password",
        { oldPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      setShowPasswordPopup(false);
      setMessage("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setAttempts(attempts + 1);
      setError(error.response?.data?.message || "Failed to change password");
      if (attempts >= 2) {
        setShowPasswordPopup(false);
        setError("Too many failed attempts. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // If not authenticated, show a message
  if (!isAuthenticated() && !user) {
    return (
      <div className="edit-profile-container">
        <style>{`
          .edit-profile-container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 500px;
            margin: 0 auto;
          }
          .error-message {
            color: red;
            padding: 10px;
            margin-bottom: 15px;
            background-color: rgba(255, 0, 0, 0.1);
            border-radius: 4px;
          }
        `}</style>
        <h2>Edit Profile</h2>
        <p className="error-message">You are not logged in. Redirecting to login page...</p>
      </div>
    );
  }

  return (
    <div className="edit-profile-container">
      <style>{`
        .edit-profile-container {
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 500px;
          margin: 0 auto;
        }
        .form-group {
          margin-bottom: 15px;
          text-align: left;
        }
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        .form-group input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        .image-section {
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }
        .cover-image {
          width: 100%;
          height: 120px;
          object-fit: cover;
          border-radius: 5px;
          background-color: #f0f0f0;
        }
        .avatar-image {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          margin-top: -50px;
          border: 3px solid white;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
          background-color: #e0e0e0;
        }
        .success-message {
          color: green;
          padding: 10px;
          margin-bottom: 15px;
          background-color: rgba(0, 128, 0, 0.1);
          border-radius: 4px;
        }
        .error-message {
          color: red;
          padding: 10px;
          margin-bottom: 15px;
          background-color: rgba(255, 0, 0, 0.1);
          border-radius: 4px;
        }
        .button {
          background-color: #4a90e2;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          margin-right: 10px;
          margin-top: 10px;
        }
        .button:hover {
          background-color: #3a80d2;
        }
        .button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        .password-popup {
          background: white;
          padding: 20px;
          border: 1px solid #ccc;
          box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 300px;
          z-index: 1000;
          border-radius: 8px;
        }
        .overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 999;
        }
        .google-badge {
          background-color: #f1f1f1;
          color: #666;
          font-size: 12px;
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: 8px;
          display: inline-block;
        }
        .disabled-field {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }
      `}</style>
      <h2>Edit Profile</h2>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
      
      {isGoogleUser && (
        <p className="info-message" style={{ backgroundColor: "#e8f4ff", padding: "10px", borderRadius: "4px", marginBottom: "15px" }}>
          <strong>Google Account:</strong> Some profile information is managed through your Google account.
        </p>
      )}
      
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="image-section">
          <div className="cover-container">
            {coverPreview ? (
              <img src={coverPreview} alt="Cover" className="cover-image" />
            ) : (
              <div className="cover-image"></div>
            )}
          </div>
          {avatarPreview ? (
            <img src={avatarPreview} alt="Avatar" className="avatar-image" />
          ) : (
            <div className="avatar-image"></div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="fullName">Full Name</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">
            Email
            {isGoogleUser && <span className="google-badge">Managed by Google</span>}
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className={isGoogleUser ? "disabled-field" : ""}
            disabled={isGoogleUser}
          />
          {isGoogleUser && (
            <small style={{ color: "#666", display: "block", marginTop: "5px" }}>
              Email address is linked to your Google account and cannot be changed here.
            </small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="avatar">Avatar</label>
          <input
            type="file"
            id="avatar"
            name="avatar"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="coverImage">Cover Image</label>
          <input
            type="file"
            id="coverImage"
            name="coverImage"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "20px",
          }}
        >
          <button
            type="submit"
            style={{
              backgroundColor: isLoading ? "#cccccc" : "#4a90e2",
              color: "white",
              padding: "10px 15px",
              border: "none",
              borderRadius: "4px",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontWeight: "bold",
              flex: 1,
              margin: "0 5px 0 0",
            }}
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Update Profile"}
          </button>
          <button
            type="button"
            style={{
              backgroundColor: isGoogleUser ? "#dddddd" : "#ffdddd",
              color: isGoogleUser ? "#999999" : "black",
              padding: "10px 15px",
              border: "none",
              borderRadius: "4px",
              cursor: isGoogleUser ? "not-allowed" : "pointer",
              fontWeight: "bold",
              flex: 1,
              margin: "0 5px",
            }}
            onClick={handleChangePassword}
            disabled={isGoogleUser}
          >
            Change Password
          </button>
          <button
            type="button"
            style={{
              backgroundColor: "#4caf50",
              color: "white",
              padding: "10px 15px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              flex: 1,
              margin: "0 0 0 5px",
            }}
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </button>
        </div>
      </form>

      {showPasswordPopup && (
        <>
          <div
            className="overlay"
            onClick={() => setShowPasswordPopup(false)}
          ></div>
          <div className="password-popup">
            <h3>Change Password</h3>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label htmlFor="oldPassword">Current Password</label>
                <input
                  type="password"
                  id="oldPassword"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="button" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Password"}
              </button>
              <button
                type="button"
                className="button"
                onClick={() => setShowPasswordPopup(false)}
              >
                Cancel
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default EditProfile;