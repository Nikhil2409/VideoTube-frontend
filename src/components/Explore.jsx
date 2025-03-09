import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Navbar } from "./Navbar.jsx";
import { Sidebar } from "./Sidebar.jsx";
import { Card, CardContent } from "./ui/card";
import { 
  Eye, 
  User,
  Calendar,
  Video,
  MessageSquare
} from "lucide-react";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3900",
  withCredentials: true,
});

function ExplorePage() {
  const { user } = useAuth();
  const [contentType, setContentType] = useState("videos"); // "videos" or "tweets"
  const [videos, setVideos] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [userCache, setUserCache] = useState({});
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
    const toggleSidebar = () => {
      setIsSidebarVisible((prev) => !prev);
    };
  
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

  // Dummy tweets data
  const DUMMY_TWEETS = [
    {
      _id: "tweet123",
      id: "tweet123",
      content: "Just launched a new video about React performance optimization. Check it out on my channel!",
      likes: 47,
      comments: 8,
      retweets: 12,
      createdAt: "2024-02-16T15:30:00Z",
      owner: "user123"
    },
    {
      _id: "tweet124",
      id: "tweet124",
      content: "What's your favorite JavaScript framework in 2024? Reply with your choice and why!",
      likes: 32,
      comments: 24,
      retweets: 5,
      createdAt: "2024-02-14T09:15:00Z",
      owner: "user124"
    },
    {
      _id: "tweet125",
      id: "tweet125",
      content: "Working on a new tutorial series about building a full-stack social media platform. What features would you like to see covered?",
      likes: 56,
      comments: 18,
      retweets: 9,
      createdAt: "2024-02-13T11:45:00Z",
      owner: "user123"
    }
  ];

  // Get user data for a content item
  const getUserForContent = async (item) => {
    if (!item) return null;
    
    // If we already have user data embedded in the item
    if (item.user && typeof item.user === 'object') {
      setUserCache(prev => ({
        ...prev,
        [item.user.id]: item.user
      }));
      return item.user;
    }
    
    const ownerId = item.owner;
    if (!ownerId) return null;
    
    // Check if already in cache
    if (userCache[ownerId]) {
      return userCache[ownerId];
    }
    
    // Check if valid MongoDB ID
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(ownerId);
    if (!isValidObjectId) return null;
    
    try {
      const response = await api.get(`/api/v1/users/getUser/${ownerId}`);
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
    const fetchContent = async () => {
      setIsLoading(true);
      setError("");
      
      try {
        const accessToken = user?.accessToken;
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        
        // Fetch videos
        if (contentType === "videos") {
          const response = await api.get("/api/v1/videos", { headers });
          console.log(response);
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
        } 
        // Fetch tweets
        else if (contentType === "tweets") {
          try {
            const response = await api.get(`/api/v1/tweets/`, { headers });
            console.log(response);
            const tweetsData = response.data.data;
          
              // Create a new array of tweets with comment counts
              const tweetsWithComments = await Promise.all(
                tweetsData.map(async (tweet) => {
                  const commentsResponse = await api.get(`/api/v1/comments/tweet/${tweet.id}`);
                  console.log(commentsResponse);
                  const comments = commentsResponse.data.data.comments;
                  
                  // Return the tweet with an added commentCount property
                  return {
                    ...tweet,
                    comments: comments.length
                  };
                })
              );
            
            if (Array.isArray(tweetsWithComments) && tweetsWithComments.length > 0) {
              const processedTweets = tweetsWithComments.map(tweet => ({
                ...tweet,
                id: tweet._id || tweet.id
              }));
              
              setTweets(processedTweets);
            } else {
              setTweets(DUMMY_TWEETS);
              setError("No tweets found or invalid response. Showing sample tweets.");
            }
          } catch (error) {
            console.error("Error fetching tweets:", error);
            setTweets(DUMMY_TWEETS);
            setError("Failed to fetch tweets. Showing sample content.");
          }
        }
      } catch (error) {
        console.error(`Error fetching ${contentType}:`, error);
        if (contentType === "videos") {
          setVideos(DUMMY_VIDEOS);
        } else {
          setTweets(DUMMY_TWEETS);
        }
        setError(`Failed to fetch ${contentType}. Showing sample content.`);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchContent();
    }
  }, [user, contentType]);

  // Fetch missing user data when content loads
  useEffect(() => {
    const fetchMissingUsers = async () => {
      const contentItems = contentType === "videos" ? videos : tweets;
      
      const promises = contentItems.map(async (item) => {
        const ownerId = item.owner;
        
        // Only fetch if we have an owner ID but no cached user data
        if (ownerId && !userCache[ownerId] && !item.user) {
          await getUserForContent(item);
        }
      });
      
      // Wait for all user fetches to complete
      await Promise.all(promises);
    };
    
    const contentItems = contentType === "videos" ? videos : tweets;
    if (contentItems.length > 0) {
      fetchMissingUsers();
    }
  }, [videos, tweets, contentType]);

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

  const handleTweetClick = (tweetId) => {
    navigate(`/tweet/${tweetId}`);
  };

  const toggleContentType = (type) => {
    setContentType(type);
    setIsLoading(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
   <div className="flex h-screen w-full bg-gradient-to-br from-gray-50 to-blue-50">
      <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} />
      <div 
        className={`flex flex-col flex-1 overflow-auto transition-all duration-300 ${
          isSidebarVisible ? 'ml-64' : 'ml-0'
        }`}
      >
        <Navbar
          toggleSidebar={toggleSidebar}
        />
        
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Explore</h1>
            
            {/* Toggle between videos and tweets */}
            <div className="flex items-center bg-white rounded-full shadow mt-4 md:mt-0 p-1">
              <button
                onClick={() => toggleContentType("videos")}
                className={`flex items-center px-4 py-2 rounded-full ${
                  contentType === "videos" 
                    ? "bg-blue-500 text-white" 
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Video className="mr-2 h-4 w-4" />
                Videos
              </button>
              <button
                onClick={() => toggleContentType("tweets")}
                className={`flex items-center px-4 py-2 rounded-full ${
                  contentType === "tweets" 
                    ? "bg-blue-500 text-white" 
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Tweets
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          {contentType === "videos" && (
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
              
              {videos.length === 0 && !error && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <p className="text-xl">No videos available</p>
                </div>
              )}
            </div>
          )}
          
          {contentType === "tweets" && (
            <div className="grid grid-cols-1 gap-4">
              {tweets.map((tweet) => {
                const tweetId = tweet.id || tweet._id;
                const ownerId = tweet.owner;
                const tweetUser = tweet.user || (ownerId ? userCache[ownerId] : null);
                
                return (
                  <div 
                    key={tweetId} 
                    onClick={() => handleTweetClick(tweetId)}
                    className="cursor-pointer"
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center mb-3">
                          <div className="h-10 w-10 rounded-full bg-gray-300 overflow-hidden mr-3">
                            {tweetUser?.avatar ? (
                              <img
                                src={tweetUser.avatar}
                                alt={tweetUser.fullName || "Creator"}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <User className="h-full w-full p-1 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {tweetUser?.username || "Unknown User"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(tweet.createdAt)}
                            </p>
                          </div>
                        </div>
                        
                        <p className="text-gray-800 mb-4">{tweet.content}</p>
                        
                        <div className="flex space-x-6 text-sm text-gray-500">
                          <div className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          <span>{tweet.views || 0}</span>
                          </div>
                          <div className="flex items-center">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            <span>{tweet.comments || 0}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
              
              {tweets.length === 0 && !error && (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-xl">No tweets available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExplorePage;