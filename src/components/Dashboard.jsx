import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Play,
  ThumbsUp,
  RefreshCw,
  AlertCircle,
  Trash2,
  Pencil,
  Lock,
  Globe,
  Trash,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cacheUtils } from "./utils/cacheUtils"

// Create API instance outside component to avoid recreation
const api = axios.create({
  baseURL: "http://localhost:3900",
  withCredentials: true,
});

function formatDuration(seconds) {
  // Ensure seconds is a number
  seconds = Number(seconds);
  
  // Calculate minutes and remaining seconds
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  // Pad with leading zeros if needed
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = remainingSeconds.toString().padStart(2, '0');
  
  return `${formattedMinutes}:${formattedSeconds}`;
}

// Dummy data for fallback
const dummyData = {
  videos: [
    { id: '1', title: 'Dummy Video 1', thumbnail: 'https://via.placeholder.com/150', duration: '3:45', views: 1000, likes: [], comments: [], createdAt: new Date(), isPublished: true },
    { id: '2', title: 'Dummy Video 2', thumbnail: 'https://via.placeholder.com/150', duration: '5:20', views: 2000, likes: [], comments: [], createdAt: new Date(), isPublished: false },
  ],
  likedVideos: [
    { id: '3', title: 'Liked Dummy Video', thumbnail: 'https://via.placeholder.com/150', duration: '4:30', views: 3000, likes: [], createdAt: new Date() },
  ],
  playlists: [
    { id: '1', name: 'Dummy Playlist', description: 'A dummy playlist', videos: [{ thumbnail: 'https://via.placeholder.com/150' }], createdAt: new Date(), isPublic: true },
  ],
  subscribers: [
    { id: '1', username: 'DummyUser', avatar: 'https://via.placeholder.com/50', createdAt: new Date() },
  ],
  tweets: [
    { id: '1', content: 'This is a dummy tweet', createdAt: new Date() },
  ],
  watchHistory: [
    { id: '1', title: 'Watch History Dummy Video', thumbnail: 'https://via.placeholder.com/150', createdAt: new Date() }
  ]
};

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}) => {
  return (
    <div className="flex justify-center items-center mt-6 space-x-4">
      <Button
        variant="outline"
        className="bg-white/70 backdrop-blur-lg border-gray-200 hover:bg-gray-100 transition-all transform hover:scale-105"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-5 w-5 text-gray-600" />
      </Button>
      <span className="text-sm text-gray-600">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="outline"
        className="bg-white/70 backdrop-blur-lg border-gray-200 hover:bg-gray-100 transition-all transform hover:scale-105"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-5 w-5 text-gray-600" />
      </Button>
    </div>
  );
};

// Custom hook for pagination
const usePagination = (items, itemsPerPage = 5) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Reset to first page when items change
  useEffect(() => {
    setCurrentPage(1);
  }, [items]);

  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items.slice(startIndex, endIndex);
  const totalPages = Math.ceil(items.length / itemsPerPage);

  return {
    currentPage,
    setCurrentPage,
    paginatedItems,
    totalPages
  };
};


function Dashboard() {
  const location = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeTab, setActiveTab] = useState("videos");
  const [channelStats, setChannelStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [isWatchHistoryCleared, setIsWatchHistoryCleared] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarVisible((prev) => !prev);
  };


  // Watch History Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  const [dashboardData, setDashboardData] = useState({
    videos: [],
    likedVideos: [],
    playlists: [],
    subscribers: [],
    tweets: [],
    comments: [],
    watchHistory: [],
  });
  
  const { videos, likedVideos, playlists, subscribers, tweets, comments, watchHistory } = dashboardData;

  const userId = user?.id;
  const accessToken = user?.accessToken;
  const username = user?.username;

  // Pagination for Watch History
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage; 
  const paginatedHistory = watchHistory.slice(startIndex, endIndex);
  const totalPages = Math.ceil(watchHistory.length / itemsPerPage);
  
  const fetchDashboardData = useCallback(async (showLoading = true, forceRefresh = false) => {
    if (!user?.id) return null;
  
    const cacheKey = `dashboard_data_${user.id}`;
    
    // Use cache only if not force refreshing and not initial load
    if (!forceRefresh && !isInitialLoad) {
      const cachedData = cacheUtils.get(cacheKey);
      if (cachedData) {
        setDashboardData(cachedData);
        return cachedData;
      }
    }
  
    if (showLoading) setIsLoading(true);
    const controller = new AbortController();
    const signal = controller.signal;
    
    try {
      // Fetch subscribers
      const subscribersResponse = await api.get(`/api/v1/subscriptions/u/${userId}`, {
        signal
      }).catch(() => ({ data: { data: { subscribers: [] } } }));
      
      const likesResponse = await api.get(`/api/v1/likes/videos`, {
        signal
      }).catch(() => ({ data: { data: { likes: [] } } }));
      
      // Fetch dashboard videos
      const dashboardVideosResponse = await api.get(`/api/v1/videos/user/id/${userId}`, {
       signal
      });
      
      // Fetch watch history using the new endpoint
      const watchHistoryResponse = await api.get(`/api/v1/users/history`, {
        signal
      }).catch(() => ({ data: { data: [] } }));
      
      //Fetch Comments
      const comments = await api.get(`/api/v1/comments/user/video/${userId}`, {
        signal
      })
      
      //Fetch Playlists
      const playlists = await api.get(`/api/v1/playlist/user/${userId}`, {
        signal
      })
      
      //Fetch Tweets
      const tweets  = await api.get(`/api/v1/tweets/user/${userId}`, {
        signal
      })

      console.log(comments);

      // Transform watch history data to match the expected format in your UI
      const formattedWatchHistory = watchHistoryResponse.data?.data?.map(item => ({
        id: item.video?.id,
        title: item.video?.title,
        thumbnail: item.video?.thumbnail,
        duration: item.video?.duration,
        views: item.video?.views,
        createdAt: item.watchedAt,
        user: item.video?.user,
        lastPosition: item.lastPosition,
        completionRate: item.completionRate
      })) || [];
      
      console.log(tweets);
      // Update dashboard data
      setDashboardData(prevData => ({
        ...prevData,
        subscribers: subscribersResponse.data?.data?.subscribers || dummyData.subscribers,
        videos: dashboardVideosResponse.data?.videos,
        likedVideos: likesResponse.data.data || dummyData.likedVideos,
        comments: comments.data.data.comments || [],
        watchHistory: formattedWatchHistory,
        playlists: playlists.data.data || [],
        tweets: tweets.data.tweets || []
      }));  
  
      // Update channel stats
      setChannelStats({
        totalVideos: dashboardVideosResponse.data?.data?.length || 0,
        subscriberCount: subscribersResponse.data?.data?.subscribers?.length || 0,
      });
  
      setLastRefreshed(new Date());
      if (showLoading) toast.success("Dashboard data refreshed");
  
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to refresh dashboard data");
        // Use dummy data if API call fails
        setDashboardData(dummyData);
      }
    } finally {
      if (showLoading) setIsLoading(false);
    }
  
    // Save to cache after update
    cacheUtils.save(cacheKey, {
      videos: dashboardData.videos || [],
      likedVideos: dashboardData.likedVideos || [],
      playlists: dashboardData.playlists || [],
      subscribers: dashboardData.subscribers || [],
      tweets: dashboardData.tweets || [],
      comments: dashboardData.comments || [],
      watchHistory: dashboardData.watchHistory || []
    });
  
    return () => controller.abort();
  }, [accessToken, userId, user]);
  
  const refreshDashboardData = () => {
    // Clear cache for the current user
    cacheUtils.clearUserCache(user.id);
    
    // Force a full refresh of dashboard data
    fetchDashboardData(true, false);
  };

  useEffect(() => {
    if (location.state?.user || (user && isInitialLoad)) {
      fetchDashboardData(true, true)
        .then(() => setIsInitialLoad(false));
    }
  }, [location.state, user, isInitialLoad]);
  
  useEffect(() => {
    if (isWatchHistoryCleared) {
      setDashboardData(prevData => ({
        ...prevData,
        watchHistory: []
      }));
      setIsWatchHistoryCleared(false); // Reset the flag
    }
  }, [isWatchHistoryCleared]);

  const handleDeleteComment = async (commentId) => {
    if (!user) return;
    
    // Show confirmation dialog
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }
    
    try {
      const accessToken = user.accessToken;
      
      // Call API to delete the comment
      const response = await api.delete(`/api/v1/comments/video/edit/${commentId}`, {
      });
      
      if (response.data.success) {
        // Remove the comment from the local state
        const updatedComments = comments.filter(comment => comment.id !== commentId);
        
        // Fixed syntax for updating the dashboardData state
        setDashboardData(prev => ({
          ...prev,
          comments: updatedComments
        }));
        
        fetchDashboardData(true, true);
        // Show success message
        toast.success("Comment deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      // Show error message
      toast.error("Failed to delete comment");
    }
  };

  const {
    currentPage: videosPage,
    setCurrentPage: setVideosPage,
    paginatedItems: paginatedVideos,
    totalPages: videosTotalPages
  } = usePagination(videos);

  const {
    currentPage: likedVideosPage,
    setCurrentPage: setLikedVideosPage,
    paginatedItems: paginatedLikedVideos,
    totalPages: likedVideosTotalPages
  } = usePagination(likedVideos);

  const {
    currentPage: commentsPage,
    setCurrentPage: setCommentsPage,
    paginatedItems: paginatedComments,
    totalPages: commentsTotalPages
  } = usePagination(comments);

  const {
    currentPage: playlistsPage,
    setCurrentPage: setPlaylistsPage,
    paginatedItems: paginatedPlaylists,
    totalPages: playlistsTotalPages
  } = usePagination(playlists);

  const {
    currentPage: subscribersPage,
    setCurrentPage: setSubscribersPage,
    paginatedItems: paginatedSubscribers,
    totalPages: subscribersTotalPages
  } = usePagination(subscribers);

  const {
    currentPage: tweetsPage,
    setCurrentPage: setTweetsPage,
    paginatedItems: paginatedTweets,
    totalPages: tweetsTotalPages
  } = usePagination(tweets);

  
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    let abortFetch;
    
    const initializeData = async () => {
      abortFetch = await fetchDashboardData();
    };
    
    initializeData();

    return () => {
      if (typeof abortFetch === 'function') {
        abortFetch();
      }
    };
  }, [user, navigate, fetchDashboardData]);

  const toggleVideoPublishStatus = async (videoId) => {
    try {
      setIsLoading(true);
      const response = await api.patch(`/api/v1/videos/toggle/publish/${videoId}`, {}, {
      });
      // Update the videos state using previous state pattern
      setDashboardData(prev => ({
        ...prev,
        videos: prev.videos.map((video) => {
          if (video.id === videoId) {
            return {
              ...video,
              isPublished: !video.isPublished,
            };
          }
          return video;
        })
      }));
      refreshDashboardData();
      toast.success(response.data?.message || "Video status updated successfully");
    } catch (error) {
      console.error("Error toggling video publish status:", error);
      toast.error(error.response?.data?.message || "Failed to update video status");
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const deleteVideo = async (videoId) => {
    try {
      setIsLoading(true);
      await api.delete(`/api/v1/videos/${videoId}`, {
      });

      refreshDashboardData();
      toast.success("Video deleted successfully");
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error(error.response?.data?.message || "Failed to delete video");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTweet = async (tweetId) => {
    try {
      setIsLoading(true);
      await api.delete(`/api/v1/tweets/${tweetId}`, {
      });

      // Update the tweets state
      setDashboardData(prev => ({
        ...prev,
        tweets: prev.tweets.filter((tweet) => tweet.id !== tweetId)
      }));
      
      toast.success("Tweet deleted successfully");
    } catch (error) {
      console.error("Error deleting tweet:", error);
      toast.error("Failed to delete tweet");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData(true,true);
  };

  const navigateToExplore = () => {
    navigate("/explore");
  };

  // Show loading only on initial load when no data exists
  const initialLoading = isLoading && videos?.length === 0;

  if (initialLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderEmptyState = (type, actionText, actionFn) => (
    <div className="flex flex-col items-center justify-center p-8 bg-white/60 backdrop-blur-lg rounded-2xl border border-white/30 shadow-xl">
      <AlertCircle className="h-16 w-16 text-blue-500 mb-4 opacity-70" />
      <p className="text-gray-700 mb-4 text-center">
        You don't have any {type} yet.
      </p>
      {actionText && actionFn && (
        <Button
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
          onClick={actionFn}
        >
          {actionText}
        </Button>
      )}
    </div>
  );

  // Consistent video/item card rendering
// In your renderItemCard function, modify it to handle playlist clicks
const renderItemCard = (item, type, actions = []) => (
  <div
    className="flex items-center bg-white/70 backdrop-blur-lg rounded-xl p-4 shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 border border-white/30 space-x-4"
    onClick={() => {
      if (type === 'video') {
        navigate(`/video/${item.id}`);
      } else if (type === 'playlist') {
        navigate(`/playlist/${item.id}/false`);
      } else if (type === 'tweet') {
        navigate(`/tweet/${item.id}`);
      }
    }}
    style={{ cursor: (type === 'video' || type === 'playlist' || type === 'tweet') ? 'pointer' : 'default' }}
  >
    {/* Thumbnail */}
    <div className="h-20 w-36 rounded-lg overflow-hidden flex-shrink-0 relative">
      {item.thumbnail ? (
        <img
          src={item.thumbnail}
          alt={item.title || item.name || "Tweet Image"}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <Play className="text-gray-500" />
        </div>
      )}
      
      {type === 'video' && (
        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-2 rounded">
          {formatDuration(item.duration) || "00:00"}
        </div>
      )}
    </div>

    {/* Content */}
    <div className="flex-1">
      <h3 className="font-semibold text-gray-800 mb-1 hover:text-blue-600 transition-colors">
        {item.title || item.name || item.content}
      </h3>
      
      {/* Metadata based on type */}
      <div className="text-xs text-gray-500 space-y-1">
        {type === 'video' && (
          <>
            <div>{item.views || 0} views</div>
            <div>{new Date(item.createdAt).toLocaleDateString()}</div>
            {item.isPublished !== undefined && (
              <span 
                className={`inline-block px-2 py-1 rounded ${
                  item.isPublished 
                  ? "bg-green-100 text-green-800" 
                  : "bg-yellow-100 text-yellow-800"
                } text-xs`}
              >
                {item.isPublished ? "Published" : "Private"}
              </span>
            )}
          </>
        )}
        
        {type === 'playlist' && (
          <>
            <div>Created: {new Date(item.createdAt).toLocaleDateString()}</div>
            <div>{item.isPublic ? "Public" : "Private"}</div>
          </>
        )}
        
        {type === 'tweet' && (
          <div>{new Date(item.createdAt).toLocaleString()}</div>
        )}
      </div>
    </div>

    {/* Actions */}
    {actions.length > 0 && (
      <div className="flex space-x-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            className={`hover:bg-gray-100 ${action.className}`}
            onClick={(e) => {
              e.stopPropagation(); // Prevent navigation on button click
              action.onClick();
            }}
          >
            {action.label}
          </Button>
        ))}
      </div>
    )}
  </div>
);


return (
  <div className="flex h-screen w-full bg-gradient-to-br from-gray-50 to-blue-50">
    <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} />
    <div 
      className={`flex flex-col flex-1  `}
    >
      <Navbar
        toggleSidebar={toggleSidebar}
        onDataDelete={refreshDashboardData}
      />
      <div className={`p-8 space-y-8 overflow-auto transition-all duration-300 ${
        isSidebarVisible ? 'ml-64' : 'ml-0'
      }`}>
        {/* Header with Gradient Background */}
        <div 
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-6 shadow-2xl transform transition-all hover:scale-[1.02]"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2 tracking-tight">
                Welcome, {user?.username || 'Creator'}
              </h1>
              <p className="text-sm opacity-80">
                Your creative hub for content management
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="bg-white/20 text-white hover:bg-white/30 border-white/30 flex items-center gap-2"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

          {/* Tabs with Modern, Clean Design */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
          <TabsList className="bg-white/80 backdrop-blur-xl shadow-lg border border-gray-200 rounded-2xl w-full grid grid-cols-7 gap-2">
         {[
          { name: "Videos", stat: dashboardData.videos.length || 0},
          { name: "Likes", stat: dashboardData.likedVideos.length || 0},
          { name: "Comments", stat: dashboardData.comments.length || 0},
          { name: "Playlists", stat: dashboardData.playlists.length || 0},
          { name: "Subscribers", stat: dashboardData.subscribers.length || 0},
          { name: "Tweets", stat: dashboardData.tweets.length || 0},
          { name: "History", stat: dashboardData.watchHistory.length || 0}
        ].map(({ name, stat }) => (
          <TabsTrigger 
            key={name} 
            value={name.toLowerCase()}
            className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-colors flex items-center gap-2"
          >
            {name}
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
              {formatNumber(stat)}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

            {/* Videos Tab */}
            <TabsContent 
           value="videos" 
           className="space-y-4 bg-white/60 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl"
         >
           <CardHeader>
             <CardTitle className="text-xl text-gray-800">Your Videos</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             {paginatedVideos?.length > 0 ? (
               paginatedVideos.map((video) => renderItemCard(
                 video, 
                 'video', 
                 [
                   { 
                     label: 'Edit', 
                     onClick: () => navigate(`/video/edit/${video.id}`),
                     className: 'text-blue-600'
                   },
                   { 
                     label: video.isPublished ? 'Unpublish' : 'Publish', 
                     onClick: () => toggleVideoPublishStatus(video.id),
                     className: video.isPublished ? 'text-orange-600' : 'text-green-600'
                   },
                   { 
                     label: 'Delete', 
                     onClick: () => deleteVideo(video.id),
                     className: 'text-red-600'
                   }
                 ]
               ))) : (
               renderEmptyState("videos", "Upload Your First Video", () => navigate("/VideoUpload"))
             )}
             
             {videos.length > 5 && (
               <Pagination 
                 currentPage={videosPage}
                 totalPages={videosTotalPages}
                 onPageChange={setVideosPage}
               />
             )}
           </CardContent>
         </TabsContent>
            {/* Likes Tab */}
          <TabsContent 
           value="likes" 
           className="space-y-4 bg-white/60 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl"
         >
           <CardHeader>
             <CardTitle className="text-xl text-gray-800">Liked Videos</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             {paginatedLikedVideos.length > 0 ? (
               paginatedLikedVideos.map((video) => renderItemCard(video, 'video'))
             ) : (
               renderEmptyState("liked videos", "Browse Videos", () => navigate("/explore"))
             )}
             {likedVideos.length > 5 && (
               <Pagination 
                 currentPage={likedVideosPage}
                 totalPages={likedVideosTotalPages}
                 onPageChange={setLikedVideosPage}
               />
             )}
           </CardContent>
         </TabsContent>

{/* Comments Tab */}
<TabsContent 
  value="comments" 
  className="space-y-4 bg-white/60 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl"
>
  <CardHeader>
    <CardTitle className="text-xl text-gray-800">Your Comments</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {paginatedComments && paginatedComments.length > 0 ? (
      paginatedComments.map((comment) => (
        <div 
          key={comment.id} 
          className="bg-white/70 backdrop-blur-lg rounded-xl p-4 shadow-md border border-white/30 hover:shadow-xl transition-all"
        >
          <div className="flex items-start gap-4">
            {/* Video Thumbnail */}
            <div 
              className="flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden cursor-pointer"
              onClick={() => navigate(`/video/${comment.videoId}`)}
            >
              <img 
                src={comment.video.thumbnail || "/api/placeholder/160/90"} 
                alt={comment.videoTitle || "Video thumbnail"} 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Comment Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h4 
                    className="font-medium text-blue-600 cursor-pointer hover:text-blue-800" 
                    onClick={() => navigate(`/video/${comment.videoId}`)}
                  >
                    {comment.video.title || "Video"}
                  </h4>
                </div>
                
                {/* Delete Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-8"
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="mt-2 text-gray-700">{comment.content}</p>
              
              {/* Like Count Only */}
              <div className="mt-3 flex items-center gap-4">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{comment.likes.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))
    ) : (
      renderEmptyState("comments", "Browse Videos", () => navigate("/explore"))
    )}
    {comments.length > 5 && (
      <Pagination 
        currentPage={commentsPage}
        totalPages={commentsTotalPages}
        onPageChange={setCommentsPage}
      />
    )}
  </CardContent>
</TabsContent>
{/* Playlists Tab */}
<TabsContent 
  value="playlists" 
  className="space-y-4 bg-white/60 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl"
>
  <CardHeader>
    <CardTitle className="text-xl text-gray-800 flex items-center justify-between">
      Your Playlists
      <Button 
        onClick={() => navigate("/create-playlist")} 
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
      >
        New Playlist
      </Button>
    </CardTitle>
  </CardHeader>
  <CardContent>
    {paginatedPlaylists.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {paginatedPlaylists.map((playlist) => (
          <div 
            key={playlist.id} 
            className="bg-white/70 backdrop-blur-lg rounded-xl shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 border border-white/30 overflow-hidden cursor-pointer"
            onClick={() => navigate(`/playlist/${playlist.id}/false`)}
          >
            {/* Thumbnail with video count overlay */}
            <div className="relative w-full h-40 overflow-hidden">
              <img 
                src={playlist.user?.avatar || "/api/placeholder/400/200"} 
                alt={playlist.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                <Play className="h-3 w-3 mr-1" />
                {playlist.videos.length || 0} videos
              </div>
            </div>
            
            {/* Playlist info */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 mb-1 hover:text-blue-600 transition-colors">{playlist.title}</h3>
              <p className="text-xs text-gray-500 mb-3 truncate">{playlist.description || 'No description'}</p>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {playlist.isPublic ? 'Public' : 'Private'} • {new Date(playlist.updatedAt).toLocaleDateString()}
                </span>
                
                {/* Actions */}
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-gray-100 text-blue-600 p-1 h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/playlist/${playlist.id}/true`);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`hover:bg-gray-100 p-1 h-8 w-8 ${playlist.isPublic ? 'text-orange-600' : 'text-green-600'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(`Toggle playlist ${playlist.id} privacy`);
                    }}
                  >
                    {playlist.isPublic ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-gray-100 text-red-600 p-1 h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(`Delete playlist ${playlist.id}`);
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      renderEmptyState("playlists", "Create Your First Playlist", () => navigate("/create-playlist"))
    )}
    {playlists.length > 6 && (
      <Pagination 
        currentPage={playlistsPage}
        totalPages={playlistsTotalPages}
        onPageChange={setPlaylistsPage}
        className="mt-4"
      />
    )}
  </CardContent>
</TabsContent>
          
            {/* Subscribers Tab */}
            <TabsContent 
  value="subscribers" 
  className="space-y-4 bg-white/60 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl"
>
  <CardHeader>
    <CardTitle className="text-xl text-gray-800">Your Subscribers</CardTitle>
  </CardHeader>
  <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {paginatedSubscribers.length > 0 ? (
      paginatedSubscribers.map((subscriber) => (
        <div 
          key={subscriber.id} 
          className="bg-white/70 backdrop-blur-lg rounded-xl p-4 shadow-md border border-white/30 flex items-center hover:shadow-xl transition-all transform hover:-translate-y-1"
        >
          <div className="flex items-center space-x-4"
          onClick={() => navigate(`/c/${subscriber.username}`)}
          >
            <img 
              src={subscriber.avatar || '/default-avatar.png'} 
              alt={subscriber.username} 
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h4 className="font-semibold text-gray-800">{subscriber.username}</h4>
              <p className="text-xs text-gray-500">
              {subscriber.subscribedAt 
                            ? new Date(subscriber.subscribedAt).toLocaleDateString() 
                            : "Subscribed recently"}
              </p>
              <p className="text-xs text-gray-500">
              {subscriber.subscribedAt 
                            ? new Date(subscriber.subscribedAt).toLocaleTimeString() 
                            : "Just Now"}
              </p>
            </div>
          </div>
        </div>
      ))
    ) : (
      renderEmptyState("subscribers", "Create More Content", () => navigate("/VideoUpload"))
    )}
    {subscribers.length > 5 && (
      <Pagination 
        currentPage={subscribersPage}
        totalPages={subscribersTotalPages}
        onPageChange={setSubscribersPage}
      />
    )}
  </CardContent>
</TabsContent>
 
 {/* Tweets Tab */}
<TabsContent
  value="tweets" 
  className="space-y-4 bg-white/60 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl"
>
  <CardHeader>
    <CardTitle className="text-xl text-gray-800">Your Tweets</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {paginatedTweets.length > 0 ? (
      paginatedTweets.map((tweet) => {
        const tweetWithImage = {
          ...tweet,
          thumbnail: tweet.image || tweet.user?.avatar
        };

        return renderItemCard(
          tweetWithImage, 
          'tweet', 
          [
            { 
              label: <Trash2 className="w-4 h-4 text-red-500" />, 
              onClick: () => deleteTweet(tweet.id),
              className: 'text-red-600 hover:bg-red-50'
            }
          ],
        );
      })
    ) : (
      renderEmptyState("tweets", "Create Your First Tweet", () => navigate("/tweets/create"))
    )}
    {tweets.length > 5 && (
      <Pagination 
        currentPage={tweetsPage}
        totalPages={tweetsTotalPages}
        onPageChange={setTweetsPage}
      />
    )}
  </CardContent>
</TabsContent>


        {/* Watch History Tab */}
        <TabsContent 
  value="history" 
  className="space-y-4 bg-white/60 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl"
>
  <CardHeader>
    <CardTitle className="text-xl text-gray-800">Watch History</CardTitle>
  </CardHeader>
  <CardContent>
    {watchHistory && watchHistory.length > 0 ? (
      <div className="space-y-4">
        {paginatedHistory.map((item) => (
          <div
            key={item.id}
            className="flex items-center bg-white/70 backdrop-blur-lg rounded-xl p-4 shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 border border-white/30 space-x-4 cursor-pointer"
            onClick={() => navigate(`/video/${item.id}`)}
          >
            {/* Thumbnail */}
            <div className="h-20 w-36 rounded-lg overflow-hidden flex-shrink-0 relative">
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Play className="text-gray-500" />
                </div>
              )}
              <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-2 rounded">
                {formatDuration(item.duration) || "00:00"}
              </div>
              {item.completionRate && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200">
                  <div 
                    className="h-full bg-red-600" 
                    style={{ width: `${item.completionRate}%` }}
                  ></div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-1 hover:text-blue-600 transition-colors">
                {item.title}
              </h3>
              
              <div className="text-xs text-gray-500 space-y-1">
                <div>{item.views || 0} views</div>
                <div>Watched: {new Date(item.createdAt).toLocaleDateString()}</div>
                {item.lastPosition > 0 && (
                  <div>Last watched at: {formatDuration(item.lastPosition)}</div>
                )}
              </div>
            </div>

            {/* Channel info if available */}
            {item.user && (
              <div className="text-xs text-gray-600 flex items-center">
                {item.user.avatar && (
                  <img 
                    src={item.user.avatar} 
                    alt={item.user.username} 
                    className="w-6 h-6 rounded-full mr-2"
                  />
                )}
                <span>{item.user.username || item.user.fullName}</span>
              </div>
            )}
          </div>
        ))}

        {/* Pagination Controls */}
        {watchHistory.length > itemsPerPage && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    ) : (
      renderEmptyState("watch history", "Browse Videos", () => navigate("/explore"))
    )}
  </CardContent>
</TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
           