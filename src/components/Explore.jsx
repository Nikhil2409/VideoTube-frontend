import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Navbar } from "./Navbar.jsx";
import { Card, CardContent } from "./ui/card";
import { 
  Eye, 
  Clock, 
  User,
  Calendar
} from "lucide-react";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3900",
  withCredentials: true,
});

function VideoList() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [usernames, setUsernames] = useState({});
  const [userCache, setUserCache] = useState({});

  // Fixed fetchUsername function with access to the userCache state
  const fetchUsername = async (ownerId) => {
    // If owner is already a complete object with username, use it directly
    if (typeof ownerId === 'object' && ownerId?.username) {
      return ownerId.username;
    }

    // Extract ID if owner is an object
    const userId = typeof ownerId === 'object' ? ownerId?._id : ownerId;
    
    if (!userId) return "Unknown Creator";

    // Check if valid MongoDB ID
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
    if (!isValidObjectId) return "Unknown Creator";
    
    try {
      // Check if user is already in cache
      if (userCache[userId]) {
        return userCache[userId].username;
      }
      
      // Fetch user data via API
      const response = await api.get(`/api/v1/users/${userId}`);
      
      // Cache the user data
      const newCache = { ...userCache };
      newCache[userId] = response.data;
      setUserCache(newCache);
      
      return response.data.username;
    } catch (error) {
      console.error(`Error fetching username for ID ${userId}:`, error);
      return "Unknown Creator";
    }
  };

  // Add this effect to fetch usernames when videos change
  useEffect(() => {
    const fetchUsernames = async () => {
      const usernamePromises = videos.map(async (video) => {
        const username = await fetchUsername(video.owner);
        return { videoId: video._id, username };
      });
      
      const results = await Promise.all(usernamePromises);
      const newUsernames = {};
      
      results.forEach(({ videoId, username }) => {
        newUsernames[videoId] = username;
      });
      
      setUsernames(newUsernames);
    };
    
    if (videos.length > 0) {
      fetchUsernames();
    }
  }, [videos, userCache]); // Added userCache as a dependency  

  // Dummy data for testing when API calls fail
  const DUMMY_VIDEOS = [
    {
      _id: "vid123",
      title: "Building a YouTube Clone with React and Node.js",
      description: "In this tutorial, we build a complete YouTube clone using React for the frontend and Node.js for the backend.",
      videoFile: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
      thumbnail: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0",
      views: 1248,
      likes: { length: 87 },
      comments: { length: 24 },
      duration: "12:34",
      createdAt: "2024-02-15T12:00:00Z",
      owner: {
        _id: "user123",
        username: "techcreator",
        fullName: "Tech Creator",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg"
      }
    },
    {
      _id: "vid124",
      title: "Advanced CSS Techniques for Modern Web Design",
      description: "Learn advanced CSS techniques to create stunning web designs.",
      videoFile: "https://sample-videos.com/video124/mp4/720/sample.mp4",
      thumbnail: "https://images.unsplash.com/photo-1587440871875-191322ee64b0",
      views: 982,
      likes: { length: 65 },
      comments: { length: 18 },
      duration: "15:21",
      createdAt: "2024-02-10T14:30:00Z",
      owner: {
        _id: "user124",
        username: "designguru",
        fullName: "Design Guru",
        avatar: "https://randomuser.me/api/portraits/women/28.jpg"
      }
    }
  ];

  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      setError("");
      
      try {
        const accessToken = user?.accessToken;
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        
        const response = await api.get("/api/v1/videos", { headers });
        const videosData = response.data.data;
        console.log(videosData);
        
        if (Array.isArray(videosData) && videosData.length > 0) {
          setVideos(videosData);
        } else {
          // If the API returns an empty array or non-array, use dummy data
          setVideos(DUMMY_VIDEOS);
          setError("No videos found or invalid response. Showing sample videos.");
        }
      } catch (error) {
        console.error("Error fetching videos:", error);
        setVideos(DUMMY_VIDEOS);
        setError("Failed to fetch videos. Showing sample content.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVideos();
  }, [user]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleVideoClick = (video) => {
    // Navigate to the VideoPlayer component with the video title as a parameter
    navigate(`/video/${video.title}`); // Changed to use video._id instead of title for a more reliable route parameter
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">Explore Videos</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div 
              key={video._id} 
              onClick={() => handleVideoClick(video)}
              className="cursor-pointer transition-transform hover:scale-105"
            >
              <Card className="overflow-hidden h-full flex flex-col">
                <div className="relative pb-[56.25%] bg-gray-200">
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-300">
                      <span className="text-gray-500">No thumbnail</span>
                    </div>
                  )}
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {video.duration}
                    </div>
                  )}
                </div>
                
                <CardContent className="p-4 flex-grow flex flex-col">
                  <h2 className="font-bold text-lg mb-2 line-clamp-2">
                    {video.title}
                  </h2>
                  
                  <div className="flex items-center mb-2">
                    <div className="h-8 w-8 rounded-full bg-gray-300 overflow-hidden mr-2">
                      {video.owner?.avatar ? (
                        <img
                          src={video.owner.avatar}
                          alt={video.owner.fullName || "Creator"}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <User className="h-full w-full p-1 text-gray-500" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700">
                      {usernames[video._id] || "Loading..."}
                    </span>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="flex flex-wrap items-center text-xs text-gray-500 space-x-3">
                      <div className="flex items-center">
                        <Eye className="mr-1 h-3 w-3" />
                        <span>{video.views?.toLocaleString() || 0} views</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        <span>{formatDate(video.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
        
        {videos.length === 0 && !error && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-xl">No videos available</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VideoList;