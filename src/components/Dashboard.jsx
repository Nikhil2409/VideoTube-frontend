import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "./ui/dialog";
import { 
  Play, MessageSquare, ListVideo, Users, 
  ThumbsUp, Twitter, Bell
} from "lucide-react";
import axios from "axios";

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);
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
            Authorization: `Bearer ${user.accessToken}`
          }
        });
        const statsData = await statsResponse.json();
        setChannelStats(statsData.data || {});
        
        // Fetch channel videos
        const videosResponse = await fetch("/api/v1/dashboard/videos", {
          headers: {
            Authorization: `Bearer ${user.accessToken}`
          }
        });
        const videosData = await videosResponse.json();
        setVideos(videosData.data || []);
        
        // Fetch liked videos
        const likedVideosResponse = await fetch("/api/v1/likes/videos", {
          headers: {
            Authorization: `Bearer ${user.accessToken}`
          }
        });
        const likedVideosData = await likedVideosResponse.json();
        setLikedVideos(likedVideosData.data || []);
        
        // Fetch user playlists
        const playlistsResponse = await fetch(`/api/v1/playlist/user/${user.id}`, {
          headers: {
            Authorization: `Bearer ${user.accessToken}`
          }
        });
        const playlistsData = await playlistsResponse.json();
        setPlaylists(playlistsData.data || []);
        
        // Fetch user subscribers
        const subscribersResponse = await fetch(`/api/v1/subscriptions/u/${user.id}`, {
          headers: {
            Authorization: `Bearer ${user.accessToken}`
          }
        });
        const subscribersData = await subscribersResponse.json();
        setSubscribers(subscribersData.data || []);
        
        // Fetch user tweets
        const tweetsResponse = await fetch(`/api/v1/tweets/user/${user.id}`, {
          headers: {
            Authorization: `Bearer ${user.accessToken}`
          }
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
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Update the videos state
      setVideos(videos.map(video => {
        if (video._id === videoId) {
          return {
            ...video,
            isPublished: !video.isPublished
          };
        }
        return video;
      }));
    } catch (error) {
      console.error("Error toggling video publish status:", error);
    }
  };

  const deleteTweet = async (tweetId) => {
    try {
      await fetch(`/api/v1/tweets/${tweetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`
        }
      });
      
      // Update the tweets state
      setTweets(tweets.filter(tweet => tweet._id !== tweetId));
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

            <Card className="shadow-sm" onClick={() => setActiveTab("comments")}>
              <CardContent className="p-4 flex items-center space-x-2 cursor-pointer">
                <MessageSquare className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Comments</p>
                  <p className="text-2xl font-bold">{channelStats.commentCount || 0}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm" onClick={() => setActiveTab("playlists")}>
              <CardContent className="p-4 flex items-center space-x-2 cursor-pointer">
                <ListVideo className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Playlists</p>
                  <p className="text-2xl font-bold">{playlists.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm" onClick={() => setActiveTab("subscribers")}>
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
                  <p className="text-2xl font-bold">{channelStats.watchHistory?.length || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Tabs for different models */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
                    {videos.map(video => (
                      <div key={video._id} className="flex items-start border-b border-gray-200 pb-4">
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
                          <h3 className="font-medium mb-1 hover:text-blue-600 cursor-pointer">{video.title}</h3>
                          <div className="flex space-x-3 text-xs text-gray-500">
                            <span>{video.views || 0} views</span>
                            <span>{video.likes?.length || 0} likes</span>
                            <span>{video.comments?.length || 0} comments</span>
                            <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="mt-2">
                            <span className={`text-xs px-2 py-1 rounded ${video.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {video.isPublished ? 'Published' : 'Private'}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => navigate(`/video/edit/${video._id}`)}>
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" className="text-orange-600" onClick={() => toggleVideoPublishStatus(video._id)}>
                            {video.isPublished ? 'Unpublish' : 'Publish'}
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
            
            {/* Likes Tab */}
            <TabsContent value="likes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Videos You've Liked</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {likedVideos.map(video => (
                      <div key={video._id} className="flex items-center justify-between border-b border-gray-200 pb-3">
                        <div className="flex items-start">
                          <div className="bg-gray-300 h-16 w-28 flex-shrink-0 rounded mr-3 relative">
                            {video.thumbnail && (
                              <img 
                                src={video.thumbnail} 
                                alt={video.title} 
                                className="h-full w-full object-cover rounded"
                              />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium hover:text-blue-600 cursor-pointer">{video.title}</h3>
                            <p className="text-sm text-gray-500">By {video.owner?.fullName || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">Liked on {new Date(video.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/video/${video._id}`)}>View</Button>
                      </div>
                    ))}
                    
                    {likedVideos.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>You haven't liked any videos yet.</p>
                        <Button 
                          className="mt-4 bg-blue-600 hover:bg-blue-700"
                          onClick={() => navigate("/explore")}
                        >
                          Explore Videos
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
                  <CardTitle className="text-xl">Recent Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  {channelStats.recentComments && channelStats.recentComments.length > 0 ? (
                    <div className="space-y-4">
                      {channelStats.recentComments.map(comment => (
                        <div key={comment._id} className="border-b border-gray-200 pb-3">
                          <h3 className="font-medium hover:text-blue-600 cursor-pointer" onClick={() => navigate(`/video/${comment.video}`)}>
                            {comment.videoTitle || 'Video'}
                          </h3>
                          <p className="my-1">"{comment.content}"</p>
                          <div className="flex justify-between">
                            <p className="text-sm text-gray-500">
                              By {comment.owner?.fullName || 'Anonymous'} · {new Date(comment.createdAt).toLocaleDateString()}
                            </p>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/video/${comment.video}`)}>View</Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No comments on your videos yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Playlists Tab */}
            <TabsContent value="playlists" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl">Your Playlists</CardTitle>
                  <Button size="sm" onClick={() => navigate("/playlist/create")}>Create Playlist</Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {playlists.map(playlist => (
                      <div key={playlist._id} className="border rounded-md p-4 hover:border-blue-400 cursor-pointer">
                        <div className="bg-gray-300 h-32 rounded-md mb-2">
                          {playlist.videos && playlist.videos[0]?.thumbnail && (
                            <img 
                              src={playlist.videos[0].thumbnail} 
                              alt={playlist.name} 
                              className="h-full w-full object-cover rounded-md"
                            />
                          )}
                        </div>
                        <h3 className="font-medium">{playlist.name}</h3>
                        <p className="text-sm text-gray-500">{playlist.videos?.length || 0} videos · {playlist.description}</p>
                        <div className="mt-3 flex justify-end space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/playlist/${playlist._id}`)}>View</Button>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/playlist/edit/${playlist._id}`)}>Edit</Button>
                        </div>
                      </div>
                    ))}
                    
                    {playlists.length === 0 && (
                      <div className="col-span-full text-center py-8 text-gray-500">
                        <p>You haven't created any playlists yet.</p>
                        <Button 
                          className="mt-4"
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
                  <div className="space-y-4">
                    {subscribers.map(sub => (
                      <div key={sub._id} className="flex items-center justify-between border-b border-gray-200 pb-3">
                        <div className="flex items-center">
                          <div className="bg-gray-300 h-10 w-10 rounded-full mr-3 overflow-hidden">
                            {sub.avatar && (
                              <img 
                                src={sub.avatar} 
                                alt={sub.username} 
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{sub.fullName || sub.username}</p>
                            <p className="text-sm text-gray-500">Subscribed on {new Date(sub.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/channel/${sub.username}`)}>View Channel</Button>
                      </div>
                    ))}
                    
                    {subscribers.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>You don't have any subscribers yet.</p>
                        <p className="mt-2">Create and share content to grow your audience.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tweets Tab */}
            <TabsContent value="tweets" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl">Your Tweets</CardTitle>
                  <Button size="sm" onClick={() => navigate("/tweets/create")}>Create Tweet</Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tweets.map(tweet => (
                      <div key={tweet._id} className="border-b border-gray-200 pb-3">
                        <p className="mb-2">{tweet.content}</p>
                        <div className="flex justify-between items-center">
                          <div className="flex space-x-4 text-sm text-gray-500">
                            <span>{tweet.likes?.length || 0} likes</span>
                            <span>{new Date(tweet.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/tweet/edit/${tweet._id}`)}>Edit</Button>
                            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteTweet(tweet._id)}>Delete</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {tweets.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>You haven't posted any tweets yet.</p>
                        <Button 
                          className="mt-4"
                          onClick={() => navigate("/tweets/create")}
                        >
                          Create Your First Tweet
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Watch History Tab */}
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Your Watch History</CardTitle>
                </CardHeader>
                <CardContent>
                  {channelStats.watchHistory && channelStats.watchHistory.length > 0 ? (
                    <div className="space-y-4">
                      {channelStats.watchHistory.map(video => (
                        <div key={video._id} className="flex items-start border-b border-gray-200 pb-4">
                          <div className="bg-gray-300 h-16 w-28 flex-shrink-0 rounded mr-3 relative">
                            {video.thumbnail && (
                              <img 
                                src={video.thumbnail} 
                                alt={video.title} 
                                className="h-full w-full object-cover rounded"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium mb-1 hover:text-blue-600 cursor-pointer" onClick={() => navigate(`/video/${video._id}`)}>
                              {video.title}
                            </h3>
                            <p className="text-sm text-gray-500">By {video.owner?.fullName || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">Watched on {new Date(video.watchedAt || video.createdAt).toLocaleDateString()}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/video/${video._id}`)}>Watch Again</Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>Your watch history is empty.</p>
                      <Button 
                        className="mt-4 bg-blue-600 hover:bg-blue-700"
                        onClick={() => navigate("/explore")}
                      >
                        Explore Videos
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogout} onOpenChange={setShowLogout}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="text-xl font-semibold mb-4">Are you sure you want to log out?</DialogTitle>
          <DialogFooter className="mt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowLogout(false)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => {
  await axios.post("/api/v1/auth/logout", {}, { withCredentials: true });
  logout();
  navigate("/login");
}}>Logout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Dashboard;