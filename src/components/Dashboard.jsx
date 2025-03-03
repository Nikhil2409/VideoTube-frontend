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
} from "lucide-react";
import axios from "axios";

// Create API instance outside component to avoid recreation
const api = axios.create({
  baseURL: "http://localhost:3900",
  withCredentials: true,
});

// Dummy data
const dummyData = {
  videos: [
    { _id: '1', title: 'Dummy Video 1', thumbnail: 'https://via.placeholder.com/150', duration: '3:45', views: 1000, likes: { length: 50 }, comments: { length: 10 }, createdAt: new Date(), isPublished: true },
    { _id: '2', title: 'Dummy Video 2', thumbnail: 'https://via.placeholder.com/150', duration: '5:20', views: 2000, likes: { length: 100 }, comments: { length: 20 }, createdAt: new Date(), isPublished: false },
  ],
  likedVideos: [
    { _id: '3', title: 'Liked Dummy Video', thumbnail: 'https://via.placeholder.com/150', duration: '4:30', views: 3000, likes: { length: 150 }, createdAt: new Date() },
  ],
  playlists: [
    { _id: '1', name: 'Dummy Playlist', description: 'A dummy playlist', videos: [{ thumbnail: 'https://via.placeholder.com/150' }], createdAt: new Date(), isPublic: true },
  ],
  subscribers: [
    { _id: '1', username: 'DummyUser', avatar: 'https://via.placeholder.com/50', createdAt: new Date() },
  ],
  tweets: [
    { _id: '1', content: 'This is a dummy tweet', createdAt: new Date() },
  ],
};

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("videos");
  const [channelStats, setChannelStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  
  const [dashboardData, setDashboardData] = useState({
    videos: [],
    likedVideos: [],
    playlists: [],
    subscribers: [],
    tweets: [],
  });

  const { videos, likedVideos, playlists, subscribers, tweets } = dashboardData;

  const userId = user?.id;
  const accessToken = user?.accessToken;
  const username = user?.username;

  const fetchDashboardData = useCallback(async (showLoading = true) => {
    if (!accessToken) return null;
    
    if (showLoading) setIsLoading(true);
    
    const controller = new AbortController();
    const signal = controller.signal;
    
    try {
      const subscribersResponse = await api.get(`/api/v1/subscriptions/u/${username}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal,
      });

      const videoResponse = await api.get(`/api/v1/videos/user/${username}`,{
        headers: { Authorization: `Bearer ${accessToken}`  },
        signal,
      });
    
      //console.log(subscribersResponse);
      console.log(videoResponse);
      setDashboardData(prevData => ({
        ...prevData,
        subscribers: subscribersResponse.data?.data?.subscribers || dummyData.subscribers,
        videos: videoResponse?.data?.videos || dummyData.videos,
        likedVideos: dummyData.likedVideos,
        playlists: dummyData.playlists,
        tweets: dummyData.tweets,
      }));

      setLastRefreshed(new Date());
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Error fetching dashboard data:", error);
        // Use dummy data if API call fails
        setDashboardData(dummyData);
      }
    } finally {
      if (showLoading) setIsLoading(false);
    }
    
    return () => controller.abort();
  }, [accessToken, username]);

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
      await api.patch(`/api/v1/videos/toggle/publish/${videoId}`, {}, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      // Update the videos state using previous state pattern
      setDashboardData(prev => ({
        ...prev,
        videos: prev.videos.map((video) => {
          if (video._id === videoId) {
            return {
              ...video,
              isPublished: !video.isPublished,
            };
          }
          return video;
        })
      }));
    } catch (error) {
      console.error("Error toggling video publish status:", error);
    }
  };

  const deleteTweet = async (tweetId) => {
    try {
      await api.delete(`/api/v1/tweets/${tweetId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Update the tweets state using previous state pattern
      setDashboardData(prev => ({
        ...prev,
        tweets: prev.tweets.filter((tweet) => tweet._id !== tweetId)
      }));
    } catch (error) {
      console.error("Error deleting tweet:", error);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  // Show loading only on initial load when no data exists
  const initialLoading = isLoading && videos.length === 0;

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

  return (
    <div className="flex h-screen w-full bg-gray-100">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-auto">
        <Navbar user={user} />
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Channel Dashboard</h1>
              <p className="text-sm text-gray-500">
                Last updated: {lastRefreshed.toLocaleTimeString()}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="flex items-center gap-1"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={() => navigate("/VideoUpload")}
                className="bg-red-600 hover:bg-red-700"
              >
                Upload Video
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
            {[
              { icon: Play, label: "Videos", count: videos.length, color: "text-red-600" },
              { icon: ThumbsUp, label: "Likes", count: likedVideos.length, color: "text-blue-600" },
              { icon: MessageSquare, label: "Comments", count: channelStats.commentCount || 0, color: "text-green-600" },
              { icon: ListVideo, label: "Playlists", count: playlists.length, color: "text-purple-600" },
              { icon: Users, label: "Subscribers", count: subscribers.length, color: "text-orange-600" },
              { icon: Twitter, label: "Tweets", count: tweets.length, color: "text-cyan-600" },
              { icon: Bell, label: "History", count: channelStats.watchHistory?.length || 0, color: "text-yellow-600" },
            ].map((stat, index) => (
              <Card key={index} className="shadow-sm" onClick={() => setActiveTab(stat.label.toLowerCase())}>
                <CardContent className="p-4 flex items-center space-x-2 cursor-pointer">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  <div>
                    <p className="text-sm font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.count}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs for different sections */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList className="grid grid-cols-7 gap-2">
              {["Videos", "Likes", "Comments", "Playlists", "Subscribers", "Tweets", "History"].map((tab) => (
                <TabsTrigger key={tab} value={tab.toLowerCase()}>{tab}</TabsTrigger>
              ))}
            </TabsList>

            {/* Videos Tab */}
            <TabsContent value="videos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Your Videos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {videos.length > 0 ? videos.map((video) => (
                      <div
                        key={video._id}
                        className="flex items-start border-b border-gray-200 pb-4"
                      >
                        <div className="bg-gray-300 h-20 w-36 flex-shrink-0 rounded mr-4 relative">
                          {video.thumbnail && (
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="h-full w-full object-cover rounded"
                            />
                          )}
                          <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                            {video.duration || "00:00"}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium mb-1 hover:text-blue-600 cursor-pointer">
                            {video.title}
                          </h3>
                          <div className="flex space-x-3 text-xs text-gray-500">
                            <span>{video.views || 0} views</span>
                            <span>{video.likes?.length || 0} likes</span>
                            <span>{video.comments?.length || 0} comments</span>
                            <span>
                              {new Date(video.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="mt-2">
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                video.isPublished
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {video.isPublished ? "Published" : "Private"}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600"
                            onClick={() => navigate(`/video/edit/${video._id}`)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-orange-600"
                            onClick={() => toggleVideoPublishStatus(video._id)}
                          >
                            {video.isPublished ? "Unpublish" : "Publish"}
                          </Button>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>You haven't uploaded any videos yet.</p>
                        <Button
                          className="mt-4 bg-red-600 hover:bg-red-700"
                          onClick={() => navigate("/upload")}
                        >
                          Upload Your First Video
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
             

            {/* Comments Tab */}
            <TabsContent value="comments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Your Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <p>Comment data will be displayed here</p>
                    {/* You'll need to fetch and display comment data */}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Playlists Tab */}
            <TabsContent value="playlists" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Your Playlists</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {playlists.map((playlist) => (
                      <div
                        key={playlist._id}
                        className="flex items-start border-b border-gray-200 pb-4"
                      >
                        <div className="bg-gray-300 h-20 w-36 flex-shrink-0 rounded mr-4 relative">
                          {playlist.videos && playlist.videos[0]?.thumbnail && (
                            <img
                              src={playlist.videos[0].thumbnail}
                              alt={playlist.name}
                              className="h-full w-full object-cover rounded"
                            />
                          )}
                          <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                            {playlist.videos?.length || 0} videos
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium mb-1 hover:text-blue-600 cursor-pointer"
                              onClick={() => navigate(`/playlist/${playlist._id}`)}>
                            {playlist.name}
                          </h3>
                          <p className="text-xs text-gray-500">{playlist.description}</p>
                          <div className="flex space-x-3 text-xs text-gray-500 mt-1">
                            <span>Created: {new Date(playlist.createdAt).toLocaleDateString()}</span>
                            <span>{playlist.isPublic ? "Public" : "Private"}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {playlists.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>You haven't created any playlists yet.</p>
                        <Button
                          className="mt-4 bg-purple-600 hover:bg-purple-700"
                          onClick={() => navigate("/playlist/create")}
                        >
                          Create Your First Playlist
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subscribers Tab */}
            <TabsContent value="subscribers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Your Subscribers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subscribers.map((subscriber) => (
                      <div key={subscriber._id} className="flex items-center p-3 border rounded-lg">
                        <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden mr-3">
                          {subscriber.avatar && (
                            <img
                              src={subscriber.avatar}
                              alt={subscriber.username}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{subscriber.name}</h4>
                          <p className="text-xs text-gray-500">
                            {subscriber.subscribedAt}
                          </p>
                        </div>
                      </div>
                    ))}

                    {subscribers.length === 0 && (
                      <div className="col-span-full text-center py-8 text-gray-500">
                        <p>You don't have any subscribers yet.</p>
                        <p className="mt-2">Create more content to attract subscribers!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tweets Tab */}
            <TabsContent value="tweets" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Your Tweets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tweets.map((tweet) => (
                      <div
                        key={tweet._id}
                        className="p-4 border rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden mr-3">
                              {user.avatar && (
                                <img
                                  src={user.avatar}
                                  alt={user.username}
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium">{user.username}</h4>
                              <p className="text-xs text-gray-500">
                                {new Date(tweet.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => deleteTweet(tweet._id)}
                          >
                            Delete
                          </Button>
                        </div>
                        <p className="mt-3">{tweet.content}</p>
                      </div>
                    ))}

                    {tweets.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>You haven't posted any tweets yet.</p>
                        {/* Add a button to create a tweet if you have that functionality */}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Watch History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <p>Your watch history will be displayed here</p>
                    {/* You'll need to fetch and display watch history data */}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
