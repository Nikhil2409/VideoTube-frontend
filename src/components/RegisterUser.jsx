import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles.css"; // Import styles

const RegisterUser = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
  });

  const [files, setFiles] = useState({
    avatar: null,
    coverImage: null,
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const { name } = e.target;

    if (!file) return;

    // Store the file
    setFiles((prev) => ({
      ...prev,
      [name]: file,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    // Ensure required fields are filled
    if (!formData.fullName || !formData.email || !formData.username || !formData.password || !files.avatar) {
      setError("All fields including profile picture are required.");
      return;
    }

    try {
      const formDataToSend = new FormData();

      // Append text fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      // Append files
      formDataToSend.append("avatar", files.avatar);
      if (files.coverImage) {
        formDataToSend.append("coverImage", files.coverImage);
      }

      const response = await axios.post(
        "http://localhost:3900/api/v1/users/register",
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setMessage(response.data.message);

      // Revoke old URLs to free memory
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      if (coverPreview) URL.revokeObjectURL(coverPreview);

      // Redirect to login page after successful registration
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <div className="register-container">
      <h2>Register User</h2>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        {/* Image Preview Section */}
        <div className="image-preview-section">
          {coverPreview && (
            <div className="cover-preview-container">
              <img src={coverPreview} alt="Cover Preview" className="cover-preview" />
            </div>
          )}

          {avatarPreview && (
            <div className="avatar-preview-container">
              <img src={avatarPreview} alt="Avatar Preview" className="avatar-preview" />
            </div>
          )}
        </div>

        {/* File Inputs */}
        <div className="file-inputs">
          <div className="file-input-group">
            <label htmlFor="avatar">Profile Picture *</label>
            <input type="file" id="avatar" name="avatar" accept="image/*" onChange={handleFileChange} required />
          </div>

          <div className="file-input-group">
            <label htmlFor="coverImage">Cover Image (Optional)</label>
            <input type="file" id="coverImage" name="coverImage" accept="image/*" onChange={handleFileChange} />
          </div>
        </div>

        {/* User Info Inputs */}
        <input type="text" name="fullName" placeholder="Full Name" onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="text" name="username" placeholder="Username" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} required />

        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default RegisterUser;
