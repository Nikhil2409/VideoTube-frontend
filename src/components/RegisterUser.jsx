import { useState } from "react";
import axios from "axios";
import "../styles.css"; // Import styles

const RegisterUser = () => {
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
    const { name, files } = e.target;
    if (files && files[0]) {
      setFiles((prev) => ({
        ...prev,
        [name]: files[0],
      }));

      // Create a preview URL
      const previewUrl = URL.createObjectURL(files[0]);
      if (name === "avatar") {
        setAvatarPreview(previewUrl);
      } else if (name === "coverImage") {
        setCoverPreview(previewUrl);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (
      !formData.fullName ||
      !formData.email ||
      !formData.username ||
      !formData.password
    ) {
      setError("All fields are required.");
      return;
    }

    try {
      // Create a FormData object to handle file uploads
      const formDataToSend = new FormData();

      // Add text fields
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });

      // Add files if they exist
      if (files.avatar) {
        formDataToSend.append("avatar", files.avatar);
      }

      if (files.coverImage) {
        formDataToSend.append("coverImage", files.coverImage);
      }

      const response = await axios.post(
        "http://localhost:3900/api/v1/users/register",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setMessage(response.data.message);

      // Clean up preview URLs to prevent memory leaks
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    } catch (error) {
      setError(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="register-container">
      <h2>Register User</h2>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="image-preview-section">
          {coverPreview && (
            <div className="cover-preview-container">
              <img
                src={coverPreview}
                alt="Cover Preview"
                className="cover-preview"
              />
            </div>
          )}

          {avatarPreview && (
            <div className="avatar-preview-container">
              <img
                src={avatarPreview}
                alt="Avatar Preview"
                className="avatar-preview"
              />
            </div>
          )}
        </div>

        <div className="file-inputs">
          <div className="file-input-group">
            <label htmlFor="avatar">Profile Picture</label>
            <input
              type="file"
              id="avatar"
              name="avatar"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div className="file-input-group">
            <label htmlFor="coverImage">Cover Image</label>
            <input
              type="file"
              id="coverImage"
              name="coverImage"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="username"
          placeholder="Username"
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          required
        />
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default RegisterUser;
