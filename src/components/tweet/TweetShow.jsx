import React, { useState, useEffect } from "react";
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
  MoreVertical,
  Edit,
  Trash2,
  Heart,
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
const DUMMY_TWEET = {
  id: "tweet123",
  content: "Just launched my new project using React and Node.js! Check it out at https://example.com #webdev #javascript",
  media: "https://images.unsplash.com/photo-1555099962-4199c345e5dd",
  likes: 48,
  createdAt: "2024-02-15T12:00:00Z",
  owner: "user123"
};

function TweetShow() {
  const { tweetId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tweet, setTweet] = useState(null);
  const [owner, setOwner] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribeProcessing, setIsSubscribeProcessing] = useState(false);
  // States for comments
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentContent, setEditedCommentContent] = useState("");
  const [commentsError, setCommentsError] = useState("");
  
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
  
  // Format date for the tweet display
  const formatTweetDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
           ' · ' + 
           date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  // Function to fetch tweet details
  const fetchTweetDetails = async () => {
    if (!tweetId) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const accessToken = user?.accessToken;
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      
      // API call to get tweet data
      const response = await api.get(`/api/v1/tweets/${tweetId}`, { headers });
      
      // Extract tweet data from the response
      const tweetData = response.data.data;
      
      console.log("Tweet data:", tweetData);
      // Set tweet data
      setTweet(tweetData);
      
      // Extract owner data
      if (tweetData.user) {
        setOwner(tweetData.user);
      }
      
      // Extract engagement metrics
      setLikeCount(tweetData.likesCount || 0);
      setCommentCount(tweetData.commentsCount || 0);
      
      setIsLiked(tweetData.isLiked || false);
      setIsSubscribed(tweetData.isSubscribed || false);
    } catch (error) {
      console.error("Error fetching tweet:", error);
      // Use dummy data if API fails
      setTweet(DUMMY_TWEET);
      setOwner(null);
      setIsLiked(false);
      setLikeCount(DUMMY_TWEET.likes);
      setCommentCount(0);
      setError("Failed to fetch tweet data. Using placeholder content.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Map comment from backend format to frontend format
  const mapComment = (backendComment) => {
    if (!backendComment) return null;
    
    // Get proper likesCount
    let likesCount = 0;
    
    if (backendComment.likesCount !== undefined) {
      likesCount = backendComment.likesCount;
    } else if (Array.isArray(backendComment.likes)) {
      likesCount = backendComment.likes.length;
    }
  
    // Check if current user has liked this comment
    let isLiked = false;
    if (backendComment.isLiked !== undefined) {
      isLiked = backendComment.isLiked;
    }
    
    // Ensure we have an owner object with all needed properties
    const ownerObj = backendComment.user || backendComment.owner || {};
    
    return {
      id: backendComment._id || backendComment.id,
      content: backendComment.content || backendComment.text || "", 
      createdAt: backendComment.createdAt || new Date().toISOString(),
      likesCount: likesCount,
      isLiked: isLiked,
      owner: {
        id: ownerObj._id || ownerObj.id || "unknown",
        fullName: ownerObj.fullName || ownerObj.username || "Anonymous",
        username: ownerObj.username || "user",
        avatar: ownerObj.avatar || null
      }
    };
  };
  
  // Fetch comments for the tweet
  const fetchComments = async () => {
    if (!tweetId) return;
    
    try {
      const accessToken = user?.accessToken;
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      
      // Add pagination parameters
      const page = 1; // Start with first page
      const limit = 50; // Reasonable default limit
      
      const response = await api.get(`/api/v1/comments/tweet/${tweetId}?page=${page}&limit=${limit}`, { headers });
      
      if (response.data.success) {
        const commentData = response.data.data;
        console.log("Raw comment data:", commentData);
        
        // Handle different possible response structures
        let commentsArray = [];
        if (Array.isArray(commentData)) {
          commentsArray = commentData;
        } else if (commentData.comments && Array.isArray(commentData.comments)) {
          commentsArray = commentData.comments;
        } else if (typeof commentData === 'object') {
          // If single comment object is returned
          commentsArray = [commentData];
        }
        
        // Map the backend comments to the frontend format, filtering out any null values
        const mappedComments = commentsArray
          .map(mapComment)
          .filter(comment => comment !== null);
        
        console.log("Mapped comments:", mappedComments);
        setComments(mappedComments);
        setCommentCount(commentData.totalComments || mappedComments.length);
        setCommentsError("");
      }
      
    } catch (error) {
      console.error("Error fetching comments:", error);
      setCommentsError("Failed to load comments");
    }
  };
  
  // Handle comment like toggle
  const handleCommentLikeToggle = async (commentId) => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    // Find the comment in state
    const commentToUpdate = comments.find(comment => comment.id === commentId);
    if (!commentToUpdate) return;
    
    // Optimistic UI update - only change by 1 each time
    const isCurrentlyLiked = commentToUpdate.isLiked;
    const currentLikesCount = commentToUpdate.likesCount;
    
    // Update the comment with new like status
    setComments(prevComments => 
      prevComments.map(comment =>
        comment.id === commentId 
          ? { 
              ...comment, 
              isLiked: !isCurrentlyLiked,
              likesCount: isCurrentlyLiked 
                ? Math.max(0, currentLikesCount - 1) 
                : currentLikesCount + 1
            }
          : comment
      )
    );
    
    try {
      const accessToken = user.accessToken;
      
      // Call the API to toggle like
      const response = await api.post(`/api/v1/likes/toggle/c/${commentId}`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      // Update UI from server response if available
      if (response.data && response.data.data) {
        const serverLiked = response.data.data.liked;
        
        setComments(prevComments => 
          prevComments.map(comment =>
            comment.id === commentId 
              ? { 
                  ...comment,
                  isLiked: serverLiked,
                  likesCount: serverLiked !== comment.isLiked 
                    ? (serverLiked ? comment.likesCount + 1 : Math.max(0, comment.likesCount - 1))
                    : comment.likesCount
                }
              : comment
          )
        );
      }
    } catch (error) {
      console.error("Error toggling comment like:", error);
      
      // Revert optimistic update on error
      setComments(prevComments => 
        prevComments.map(comment =>
          comment.id === commentId 
            ? { 
                ...comment, 
                isLiked: isCurrentlyLiked,
                likesCount: currentLikesCount
              }
            : comment
        )
      );
      
      setCommentsError("Failed to update like status");
    }
  };

  // Add a new comment
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
      
      const response = await api.post("/api/v1/comments/tweet", {
        tweetId, 
        content: newComment
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (response.data.success) {
        const newCommentData = response.data.data;
        console.log("New comment response:", newCommentData);
        
        // Create properly formatted comment object
        const commentForDisplay = mapComment(newCommentData);
        
        if (commentForDisplay) {
          // Update comments state with new comment
          setComments(prevComments => [commentForDisplay, ...prevComments]);
          setCommentCount(prevCount => prevCount + 1);
        }
        
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

  // Update an existing comment
  const handleUpdateComment = async (commentId) => {
    if (!editedCommentContent.trim() || !user) {
      return;
    }
    
    try {
      const accessToken = user.accessToken;
      
      const response = await api.patch(`/api/v1/comments/tweet/${commentId}`, {
        text: editedCommentContent
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (response.data.success) {
        const updatedComment = response.data.data;
        console.log("Updated comment response:", updatedComment);
        
        // Create a properly formatted updated comment
        const mappedUpdatedComment = mapComment(updatedComment);
        
        if (mappedUpdatedComment) {
          // Update the comment in the list
          setComments(prevComments => 
            prevComments.map(comment => 
              comment.id === commentId 
                ? { 
                    ...comment,
                    content: mappedUpdatedComment.content,
                    updatedAt: mappedUpdatedComment.updatedAt || new Date().toISOString()
                  }
                : comment
            )
          );
        }
        
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

  // Delete a comment
  const handleDeleteComment = async (commentId) => {
    if (!user) return;
    
    try {
      const accessToken = user.accessToken;
      
      const response = await api.delete(`/api/v1/comments/tweet/${commentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (response.data.success) {
        // Remove the comment from the list
        setComments(prevComments => 
          prevComments.filter(comment => comment.id !== commentId)
        );
        setCommentCount(prevCount => Math.max(0, prevCount - 1));
        setCommentsError("");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      setCommentsError("Failed to delete comment");
    }
  };
  
  // Start editing a comment
  const startEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditedCommentContent(comment.content);
  };
  
  // Cancel editing a comment
  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditedCommentContent("");
  };
  
  // Initial data fetch
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (isMounted) {
        await fetchTweetDetails();
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [tweetId, user]);
  
  // Fetch comments separately
  useEffect(() => {
    let isMounted = true;
    
    const getComments = async () => {
      if (tweetId && isMounted) {
        await fetchComments();
      }
    };
    
    getComments();
    
    return () => {
      isMounted = false;
    };
  }, [tweetId, user]);

  // Handle like toggle
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
      await api.post(`/api/v1/likes/toggle/t/${tweetId}`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert optimistic update on error
      setIsLiked(!isLiked);
      setLikeCount(prevCount => !isLiked ? prevCount - 1 : prevCount + 1);
      setError("Failed to update like status");
    }
  };
  
  // Handle subscribe toggle
  const handleSubscribeToggle = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    if (!owner?.id || isSubscribeProcessing) return;
    
    setIsSubscribeProcessing(true);
    
    try {
      const accessToken = user.accessToken;
      const response = await api.post(`/api/v1/subscribes/toggle/${owner.id}`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      // Update subscribe state based on the server response
      if (response.data.success) {
        setIsSubscribed(!isSubscribed);
      }
    } catch (error) {
      console.error("Error toggling subscribe:", error);
      setError("Failed to update subscribe status");
    } finally {
      setIsSubscribeProcessing(false);
    }
  };
  
  // Navigate back
  const goBack = () => {
    navigate(-1);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Not found state
  if (!tweet) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-red-600">Tweet not found</h2>
        <Button onClick={goBack} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Back button */}
        <Button 
          variant="ghost" 
          className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
          onClick={goBack}
        >
          <ChevronLeft className="mr-1 h-5 w-5" />
          Back to Timeline
        </Button>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {/* Tweet Card */}
        <Card className="mb-6 overflow-hidden">
          <CardContent className="p-6">
            {/* User info */}
            <div className="flex items-start mb-4">
              <div className="h-12 w-12 rounded-full bg-gray-300 overflow-hidden mr-3">
                {owner?.avatar ? (
                  <img
                    src={owner.avatar}
                    alt={owner.fullName || owner.username}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <User className="h-full w-full p-2 text-gray-500" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold">{owner?.fullName || "User"}</h3>
                    <p className="text-sm text-gray-500">@{owner?.username || "username"}</p>
                  </div>
                  
                  {/* Subscribe button (only shown if not the current user) */}
                  {user && owner && user.id !== owner.id && (
                    <Button
                      onClick={handleSubscribeToggle}
                      disabled={isSubscribeProcessing}
                      size="sm"
                      className={
                        isSubscribed 
                          ? "border border-gray-300 bg-white text-gray-900 hover:bg-gray-100" 
                          : "bg-black text-white hover:bg-gray-800"
                      }
                    >
                      {isSubscribeProcessing ? 'Processing...' : isSubscribed ? 'Subscribed' : 'Subscribe'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Tweet content */}
            <div className="mb-4">
              <p className="text-lg mb-3 whitespace-pre-line">{tweet.content}</p>
              
              {/* Tweet image (if any) */}
              {tweet.image && (
                <div className="rounded-lg overflow-hidden mb-3 border border-gray-200">
                  <img 
                    src={tweet.image} 
                    alt="Tweet media" 
                    className="w-full h-auto max-h-96 object-contain"
                  />
                </div>
              )}
              
              {/* Tweet timestamp */}
              <div className="text-sm text-gray-500 mt-3">
                {formatTweetDate(tweet.createdAt)}
              </div>
              
              {/* Tweet metrics */}
              <div className="flex space-x-6 mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  <span className="font-bold text-gray-700">{likeCount}</span> Likes
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-bold text-gray-700">{commentCount}</span> Comments
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-between pt-3 border-t border-gray-200">
              <Button
                variant="ghost"
                size="sm"
                className={`flex items-center gap-1 ${isLiked ? 'text-red-600' : 'text-gray-600'}`}
                onClick={handleLikeToggle}
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-600' : ''}`} />
                <span>Like</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 text-gray-600"
              >
                <MessageSquare className="h-5 w-5" />
                <span>Comment</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 text-gray-600"
              >
                <Share2 className="h-5 w-5" />
                <span>Share</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        
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
                      placeholder="Write a comment..."
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
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        {isSubmittingComment ? "Posting..." : "Comment"}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
                <div className="bg-gray-50 p-4 rounded-md mb-6 text-center">
                <p className="mb-2">Sign in to comment on this tweet</p>
                <Button
                  onClick={() => navigate("/login")}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Log in
                </Button>
              </div>
            )}
            
            {commentsError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {commentsError}
              </div>
            )}
            
            {/* Comments list */}
            {comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-b border-gray-200 pb-4">
                    <div className="flex items-start space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                        {comment.owner.avatar ? (
                          <img
                            src={comment.owner.avatar}
                            alt={comment.owner.fullName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-full w-full p-2 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold">{comment.owner.fullName}</span>
                            <span className="text-gray-500 ml-2">@{comment.owner.username}</span>
                            <span className="text-gray-500 ml-2">·</span>
                            <span className="text-gray-500 ml-2">{formatRelativeTime(comment.createdAt)}</span>
                          </div>
                          
                          {/* Comment options dropdown if current user is the comment owner */}
                          {user && user.id === comment.owner.id && (
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
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        
                        {/* Edit comment form */}
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
                                size="sm"
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                onClick={() => handleUpdateComment(comment.id)}
                                disabled={!editedCommentContent.trim()}
                                size="sm"
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                              >
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="mt-1 whitespace-pre-line">{comment.content}</p>
                            
                            {/* Comment actions */}
                            <div className="flex items-center mt-2 space-x-4">
                              <button
                                onClick={() => handleCommentLikeToggle(comment.id)}
                                className={`flex items-center text-sm ${
                                  comment.isLiked ? 'text-red-600' : 'text-gray-500'
                                } hover:text-red-600`}
                              >
                                <Heart 
                                  className={`h-4 w-4 mr-1 ${comment.isLiked ? 'fill-red-600' : ''}`} 
                                />
                                <span>{comment.likesCount || 0}</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
            ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              No comments yet. Be the first to comment!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  </div>
);
}

export default TweetShow;