import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { useState, useEffect } from "react";
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
} from "lucide-react";

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("videos");
  const [channelStats, setChannelStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [videos, setVideos] = useState([]);
  const [likedVideos, setLikedVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [tweets, setTweets] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch channel stats
        const statsResponse = await fetch("/api/v1/dashboard/stats", {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        });
        const statsData = await statsResponse.json();
        setChannelStats(statsData.data || {});

        // Fetch channel videos
        const videosResponse = await fetch("/api/v1/dashboard/videos", {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        });
        const videosData = await videosResponse.json();
        setVideos(videosData.data || []);

        // Fetch liked videos
        const likedVideosResponse = await fetch("/api/v1/likes/videos", {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        });
        const likedVideosData = await likedVideosResponse.json();
        setLikedVideos(likedVideosData.data || []);

        // Fetch user playlists
        const playlistsResponse = await fetch(
          `/api/v1/playlist/user/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
            },
          }
        );
        const playlistsData = await playlistsResponse.json();
        setPlaylists(playlistsData.data || []);

        // Fetch user subscribers
        const subscribersResponse = await fetch(
          `/api/v1/subscriptions/u/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
            },
          }
        );
        const subscribersData = await subscribersResponse.json();
        setSubscribers(subscribersData.data || []);

        // Fetch user tweets
        const tweetsResponse = await fetch(`/api/v1/tweets/user/${user.id}`, {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        });
        const tweetsData = await tweetsResponse.json();
        setTweets(tweetsData.data || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, navigate]);

  const toggleVideoPublishStatus = async (videoId) => {
    try {
      await fetch(`/api/v1/videos/toggle/publish/${videoId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      // Update the videos state
      setVideos(
        videos.map((video) => {
          if (video._id === videoId) {
            return {
              ...video,
              isPublished: !video.isPublished,
            };
          }
          return video;
        })
      );
    } catch (error) {
      console.error("Error toggling video publish status:", error);
    }
  };

  const deleteTweet = async (tweetId) => {
    try {
      await fetch(`/api/v1/tweets/${tweetId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
      });

      // Update the tweets state
      setTweets(tweets.filter((tweet) => tweet._id !== tweetId));
    } catch (error) {
      console.error("Error deleting tweet:", error);
    }
  };

  if (isLoading) {
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
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-auto">
        <Navbar user={user} />
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Channel Dashboard</h1>
            <Button
              onClick={() => navigate("/upload")}
              className="bg-red-600 hover:bg-red-700"
            >
              Upload Video
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
            <Card className="shadow-sm" onClick={() => setActiveTab("videos")}>
              <CardContent className="p-4 flex items-center space-x-2 cursor-pointer">
                <Play className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Videos</p>
                  <p className="text-2xl font-bold">{videos.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm" onClick={() => setActiveTab("likes")}>
              <CardContent className="p-4 flex items-center space-x-2 cursor-pointer">
                <ThumbsUp className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Likes</p>
                  <p className="text-2xl font-bold">{likedVideos.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="shadow-sm"
              onClick={() => setActiveTab("comments")}
            >
              <CardContent className="p-4 flex items-center space-x-2 cursor-pointer">
                <MessageSquare className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Comments</p>
                  <p className="text-2xl font-bold">
                    {channelStats.commentCount || 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="shadow-sm"
              onClick={() => setActiveTab("playlists")}
            >
              <CardContent className="p-4 flex items-center space-x-2 cursor-pointer">
                <ListVideo className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Playlists</p>
                  <p className="text-2xl font-bold">{playlists.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="shadow-sm"
              onClick={() => setActiveTab("subscribers")}
            >
              <CardContent className="p-4 flex items-center space-x-2 cursor-pointer">
                <Users className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Subscribers</p>
                  <p className="text-2xl font-bold">{subscribers.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm" onClick={() => setActiveTab("tweets")}>
              <CardContent className="p-4 flex items-center space-x-2 cursor-pointer">
                <Twitter className="h-4 w-4 text-cyan-600" />
                <div>
                  <p className="text-sm font-medium">Tweets</p>
                  <p className="text-2xl font-bold">{tweets.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm" onClick={() => setActiveTab("history")}>
              <CardContent className="p-4 flex items-center space-x-2 cursor-pointer">
                <Bell className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">History</p>
                  <p className="text-2xl font-bold">
                    {channelStats.watchHistory?.length || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for different models */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList className="grid grid-cols-7 gap-2">
              <TabsTrigger value="videos">Videos</TabsTrigger>
              <TabsTrigger value="likes">Likes</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="playlists">Playlists</TabsTrigger>
              <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
              <TabsTrigger value="tweets">Tweets</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Videos Tab */}
            <TabsContent value="videos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Your Videos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {videos.map((video) => (
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
                    ))}

                    {videos.length === 0 && (
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

            {/* Other tab contents remain the same */}
            {/* ... (other tab contents) */}
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
