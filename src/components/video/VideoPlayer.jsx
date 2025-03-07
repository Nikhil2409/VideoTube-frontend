import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx"
import { Navbar } from "../Navbar.jsx";
import { Button } from "../ui/button.jsx";
import { Card, CardContent } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { 
  ThumbsUp, 
  MessageSquare, 
  Share2, 
  ChevronLeft, 
  User,
  Clock,
  Eye,
  Calendar,
  MoreVertical,
  Edit,
  Trash2
} from "lucide-react";
import axios from "axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

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
  
  // New state for comments
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentContent, setEditedCommentContent] = useState("");
  const [commentsError, setCommentsError] = useState("");
  
  // Format seconds into MM:SS
  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return "--:--";
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Format date to a relative time string
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  const addToWatchHistory = async () => {
    if(!videoId || !user) return;
    
    try{
      const accessToken = user.accessToken;
      
      // Fix: Headers should be passed as a config object, not in the request body
      await api.post(`/api/v1/users/addToWatchHistory/${videoId}`, {}, { 
        headers: { Authorization: `Bearer ${accessToken}` } 
      }); 
    }catch(error){
      console.error("Error adding to watch history:", error);
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
      
      
      if (user) {
        addToWatchHistory();
      }
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
  
// Fixed mapping function for comments from API
const mapComment = (backendComment) => {
  return {
    id: backendComment.id,
    content: backendComment.content || backendComment.text, // Handle both field names
    createdAt: backendComment.createdAt,
    owner: {
      id: backendComment.user?.id || backendComment.owner?.id,
      fullName: backendComment.user?.fullName || backendComment.owner?.fullName,
      username: backendComment.user?.username || backendComment.owner?.username,
      avatar: backendComment.user?.avatar || backendComment.owner?.avatar
    }
  };
};

// Fixed fetchComments function
const fetchComments = async () => {
  if (!videoId) return;
  
  try {
    const accessToken = user?.accessToken;
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    
    // Add pagination parameters
    const page = 1; // Start with first page
    const limit = 50; // Reasonable default limit
    
    const response = await api.get(`/api/v1/comments/${videoId}?page=${page}&limit=${limit}`, { headers });
    
    if (response.data.success) {
      const commentData = response.data.data;
      // Map the backend comments to the frontend format
      const mappedComments = Array.isArray(commentData.comments) 
        ? commentData.comments.map(mapComment)
        : [];
        console.log("Raw comment data:", commentData);
        console.log("Mapped comment:", mappedComments);
      setComments(mappedComments);
      setCommentCount(commentData.totalComments || mappedComments.length);
      setCommentsError("");
    }
    
  } catch (error) {
    console.error("Error fetching comments:", error);
    setCommentsError("Failed to load comments");
    // Set empty comments array to prevent errors
    setComments([]);
  }
};

// Fixed handleAddComment function to match backend expectations
const handleAddComment = async (e) => {
  e.preventDefault();
  
  if (!user) {
    navigate("/login");
    return;
  }
  
  if (!newComment.trim()) {
    return;
  }
  
  setIsSubmittingComment(true);
  
  try {
    const accessToken = user.accessToken;
    
    // FIX: Use "text" field as shown in backend code (document 1)
    const response = await api.post("/api/v1/comments", {
      videoId, 
      text: newComment  // Use "text" as expected by the backend
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (response.data.success) {
      const newCommentData = response.data.data;
      
      // Create properly formatted comment object
      const commentForDisplay = mapComment(newCommentData);
      
      // Update comments state with new comment
      setComments(prevComments => [commentForDisplay, ...prevComments]);
      setCommentCount(prevCount => prevCount + 1);
      setNewComment("");
      setCommentsError("");
    }
  } catch (error) {
    console.error("Error adding comment:", error);
    setCommentsError("Failed to add comment");
  } finally {
    setIsSubmittingComment(false);
  }
};

// Fixed handleUpdateComment function to match backend expectations
const handleUpdateComment = async (commentId) => {
  if (!editedCommentContent.trim() || !user) {
    return;
  }
  
  try {
    const accessToken = user.accessToken;
    
    // FIX: Use "text" field as shown in backend code (document 1)
    const response = await api.patch(`/api/v1/comments/${commentId}`, {
      text: editedCommentContent  // Use only "text" as expected by the backend
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (response.data.success) {
      const updatedComment = response.data.data;
      
      // Update the comment in the list
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === commentId 
            ? { 
                ...comment, 
                content: updatedComment.content || updatedComment.text, 
                updatedAt: updatedComment.updatedAt 
              }
            : comment
        )
      );
      
      // Reset editing state
      setEditingCommentId(null);
      setEditedCommentContent("");
      setCommentsError("");
    }
  } catch (error) {
    console.error("Error updating comment:", error);
    setCommentsError("Failed to update comment");
  }
};

  // Function to delete a comment
  const handleDeleteComment = async (commentId) => {
    if (!user) return;
    
    try {
      const accessToken = user.accessToken;
      
      const response = await api.delete(`/api/v1/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (response.data.success) {
        // Remove the comment from the list
        setComments(prevComments => 
          prevComments.filter(comment => comment.id !== commentId)
        );
        setCommentCount(prevCount => prevCount - 1);
        setCommentsError("");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      setCommentsError("Failed to delete comment");
    }
  };
  
  // Function to start editing a comment
  const startEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditedCommentContent(comment.content);
  };
  
  // Function to cancel editing
  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditedCommentContent("");
  };
  
  // Separate effect for video fetch - high priority
  useEffect(() => {
    fetchVideoDetails();
  }, [videoId, user]);
  
  // Separate effect for comments fetch
  useEffect(() => {
    if (videoId) {
      fetchComments();
    }
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
    
    if (!video?.owner?.id || isSubscribing) return;
    
    setIsSubscribing(true);
    
    try {
      const accessToken = user.accessToken;
      const response = await api.post(`/api/v1/subscriptions/c/${video.owner.id}`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      // Update subscription state based on the server response
      if (response.data.success) {
        setIsSubscribed(!isSubscribed);
        setSubscribers(prev => isSubscribed ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error("Error toggling subscription:", error);
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
            
            {/* Comment form */}
            {user ? (
              <form onSubmit={handleAddComment} className="mb-6">
                <div className="flex items-start space-x-3">
                  <div className="h-10 w-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.fullName || user.username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-full w-full p-2 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-grow">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full resize-none mb-2"
                      rows={3}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setNewComment("")}
                        disabled={isSubmittingComment}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={!newComment.trim() || isSubmittingComment}
                      >
                        {isSubmittingComment ? "Posting..." : "Comment"}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="bg-gray-50 p-4 rounded-md mb-6 text-center">
                <p className="text-gray-700 mb-2">Want to join the conversation?</p>
                <Button onClick={() => navigate("/login")}>
                  Sign in to comment
                </Button>
              </div>
            )}
            
            {commentsError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {commentsError}
              </div>
            )}
            
            {/* Comments list */}
            <div className="space-y-6">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                      {comment.owner?.avatar ? (
                        <img
                          src={comment.owner.avatar}
                          alt={comment.owner.fullName || comment.owner.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-full w-full p-2 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">
                          {comment.owner?.fullname || comment.owner?.username || "Anonymous"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(comment.createdAt)}
                        </span>
                        
                        {/* Comment actions dropdown */}
                        {user && (user.id === comment.owner?.id || user.isAdmin) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => startEditComment(comment)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      
                      {editingCommentId === comment.id ? (
                        <div className="mt-2">
                          <Textarea
                            value={editedCommentContent}
                            onChange={(e) => setEditedCommentContent(e.target.value)}
                            className="w-full resize-none mb-2"
                            rows={3}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={cancelEditComment}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleUpdateComment(comment.id)}
                              disabled={!editedCommentContent.trim()}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700">{comment.content}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default VideoPlayer;