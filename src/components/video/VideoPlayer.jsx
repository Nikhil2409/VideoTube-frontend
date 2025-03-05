import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx"
import { Navbar } from "../Navbar.jsx";
import { Button } from "../ui/button.jsx";
import { Card, CardContent } from "../ui/card";
import { 
  ThumbsUp, 
  MessageSquare, 
  Share2, 
  ChevronLeft, 
  User,
  Clock,
  Eye,
  Calendar
} from "lucide-react";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3900",
  withCredentials: true,
});

// Dummy data for testing when API calls fail
const DUMMY_VIDEO = {
  id: "vid123",
  title: "Building a YouTube Clone with React and Node.js",
  description: "In this tutorial, we build a complete YouTube clone using React for the frontend and Node.js for the backend. Learn how to implement video uploads, streaming, authentication, and more!",
  videoFile: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
  thumbnail: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0",
  views: 1248,
  duration: 754, // In seconds as per schema
  createdAt: "2024-02-15T12:00:00Z",
  owner: "user123"
};

function VideoPlayer() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [video, setVideo] = useState(null);
  const [owner, setOwner] = useState(null);
  const [subscribers, setSubscribers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const viewCountUpdated = useRef(false);
  
  // Format seconds into MM:SS
  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return "--:--";
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const addToWatchHistory = async () => {
    if(!videoId) return;
    
    try{
      const accessToken = user?.accessToken;
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

      const response = await api.post(`/api/v1/users/addToWatchHistory/${videoId}`, { headers }); 
      console.log(response);
    }catch(error){
      console.error("Error fetching video:", error);
    }
  } 

  // Function to fetch video details
  const fetchVideoDetails = async () => {
    if (!videoId) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const accessToken = user?.accessToken;
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      
      // Single API call to get video data
      const response = await api.get(`/api/v1/videos/${videoId}`, { headers });
      
      // Extract video data from the response
      const videoData = response.data.data;
      
      // Set video data
      setVideo(videoData);
      
      // Extract owner data directly from the response
      if (videoData.owner) {
        setOwner(videoData.owner);
        
        // Extract subscribers count directly from owner object
        setSubscribers(videoData.owner.subscribersCount || 0);
        
        // Check if current user is subscribed from isSubscribed property
        setIsSubscribed(videoData.owner.isSubscribed || false);
      }
      
      // Extract likes count directly from video data
      setLikeCount(videoData.likesCount || 0);
      
      // Check if current user has liked the video
      setIsLiked(videoData.isLiked || false);
      
      // Extract comments count from comments array
      setCommentCount(videoData.comments ? videoData.comments.length : 0);
      
      addToWatchHistory();
    } catch (error) {
      console.error("Error fetching video:", error);
      // Use dummy data if API fails
      setVideo(DUMMY_VIDEO);
      setOwner(null);
      setSubscribers(0);
      setIsLiked(false);
      setLikeCount(0);
      setCommentCount(0);
      setError("Failed to fetch video data. Using placeholder content.");
    } finally {
      setIsLoading(false);
    }
  };
  
  
  // Separate effect for video fetch - high priority
  useEffect(() => {
    fetchVideoDetails();
  }, [videoId, user]);
  
  // Separate effect for view count - lower priority
  useEffect(() => {
    const updateViewCount = async () => {
      if (!videoId || !video || viewCountUpdated.current) return;
      
      try {
        const accessToken = user?.accessToken;
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        
        await api.patch(`/api/v1/videos/incrementViews/${videoId}`, {}, { headers });
        viewCountUpdated.current = true;
      } catch (error) {
        console.error("Error updating view count:", error);
        // Failing to update view count is non-critical, so we don't show an error
      }
    };
    
    updateViewCount();
  }, [videoId, video, user]);
  
  const handleLikeToggle = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    // Optimistic UI update
    setIsLiked(!isLiked);
    setLikeCount(prevCount => isLiked ? prevCount - 1 : prevCount + 1);
    
    try {
      const accessToken = user.accessToken;
      await api.post(`/api/v1/likes/toggle/v/${videoId}`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      // No need to refetch everything, we've already updated the UI
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert optimistic update on error
      setIsLiked(!isLiked);
      setLikeCount(prevCount => !isLiked ? prevCount - 1 : prevCount + 1);
      setError("Failed to update like status");
    }
  };
  
  const handleSubscribe = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    if (!video?.owner || isSubscribing) return;
    
    setIsSubscribing(true);
    
    // Optimistic UI update
    setIsSubscribed(!isSubscribed);
    setSubscribers(prev => isSubscribed ? prev - 1 : prev + 1);
    
    try {
      const accessToken = user.accessToken;
      await api.post(`/api/v1/subscriptions/c/${video.owner.id}`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      // No need to refetch everything, we've already updated the UI
    } catch (error) {
      console.error("Error toggling subscription:", error);
      // Revert optimistic update on error
      setIsSubscribed(!isSubscribed);
      setSubscribers(prev => !isSubscribed ? prev - 1 : prev + 1);
      setError("Failed to update subscription status");
    } finally {
      setIsSubscribing(false);
    }
  };
  
  const goBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!video) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-red-600">Video not found</h2>
        <Button onClick={goBack} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Back button */}
        <Button 
          variant="ghost" 
          className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
          onClick={goBack}
        >
          <ChevronLeft className="mr-1 h-5 w-5" />
          Back to Dashboard
        </Button>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {/* Video Player */}
        <div className="bg-black rounded-lg overflow-hidden shadow-lg aspect-video mb-4">
          <video
            className="w-full h-full"
            src={video.videoFile}
            poster={video.thumbnail}
            controls
            autoPlay
            preload="auto"
          />
        </div>
        
        {/* Video Info */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
          
          <div className="flex flex-wrap items-center justify-between mb-4">
            <div className="flex items-center text-sm text-gray-600 space-x-4">
              <div className="flex items-center">
                <Eye className="mr-1 h-4 w-4" />
                <span>{video.views?.toLocaleString() || 0} views</span>
              </div>
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                <span>{new Date(video.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                <span>{formatDuration(video.duration)}</span>
              </div>
            </div>
            
            <div className="flex space-x-2 mt-2 md:mt-0">
              <Button
                variant="outline"
                className={`flex items-center gap-1 ${isLiked ? 'text-blue-600' : 'text-gray-600'}`}
                onClick={handleLikeToggle}
              >
                <ThumbsUp className="h-4 w-4" />
                <span>{likeCount}</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center gap-1 text-gray-600"
              >
                <MessageSquare className="h-4 w-4" />
                <span>{commentCount}</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center gap-1 text-gray-600"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
          
          {/* Channel Info & Subscribe */}
          <div className="flex flex-wrap items-center justify-between py-4 border-t border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-gray-300 overflow-hidden mr-3">
                {owner?.avatar ? (
                  <img
                    src={owner.avatar}
                    alt={owner.fullName}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <User className="h-full w-full p-2 text-gray-500" />
                )}
              </div>
              <div>
                <h3 className="font-medium">{owner?.fullName || owner?.username || "Channel Name"}</h3>
                <p className="text-sm text-gray-500">
                  {subscribers} subscribers
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleSubscribe}
              disabled={isSubscribing}
              className={`mt-2 md:mt-0 ${
                isSubscribing ? 'bg-gray-300' : 
                isSubscribed ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 
                'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isSubscribing ? 'Processing...' : isSubscribed ? 'Subscribed' : 'Subscribe'}
            </Button>
          </div>
          
          {/* Video Description */}
          <div className="mt-4">
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-gray-700 whitespace-pre-line">
              {video.description || "No description available."}
            </p>
          </div>
        </div>
        
        {/* Comments Section */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-xl font-bold mb-4">
              Comments ({commentCount})
            </h2>
            
            {/* Comment form could go here */}
            
            {/* Comment list would go here */}
            <div className="text-center py-8 text-gray-500">
              <p>Comments will be displayed here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default VideoPlayer;