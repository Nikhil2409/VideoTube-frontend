import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Share2, User, Trash2, MoreHorizontal, Loader2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const api = axios.create({
    baseURL: "http://localhost:3900",
    withCredentials: true,
});

const ViewTweetPage = () => {
  const { tweetId } = useParams();
  const navigate = useNavigate();
  const [tweet, setTweet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [showOptions, setShowOptions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [ownername, setOwnername] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch the specific tweet by ID using our new endpoint
        const tweetResponse = await api.get(`/api/v1/tweets/${tweetId}`);
        const tweetData = tweetResponse.data.data; // Access data from ApiResponse structure
        
        const getowner = await api.get(`/api/v1/users/getUser/${user.id}`);
        setOwnername(getowner.data.data.username);
        setTweet(tweetData);
        // Only set isLiked if user is logged in
        setIsLiked(user ? tweetData.isLiked : false);
        setLikeCount(tweetData.likesCount);
        setComments(tweetData.comments || []);
      } catch (err) {
        console.error("Error fetching tweet:", err);
        setError(err.response?.data?.message || 'Failed to load tweet');
      } finally {
        setLoading(false);
      }
    };

    if (tweetId) {
      fetchData();
    }
  }, [tweetId, user]);

  const handleLike = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
  
    // Optimistic UI update
    setIsLiked(!isLiked);
    setLikeCount(prevCount => isLiked ? prevCount - 1 : prevCount + 1);
  
    try {
      const accessToken = user.accessToken;
      await api.post(`/api/v1/likes/toggle/t/${tweetId}`, {});
  
      // No need to refetch everything, UI is already updated optimistically
    } catch (error) {
      console.error("Error toggling like:", error);
      
      // Revert optimistic update on error
      setIsLiked(!isLiked);
      setLikeCount(prevCount => !isLiked ? prevCount - 1 : prevCount + 1);
      setError("Failed to update like status");
    }
  };
  
  
  const handleShare = () => {
    // Copy the URL to clipboard
    navigator.clipboard.writeText(window.location.href);
    // You could implement a toast notification system here instead of an alert
    alert('Tweet URL copied to clipboard!');
  };
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this tweet?')) {
      try {
        setIsDeleting(true);
        await api.delete(`/api/v1/tweets/${tweetId}`);
        navigate('/dashboard'); // Navigate back to home after deletion
      } catch (err) {
        console.error('Failed to delete tweet', err);
        alert(err.response?.data?.message || 'Failed to delete tweet');
        setIsDeleting(false);
      }
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!commentText.trim()) return;
    if (!user) {
      alert('Please login to comment');
      return;
    }
    
    try {
      setIsSubmittingComment(true);
      const response = await api.post(`/api/v1/tweets/${tweetId}/comments`, {
        content: commentText
      });
      
      // Add the new comment to the comments list
      setComments([response.data.data, ...comments]);
      setCommentText('');
    } catch (err) {
      console.error('Failed to post comment', err);
      alert(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !tweet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-2xl font-bold text-red-500">Something went wrong</h2>
        <p className="mt-2 text-gray-600">{error || "Tweet not found"}</p>
        <Link to="/dashboard" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Back to Home
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === tweet.owner;
  const hasComments = comments.length > 0;

  return (
    <div className="max-w-2xl mx-auto mt-8 p-4">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
      <button 
       onClick={() => navigate(-1)} 
       className="text-blue-500 hover:underline flex items-center"
     >
       <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
       </svg>
       Back
     </button>
        <h1 className="text-xl font-bold text-center flex-grow">Tweet</h1>
      </div> 

      {/* Tweet card */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        {/* User info and options */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center">
            <Link to={`/c/${ownername}`} className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
              {tweet.user?.avatar ? (
                <img 
                  src={tweet.user.avatar} 
                  alt={tweet.user.username || "User"} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500">
                  <User size={24} />
                </div>
              )}
            </Link>
            <div className="ml-3">
              <Link 
                to={`/c/${ownername}`} 
                className="font-bold text-gray-900 hover:underline"
              >
                {tweet.user?.fullName || "User"}
              </Link>
              <p className="text-gray-500 text-sm">
                @{tweet.user?.username || "username"}
              </p>
            </div>
          </div>
          
          {isOwner && (
            <div className="relative">
              <button 
                onClick={() => setShowOptions(!showOptions)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
              >
                <MoreHorizontal size={20} />
              </button>
              
              {showOptions && (
                <div className="absolute right-0 mt-1 bg-white shadow-md rounded-md py-1 z-10">
                  <Link
                    to={`/edit-tweet/${tweet.id}`}
                    className="block w-full text-left px-4 py-2 text-blue-500 hover:bg-gray-100 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                    </svg>
                    Edit
                  </Link>
                  <button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 flex items-center"
                  >
                    {isDeleting ? (
                      <Loader2 size={16} className="animate-spin mr-2" />
                    ) : (
                      <Trash2 size={16} className="mr-2" />
                    )}
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tweet content */}
        <div className="p-4">
          <p className="text-gray-800 text-lg whitespace-pre-wrap">{tweet.content}</p>
          
          {/* Tweet image if available */}
          {tweet.image && (
            <div className="mt-3 rounded-lg overflow-hidden">
              <img 
                src={tweet.image} 
                alt="Tweet attachment" 
                className="w-full h-auto max-h-96 object-cover"
              />
            </div>
          )}
          
          {/* Date */}
          <p className="text-gray-500 text-sm mt-4">
            {tweet.createdAt && formatDistanceToNow(new Date(tweet.createdAt))} ago
          </p>
        </div>

        {/* Tweet stats and actions */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex justify-around">
            <a 
              href="#comments-section"
              className="flex items-center text-gray-500 hover:text-blue-500 transition-colors duration-200"
            >
              <MessageCircle size={18} className="mr-1" />
              <span>{tweet.commentsCount || 0}</span>
            </a>
            
            <button 
              className={`flex items-center transition-colors duration-200 ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
              onClick={handleLike}
            >
              <Heart 
                size={18} 
                className="mr-1" 
                fill={isLiked ? "currentColor" : "none"} 
              />
              <span>{likeCount}</span>
            </button>
            
            <button 
              className="flex items-center text-gray-500 hover:text-green-500 transition-colors duration-200"
              onClick={handleShare}
            >
              <Share2 size={18} className="mr-1" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Comments section */}
      <div id="comments-section" className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Comments</h2>
        
        {/* Add comment form */}
        {user ? (
          <div className="mb-6 bg-white rounded-xl shadow-sm p-4">
            <form onSubmit={handleSubmitComment}>
              <textarea
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                placeholder="Write a comment..."
                rows="2"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={isSubmittingComment}
              ></textarea>
              <div className="flex justify-end mt-2">
                <button 
                  type="submit"
                  disabled={isSubmittingComment || !commentText.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingComment ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    'Comment'
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="mb-6 bg-blue-50 p-4 rounded-xl text-center">
            <p className="text-blue-600">
              <Link to="/login" className="font-bold hover:underline">Sign in</Link> to leave a comment
            </p>
          </div>
        )}
        
        {/* Comments list */}
        {hasComments ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start">
                  <Link to={`/user/${comment.user.id}`} className="flex-shrink-0">
                    {comment.user.avatar ? (
                      <img 
                        src={comment.user.avatar} 
                        alt={comment.user.username} 
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-500">
                        <User size={20} />
                      </div>
                    )}
                  </Link>
                  
                  <div className="ml-3 flex-grow">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link to={`/user/${comment.user.id}`} className="font-bold text-gray-900 hover:underline">
                          {comment.user.fullName}
                        </Link>
                        <span className="mx-1 text-gray-400">•</span>
                        <span className="text-gray-500 text-sm">
                          {formatDistanceToNow(new Date(comment.createdAt))} ago
                        </span>
                      </div>
                      
                      {user?.id === comment.user.id && (
                        <button className="text-gray-400 hover:text-red-500">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    
                    <p className="mt-1 text-gray-800">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6 bg-white rounded-xl shadow-sm">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
};

export default ViewTweetPage;