import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { useAuth } from "../../context/AuthContext.jsx";
import { LogOut, Pencil, LayoutDashboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog.jsx";
import { Button } from "../ui/button.jsx";

const Profile = () => {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [user, setUser] = useState({
    username: "",
    email: "",
    fullName: "",
    bio: "",
    avatar: "",
    coverImage: "",
    watchHistory: [],
    createdAt: "",
    stats: {
      totalLikes: "",
      totalViews: "",
      totalVideos: "",
      totalSubscribers: "",
    },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const api = axios.create({
    baseURL: "http://localhost:3900",
    withCredentials: true,
  });

  // Function to generate dummy watch history
  const getDummyWatchHistory = () => {
    return [
      {
        id: "1",
        title: "Introduction to React Hooks",
        thumbnail: "https://via.placeholder.com/150x100?text=React+Hooks",
        watchedAt: new Date(2025, 2, 1, 14, 30).toISOString(),
      },
      {
        id: "2",
        title: "Building a REST API with Node.js",
        thumbnail: "https://via.placeholder.com/150x100?text=Node.js+API",
        watchedAt: new Date(2025, 2, 1, 16, 45).toISOString(),
      },
      {
        id: "3",
        title: "CSS Grid Layout Tutorial",
        thumbnail: "https://via.placeholder.com/150x100?text=CSS+Grid",
        watchedAt: new Date(2025, 2, 2, 9, 15).toISOString(),
      },
      {
        id: "4",
        title: "JavaScript ES6+ Features",
        thumbnail: "https://via.placeholder.com/150x100?text=ES6+Features",
        watchedAt: new Date(2025, 2, 2, 11, 0).toISOString(),
      },
    ];
  };

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        const token = Cookies.get("accessToken");
        const response = await api.get("/api/v1/users/current-user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const stats = await api.get("/api/v1/dashboard/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log(response);
        setUser((prevUser) => ({
          ...prevUser,
          ...response.data.data,
          stats: stats.data,
        }));
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load profile data. Please try again later.");

        if (err.response && err.response.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 flex justify-center items-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-red-500 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-xl font-bold mt-4">{error}</h2>
          <button
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const watchHistory =
    user.watchHistory?.length > 0 ? user.watchHistory : getDummyWatchHistory();

  const handleLogout = async () => {
    try {
      const token = Cookies.get("accessToken");
      await api.post(
        "/api/v1/users/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );
      logout();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Function to determine text size class based on content length
  const getTextSizeClass = (text, type) => {
    if (!text) return "text-lg";

    const length = text.length;

    if (type === "fullName") {
      if (length > 25) return "text-xs";
      if (length > 20) return "text-sm";
      if (length > 15) return "text-base";
      return "text-xl";
    }

    if (type === "username" || type === "email") {
      if (length > 25) return "text-xs";
      if (length > 20) return "text-sm";
      if (length > 15) return "text-base";
      return "text-lg";
    }

    if (type === "bio") {
      if (length > 200) return "text-xs";
      if (length > 150) return "text-sm";
      if (length > 100) return "text-base";
      return "text-lg";
    }

    return "text-base";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100">
      {/* Cover Image */}
      <div
        className="h-72 w-full bg-cover bg-center"
        style={{
          backgroundImage: `url(${
            user.coverImage ||
            "https://via.placeholder.com/1200x400?text=Cover+Image"
          })`,
        }}
      >
        <div className="w-full h-full bg-black bg-opacity-30 flex items-end">
          <div className="container mx-auto px-4 pb-6">
            <div className="relative">
              <img
                src={
                  user.avatar || "https://via.placeholder.com/128?text=Avatar"
                }
                alt={`${user.fullName}'s profile`}
                className="w-40 h-40 rounded-full border-4 border-white object-cover absolute -bottom-16 shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="container mx-auto px-4 pt-20 pb-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - User Info */}
          <div className="w-full lg:w-8/12 space-y-6">
            {/* User Header */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-100">
              <div className="flex justify-between items-start">
                <div className="w-full">
                  <div className="max-w-full mx-auto p-6 bg-white shadow-md rounded-xl border border-blue-100">
                    {/* Name, Username, Email - Responsive containers */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Full Name */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg text-center flex items-center justify-center h-full overflow-hidden shadow-sm">
                        <h1
                          className={`font-semibold text-gray-900 break-words line-clamp-2 ${getTextSizeClass(
                            user.fullName,
                            "fullName"
                          )}`}
                        >
                          {user.fullName || "No Name"}
                        </h1>
                      </div>

                      {/* Username */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg text-center flex items-center justify-center h-full overflow-hidden shadow-sm">
                        <p
                          className={`text-gray-600 break-words line-clamp-2 ${getTextSizeClass(
                            user.username,
                            "username"
                          )}`}
                        >
                          @{user.username || "username"}
                        </p>
                      </div>

                      {/* Email */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg text-center flex items-center justify-center h-full overflow-hidden shadow-sm">
                        <p
                          className={`text-gray-700 break-words line-clamp-2 ${getTextSizeClass(
                            user.email,
                            "email"
                          )}`}
                        >
                          {user.email || "email@example.com"}
                        </p>
                      </div>
                    </div>

                    {/* Bio Section - Adaptive container */}
                    <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-yellow-100 to-amber-100 overflow-hidden shadow-sm">
                      <p
                        className={`text-gray-800 ${getTextSizeClass(
                          user.bio,
                          "bio"
                        )} break-words`}
                      >
                        📜 {user.bio || "No bio yet"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Watch History */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-100">
              <h2 className="text-xl font-semibold mb-4 text-blue-800">
                Recent Activity
              </h2>
              {watchHistory?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {watchHistory.map((video) => (
                    <div
                      key={video.id}
                      className="flex gap-3 items-center bg-gradient-to-r from-gray-50 to-blue-50 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div
                        className="w-24 h-16 rounded-md bg-cover bg-center flex-shrink-0 shadow-sm"
                        style={{
                          backgroundImage: `url(${
                            video.thumbnail ||
                            "https://via.placeholder.com/150x100"
                          })`,
                        }}
                      ></div>
                      <div className="overflow-hidden">
                        <h3 className="font-medium text-sm sm:text-base truncate text-gray-800">
                          {video.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                          {new Date(video.watchedAt).toLocaleDateString()} at{" "}
                          {new Date(video.watchedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No watch history available yet.</p>
              )}
              <button
                className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors shadow-sm hover:shadow flex items-center justify-center mx-auto"
                onClick={() => navigate("/watch-history")}
              >
                View all history
              </button>
            </div>
          </div>

          {/* Right Column - Stats and Additional Info */}
          <div className="w-full lg:w-4/12 space-y-6">
            {/* Navigation Buttons */}
            <div className="bg-white rounded-lg shadow-lg p-4 border border-blue-100">
              <div className="space-y-4">
                <button
                  className="w-full px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors shadow-sm hover:shadow flex items-center justify-center gap-2"
                  onClick={() => navigate("/edit-profile")}
                >
                  <Pencil className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>

                <button
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-500 transition-colors shadow-sm hover:shadow flex items-center justify-center gap-2"
                  onClick={() => navigate("/dashboard")}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Go to Dashboard</span>
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-100">
              <h2 className="text-xl font-semibold mb-4 text-blue-800">
                Account Statistics
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm">
                  <span className="text-gray-700 font-medium">
                    Total Videos
                  </span>
                  <span className="font-semibold bg-white px-3 py-1 rounded-lg text-center min-w-16 shadow-sm text-blue-700">
                    {user.stats?.totalVideos || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm">
                  <span className="text-gray-700 font-medium">
                    Total Subscribers
                  </span>
                  <span className="font-semibold bg-white px-3 py-1 rounded-lg text-center min-w-16 shadow-sm text-blue-700">
                    {user.stats?.totalSubscribers || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm">
                  <span className="text-gray-700 font-medium">Total Likes</span>
                  <span className="font-semibold bg-white px-3 py-1 rounded-lg text-center min-w-16 shadow-sm text-blue-700">
                    {user.stats?.totalLikes || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm">
                  <span className="text-gray-700 font-medium">Total Views</span>
                  <span className="font-semibold bg-white px-3 py-1 rounded-lg text-center min-w-16 shadow-sm text-blue-700">
                    {user.stats?.totalViews || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <div className="bg-white rounded-lg shadow-lg  border border-blue-100">
              <div className="space-y-3">
                <button
                  className="flex items-center justify-center gap-2 p-3 text-red-600 font-bold rounded-lg 
                  bg-red-50 hover:bg-red-100 w-full shadow-sm hover:shadow transition-all"
                  onClick={() => setShowLogoutDialog(true)}
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-center">Logout</span>
                </button>
              </div>
              <Dialog
                open={showLogoutDialog}
                onOpenChange={setShowLogoutDialog}
              >
                <DialogContent className="sm:max-w-md">
                  <DialogTitle className="text-xl font-semibold mb-4">
                    Are you sure you want to log out?
                  </DialogTitle>
                  <DialogFooter className="mt-4 flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowLogoutDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleLogout}>
                      Logout
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
