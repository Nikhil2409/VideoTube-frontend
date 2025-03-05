import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Navbar } from "./Navbar.jsx";
import { Sidebar } from "./Sidebar.jsx";
import { Card, CardContent } from "./ui/card";
import { 
  Eye, 
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
  const [userCache, setUserCache] = useState({});

  // Dummy data for testing when API calls fail
  const DUMMY_VIDEOS = [
    {
      _id: "vid123",
      id: "vid123",
      title: "Building a YouTube Clone with React and Node.js",
      description: "In this tutorial, we build a complete YouTube clone using React for the frontend and Node.js for the backend.",
      videoFile: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
      thumbnail: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0",
      views: 1248,
      duration: 754,
      createdAt: "2024-02-15T12:00:00Z",
      owner: "user123"
    },
    {
      _id: "vid124",
      id: "vid124",
      title: "Advanced CSS Techniques for Modern Web Design",
      description: "Learn advanced CSS techniques to create stunning web designs.",
      videoFile: "https://sample-videos.com/video124/mp4/720/sample.mp4",
      thumbnail: "https://images.unsplash.com/photo-1587440871875-191322ee64b0",
      views: 982,
      duration: 921,
      createdAt: "2024-02-10T14:30:00Z",
      owner: "user124"
    }
  ];

  // Get user data for a video
  const getUserForVideo = async (video) => {
    if (!video) return null;
    
    // If we already have user data embedded in the video
    if (video.user && typeof video.user === 'object') {
      setUserCache(prev => ({
        ...prev,
        [video.user.id]: video.user
      }));
      return video.user;
    }
    
    const ownerId = video.owner;
    if (!ownerId) return null;
    
    // Check if already in cache
    if (userCache[ownerId]) {
      return userCache[ownerId];
    }
    
    // Check if valid MongoDB ID
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(ownerId);
    if (!isValidObjectId) return null;
    
    try {
      const response = await api.get(`/api/v1/users/${ownerId}`);
      const userData = response.data.data;
      
      setUserCache(prev => ({
        ...prev,
        [ownerId]: userData
      }));
      
      return userData;
    } catch (error) {
      console.error(`Error fetching user for ID ${ownerId}:`, error);
      return null;
    }
  };

  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      setError("");
      
      try {
        const accessToken = user?.accessToken;
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        
        const response = await api.get("/api/v1/videos", { headers });
        const videosData = response.data.data;
        
        if (Array.isArray(videosData) && videosData.length > 0) {
          // Ensure each video has both _id and id
          const processedVideos = videosData.map(video => ({
            ...video,
            id: video._id || video.id
          }));
          
          setVideos(processedVideos);
          
          // Cache user data if included
          processedVideos.forEach(video => {
            if (video.user && video.user.id) {
              setUserCache(prev => ({
                ...prev,
                [video.user.id]: video.user
              }));
            }
          });
        } else {
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
    
    if (user) {
      fetchVideos();
    }
  }, [user]);

  // Fetch missing user data when videos load
  useEffect(() => {
    const fetchMissingUsers = async () => {
      const promises = videos.map(async (video) => {
        const ownerId = video.owner;
        
        // Only fetch if we have an owner ID but no cached user data
        if (ownerId && !userCache[ownerId] && !video.user) {
          await getUserForVideo(video);
        }
      });
      
      // Wait for all user fetches to complete
      await Promise.all(promises);
    };
    
    if (videos.length > 0) {
      fetchMissingUsers();
    }
  }, [videos]);

  // Format seconds into MM:SS
  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return "--:--";
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleVideoClick = (videoId) => {
    navigate(`/video/${videoId}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex flex-col min-h-screen bg-gray-100 w-full">
        <Navbar user={user} />
        
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <h1 className="text-3xl font-bold mb-6">Explore Videos</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => {
              const videoId = video.id || video._id;
              const ownerId = video.owner;
              const videoUser = video.user || (ownerId ? userCache[ownerId] : null);
              
              return (
                <div 
                  key={videoId} 
                  onClick={() => handleVideoClick(videoId)}
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
                      {video.duration !== undefined && (
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                          {formatDuration(video.duration)}
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-4 flex-grow flex flex-col">
                      <h2 className="font-bold text-lg mb-2 line-clamp-2">
                        {video.title}
                      </h2>
                      
                      <div className="flex items-center mb-2">
                        <div className="h-8 w-8 rounded-full bg-gray-300 overflow-hidden mr-2">
                          {videoUser?.avatar ? (
                            <img
                              src={videoUser.avatar}
                              alt={videoUser.fullName || "Creator"}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <User className="h-full w-full p-1 text-gray-500" />
                          )}
                        </div>
                        <span className="text-sm text-gray-700">
                          {videoUser?.username || "Unknown Creator"}
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
              );
            })}
          </div>
          
          {videos.length === 0 && !error && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-xl">No videos available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoList;