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
  _id: "vid123",
  title: "Building a YouTube Clone with React and Node.js",
  description: "In this tutorial, we build a complete YouTube clone using React for the frontend and Node.js for the backend. Learn how to implement video uploads, streaming, authentication, and more!",
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
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    subscribersCount: 5420,
    isSubscribed: false
  }
};

function VideoPlayer() {
  const { videotitle } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [video, setVideo] = useState(null);
  const [subscribers, setSubscribers] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const viewCountUpdated = useRef(false);
  
  // Function to fetch video details - extracted for reuse
  const fetchVideoDetails = async () => {
    if (!videotitle) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const accessToken = user?.accessToken;
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      
      const response = await api.get(`/api/v1/videos/${videotitle}`, {
          headers
        });
      
      const res = await api.get(`/api/v1/subscriptions/u/${response.data.data.owner.username}`, {
          headers
        });
      const subscribersCount = res.data.data.subscribers.length;
      console.log(res);
      const videoData = response.data.data;
      console.log(videoData);
      setVideo(videoData);
      setSubscribers(subscribersCount);
      setIsLiked(videoData.isLiked || false);
      setLikeCount(videoData.likes?.length || 0);
      setIsSubscribed(videoData.owner?.isSubscribed || false);
    } catch (error) {
      console.error("Error fetching video:", error);
      // Use dummy data if API fails
      setSubscribers(0);
      setVideo(DUMMY_VIDEO);
      setIsLiked(false);
      setLikeCount(DUMMY_VIDEO.likes.length);
      setIsSubscribed(DUMMY_VIDEO.owner.isSubscribed);
      setError("Failed to fetch video data. Using placeholder content.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Separate effect for video fetch - high priority
  useEffect(() => {
    fetchVideoDetails();
  }, [videotitle, user]);
  
  // Separate effect for view count - lower priority
  useEffect(() => {
    const updateViewCount = async () => {
      if (!videotitle || !video || viewCountUpdated.current) return;
      
      try {
        const accessToken = user?.accessToken;
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        
        await api.patch(`/api/v1/videos/incrementViews/${videotitle}`, {}, { headers });
        viewCountUpdated.current = true;
      } catch (error) {
        console.error("Error updating view count:", error);
        // Failing to update view count is non-critical, so we don't show an error
      }
    };
    
    updateViewCount();
  }, [videotitle, video, user]);
  
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
      // FIX: The headers should be in config object, not in data object
      await api.post(`/api/v1/likes/toggle/v/${videotitle}`, user, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      // Refresh video data after like toggle
      await fetchVideoDetails();
      
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
    
    if (!video?.owner?._id || isSubscribing) return;
    
    setIsSubscribing(true);
    
    // Optimistic UI update
    setIsSubscribed(!isSubscribed);
    
    try {
      const accessToken = user.accessToken;
      await api.post(`/api/v1/subscriptions/c/${video.owner._id}`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      // Refresh video data after subscription toggle
      await fetchVideoDetails();
      
    } catch (error) {
      console.error("Error toggling subscription:", error);
      // Revert optimistic update on error
      setIsSubscribed(!isSubscribed);
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
                <span>{video.duration}</span>
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
                <span>{video.comments?.length || 0}</span>
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
                {video.owner?.avatar ? (
                  <img
                    src={video.owner.avatar}
                    alt={video.owner.fullName}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <User className="h-full w-full p-2 text-gray-500" />
                )}
              </div>
              <div>
                <h3 className="font-medium">{video.owner?.fullName || "Channel Name"}</h3>
                <p className="text-sm text-gray-500">
                  {subscribers || 0} subscribers
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
              Comments ({video.comments?.length || 0})
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