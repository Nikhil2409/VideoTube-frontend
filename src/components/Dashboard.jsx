import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Play,
  MessageSquare,
  ListVideo,
  Users,
  ThumbsUp,
  Twitter,
  Bell,
  RefreshCw,
  AlertCircle,
  Compass,
  Trash2,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { ChevronLeft, ChevronRight } from 'lucide-react'

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

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("videos");
  const [channelStats, setChannelStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  
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
  const paginatedHistory = watchHistory.slice(0, currentPage * itemsPerPage);
  const totalPages = Math.ceil(watchHistory.length / itemsPerPage);

  const fetchDashboardData = useCallback(async (showLoading = true) => {
    if (!accessToken) return null;
    
    if (showLoading) setIsLoading(true);
    
    const controller = new AbortController();
    const signal = controller.signal;
    
    try {
      // Fetch subscribers
      const subscribersResponse = await api.get(`/api/v1/subscriptions/u/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal,
      }).catch(() => ({ data: { data: { subscribers: [] } } }));
      
      const likesResponse = await api.get(`/api/v1/likes/videos`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal,
      }).catch(() => ({ data: { data: { likes: [] } } }));
      
      
      // Fetch dashboard videos using the new endpoint
      const dashboardVideosResponse = await api.get(`/api/v1/videos/user/id/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal,
      }).catch(() => ({ data: { data: {videos: []} } }));
    
      console.log(dashboardVideosResponse);
    
      // Fetch watch history videos
      //console.log(user);
      const watchHistoryIds = user.watchHistoryIds || [];
      const videoPromises = watchHistoryIds.map(async (videoId) => {
        try {
          const response = await api.get(`/api/v1/videos/${videoId}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            signal,
          });
          return response.data.data; // Assuming the video data is in response.data.data
        } catch (error) {
          console.error(`Failed to fetch video ${videoId}:`, error);
          return null;
        }
      });
      
      // Wait for all API calls to complete
      const videosArray = await Promise.all(videoPromises);
    
      // Filter out null values (failed requests)
      const validVideos = videosArray.filter(video => video !== null);
      console.log(validVideos);
      // Update dashboard data
      setDashboardData(prevData => ({
        ...prevData,
        subscribers: subscribersResponse.data?.data?.subscribers || dummyData.subscribers,
        videos: dashboardVideosResponse.data?.videos ,
        likedVideos: likesResponse.data.data || dummyData.likedVideos,
        comments: [],
        watchHistory: validVideos,
        playlists: dummyData.playlists,
        tweets: dummyData.tweets,
      }));  // Update channel stats
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
    
    return () => controller.abort();
  }, [accessToken, userId]);

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
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
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
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Update videos state by removing the deleted video
      setDashboardData(prev => ({
        ...prev,
        videos: prev.videos.filter((video) => video.id !== videoId)
      }));
      
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
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
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
    fetchDashboardData();
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
  const renderItemCard = (item, type, actions = []) => (
    <div
      className="flex items-center bg-white/70 backdrop-blur-lg rounded-xl p-4 shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 border border-white/30 space-x-4"
      onClick={() => type === 'video' ? navigate(`/video/${item.id}`) : null}
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
                e.stopPropagation();
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
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-auto">
        <Navbar user={user} />
        <div className="p-8 space-y-8">
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
                <Button
                  onClick={() => navigate("/VideoUpload")}
                  className="bg-white text-blue-600 hover:bg-white/90 shadow-md"
                >
                  Upload Video
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
            <TabsList className="bg-white/60 backdrop-blur-lg border border-white/30 p-1 rounded-xl">
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
                {videos?.length > 0 ? (
                  videos.map((video) => renderItemCard(
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
                {likedVideos.length > 0 ? (
                  likedVideos.map((video) => renderItemCard(video, 'video'))
                ) : (
                  renderEmptyState("liked videos", "Browse Videos", () => navigate("/explore"))
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
                {comments && comments.length > 0 ? (
                  comments.map((comment) => (
                    <div 
                      key={comment.id} 
                      className="bg-white/70 backdrop-blur-lg rounded-xl p-4 shadow-md border border-white/30 hover:shadow-xl transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 
                            className="font-medium text-blue-600 cursor-pointer hover:text-blue-800" 
                            onClick={() => navigate(`/video/${comment.videoId}`)}
                          >
                            {comment.videoTitle || "Video"}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-gray-700">{comment.content}</p>
                    </div>
                  ))
                ) : (
                  renderEmptyState("comments", "Browse Videos", () => navigate("/explore"))
                )}
              </CardContent>
            </TabsContent>

            {/* Playlists Tab */}
            <TabsContent 
              value="playlists" 
              className="space-y-4 bg-white/60 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl"
            >
              <CardHeader>
                <CardTitle className="text-xl text-gray-800">Your Playlists</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {playlists.length > 0 ? (
                  playlists.map((playlist) => renderItemCard(
                    playlist, 
                    'playlist', 
                    [
                      { 
                        label: 'View', 
                        onClick: () => navigate(`/playlist/${playlist.id}`),
                        className: 'text-blue-600'
                      }
                    ]
                  ))
                ) : (
                  renderEmptyState("playlists", "Create Your First Playlist", () => navigate("/playlist/create"))
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
                {subscribers.length > 0 ? (
                  subscribers.map((subscriber) => (
                    <div 
                      key={subscriber.id} 
                      className="bg-white/70 backdrop-blur-lg rounded-xl p-4 shadow-md border border-white/30 flex items-center hover:shadow-xl transition-all transform hover:-translate-y-1"
                    >
                      <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden mr-4">
                        {subscriber.avatar ? (
                          <img
                            src={subscriber.avatar}
                            alt={subscriber.username}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <Users className="text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 
                          className="font-medium cursor-pointer hover:text-blue-600"
                          onClick={() => navigate(`/channel/${subscriber.username}`)}
                        >
                          {subscriber.fullName || subscriber.username}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {subscriber.subscribedAt 
                            ? new Date(subscriber.subscribedAt).toLocaleDateString() 
                            : "Subscribed recently"}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  renderEmptyState("subscribers", "Create More Content", () => navigate("/VideoUpload"))
                )}
              </CardContent>
            </TabsContent>

<TabsContent 
  value="tweets" 
  className="space-y-4 bg-white/60 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl"
>
  <CardHeader>
    <CardTitle className="text-xl text-gray-800">Your Tweets</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {tweets.length > 0 ? (
      tweets.map((tweet) => renderItemCard(
        tweet, 
        'tweet', 
        [
          { 
            label: <Trash2 className="w-4 h-4 text-red-500" />, 
            onClick: () => deleteTweet(tweet.id),
            className: 'text-red-600 hover:bg-red-50'
          }
        ]
      ))
    ) : (
      renderEmptyState("tweets", "Create Your First Tweet", () => navigate("/create-tweet"))
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
        {paginatedHistory.map((item) => renderItemCard(item, 'video'))}

        {/* Pagination Controls */}
        {watchHistory.length > itemsPerPage && (
          <div className="flex justify-center items-center mt-6 space-x-4">
            <Button
              variant="outline"
              className="bg-white/70 backdrop-blur-lg border-gray-200 hover:bg-gray-100 transition-all transform hover:scale-105"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </Button>
          </div>
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
           