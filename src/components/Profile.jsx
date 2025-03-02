import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";

const Profile = () => {
  const navigate = useNavigate();
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
      videosWatched: 0,
      accountAge: "",
      lastActive: ""
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const api = axios.create({
    baseURL: 'http://localhost:3900',
    withCredentials: true
  });

  // Function to generate dummy watch history
  const getDummyWatchHistory = () => {
    return [
      {
        id: '1',
        title: 'Introduction to React Hooks',
        thumbnail: 'https://via.placeholder.com/150x100?text=React+Hooks',
        watchedAt: new Date(2025, 2, 1, 14, 30).toISOString()
      },
      {
        id: '2',
        title: 'Building a REST API with Node.js',
        thumbnail: 'https://via.placeholder.com/150x100?text=Node.js+API',
        watchedAt: new Date(2025, 2, 1, 16, 45).toISOString()
      },
      {
        id: '3',
        title: 'CSS Grid Layout Tutorial',
        thumbnail: 'https://via.placeholder.com/150x100?text=CSS+Grid',
        watchedAt: new Date(2025, 2, 2, 9, 15).toISOString()
      },
      {
        id: '4',
        title: 'JavaScript ES6+ Features',
        thumbnail: 'https://via.placeholder.com/150x100?text=ES6+Features',
        watchedAt: new Date(2025, 2, 2, 11, 0).toISOString()
      }
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
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log(response);
        setUser(prevUser => ({
          ...prevUser,
          ...response.data.data,
          stats: {
            ...prevUser.stats,
            ...response.data.data.stats
          }
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
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

  const watchHistory = user.stats?.videosWatched > 0 ? user.watchHistory : getDummyWatchHistory();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Cover Image */}
      <div 
        className="h-64 w-full bg-cover bg-center"
        style={{ backgroundImage: `url(${user.coverImage || 'https://via.placeholder.com/1200x400?text=Cover+Image'})` }}
      >
        <div className="w-full h-full bg-black bg-opacity-30 flex items-end">
          <div className="container mx-auto px-4 pb-6">
            <div className="relative">
              <img 
                src={user.avatar || 'https://via.placeholder.com/128?text=Avatar'} 
                alt={`${user.fullName}'s profile`} 
                className="w-32 h-32 rounded-full border-4 border-white object-cover absolute -bottom-16"
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
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold">{user.fullName}</h1>
                  <p className="text-gray-600">@{user.username}</p>
                  <p className="text-gray-700 mt-2">{user.email}</p>
                  <p className="text-gray-700 mt-2">{user.bio || "No bio yet"}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
                    onClick={() => navigate("/edit-profile")}
                  >
                    Edit Profile
                  </button>
                  <button 
                    className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 transition-colors"
                    onClick={() => navigate("/dashboard")}
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>

            {/* Watch History */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              {watchHistory?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {watchHistory.map((video) => (
                    <div key={video.id} className="flex gap-3 items-center">
                      <div 
                        className="w-24 h-16 rounded bg-cover bg-center"
                        style={{ backgroundImage: `url(${video.thumbnail || 'https://via.placeholder.com/150x100'})` }}
                      ></div>
                      <div>
                        <h3 className="font-medium">{video.title}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(video.watchedAt).toLocaleDateString()} at {new Date(video.watchedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No watch history available yet.</p>
              )}
              <button 
                className="mt-4 text-blue-600 hover:underline"
                onClick={() => navigate("/watch-history")}
              >
                View all history
              </button>
            </div>
          </div>

          {/* Right Column - Stats and Additional Info */}
          <div className="w-full lg:w-4/12 space-y-6">
            {/* Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Account Statistics</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Videos Watched</span>
                  <span className="font-medium">{user.stats?.videosWatched || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Age</span>
                  <span className="font-medium">{user.stats?.accountAge || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Active</span>
                  <span className="font-medium">{user.stats?.lastActive || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="space-y-3">
                <button 
                  className="w-full px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 transition-colors"
                  onClick={() => navigate("/dashboard")}
                >
                  Go to Dashboard
                </button>
                <button 
                  className="w-full px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  onClick={() => {
                    Cookies.remove("accessToken");
                    navigate("/login");
                  }}
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
