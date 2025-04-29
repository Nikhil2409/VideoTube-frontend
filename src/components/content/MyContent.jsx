import React, { useState, useEffect, useMemo } from "react";
import { 
  Play, 
  ListFilter, 
  ArrowUpDown, 
  Eye, 
  Edit, 
  Trash2, 
  MoreVertical, 
  PlusCircle,
  ListVideo,
  Clock,
  MessageSquare,
  User
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "../ui/dropdown-menu"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../ui/select";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Navbar } from "../Navbar";
import { Sidebar } from "../Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function MyContentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState({videos: true, tweets: true});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [activeTab, setActiveTab] = useState("videos");
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
    const toggleSidebar = () => {
      setIsSidebarVisible((prev) => !prev);
    };

  const api = axios.create({
    baseURL: process.env.REACT_APP_SERVER_URL || "http://localhost:3900",
    withCredentials: true,
    headers: {
      Authorization: `Bearer ${user?.accessToken}`
    }
  });

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await api.get(`/api/v1/videos/user/id/${user.id}`);
        console.log(response);
        setVideos(response.data.videos || []);
        setLoading(prev => ({...prev, videos: false}));
      } catch (error) {
        console.error("Error fetching videos:", error);
        toast.error("Failed to load videos");
        setLoading(prev => ({...prev, videos: false}));
      }
    };

    const fetchTweets = async () => {
      try {
        const response = await api.get(`/api/v1/tweets/user/${user.id}`);
        console.log(response);
    
        // Create a new array of tweets with comment counts
        const tweetsWithComments = await Promise.all(
          response.data.data.map(async (tweet) => {
            const commentsResponse = await api.get(`/api/v1/comments/tweet/${tweet.id}`);
            console.log(commentsResponse);
            const comments = commentsResponse.data.data.comments;
            
            // Return the tweet with an added commentCount property
            return {
              ...tweet,
              comments: comments.length
            };
          })
        );
    
        // Set the tweets state with the enhanced tweets data
        setTweets(tweetsWithComments || []);
        setLoading(prev => ({...prev, tweets: false}));
      } catch (error) {
        console.error("Error fetching tweets:", error);
        toast.error("Failed to load tweets");
        setLoading(prev => ({...prev, tweets: false}));
      }
    };

    if (user?.id) {
      fetchVideos();
      fetchTweets();
    }
  }, [user]);

  const handleDeleteVideo = async (videoId) => {
    try {
      await api.delete(`/api/v1/videos/${videoId}`);
      setVideos(videos.filter(video => video.id !== videoId));
      toast.success("Video deleted successfully");
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("Failed to delete video");
    }
  };

  const handleDeleteTweet = async (tweetId) => {
    try {
      await api.delete(`/api/v1/tweets/${tweetId}`);
      setTweets(tweets.filter(tweet => tweet.id !== tweetId));
      toast.success("Tweet deleted successfully");
    } catch (error) {
      console.error("Error deleting tweet:", error);
      toast.error("Failed to delete tweet");
    }
  };

  const handleTogglePublish = async (contentId, contentType) => {
    try {
      if (contentType === 'video') {
        const response = await api.patch(`/api/v1/videos/toggle/publish/${contentId}`);
        setVideos(videos.map(video => 
          video.id === contentId 
            ? { ...video, isPublished: !video.isPublished } 
            : video
        ));
        toast.success(response.data.message);
      } else {
        const response = await api.patch(`/api/v1/tweets/toggle/publish/${contentId}`);
        setTweets(tweets.map(tweet => 
          tweet.id === contentId 
            ? { ...tweet, isPublished: !tweet.isPublished } 
            : tweet
        ));
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error("Error toggling content status:", error);
      toast.error("Failed to update content status");
    }
  };

  const filteredAndSortedVideos = useMemo(() => {
    let result = videos.filter(video => {
      const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || 
        (filterStatus === "published" && video.isPublished) ||
        (filterStatus === "unpublished" && !video.isPublished);
      
      return matchesSearch && matchesStatus;
    });

    switch(sortBy) {
      case "newest":
        return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case "oldest":
        return result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case "mostViews":
        return result.sort((a, b) => (b.views || 0) - (a.views || 0));
      default:
        return result;
    }
  }, [videos, searchQuery, filterStatus, sortBy]);

  const filteredAndSortedTweets = useMemo(() => {
    let result = tweets.filter(tweet => {
      const matchesSearch = tweet.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || 
        (filterStatus === "published" && tweet.isPublished) ||
        (filterStatus === "unpublished" && !tweet.isPublished);
      
      return matchesSearch && matchesStatus;
    });

    switch(sortBy) {
      case "newest":
        return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case "oldest":
        return result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case "mostViews":
        return result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      default:
        return result;
    }
  }, [tweets, searchQuery, filterStatus, sortBy]);

  if (loading.videos && loading.tweets) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-gray-50 to-blue-50">
       <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} />
       <div 
         className={`flex flex-col flex-1`}
       >
         <Navbar
           toggleSidebar={toggleSidebar}
         />
      <div className={`p-8 space-y-8 overflow-auto transition-all duration-300 ${
        isSidebarVisible ? 'ml-64' : 'ml-0'
      }`}>
          <div className="bg-white rounded-xl shadow-md p-6">
            <Tabs defaultValue="videos" value={activeTab} onValueChange={setActiveTab}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-bold text-gray-800">My Content</h1>
                  <TabsList className="bg-gray-100">
                    <TabsTrigger value="videos" className="flex items-center gap-2">
                      <ListVideo className="w-4 h-4" /> Videos
                    </TabsTrigger>
                    <TabsTrigger value="tweets" className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Tweets
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <Button 
                  onClick={() => navigate(activeTab === "videos" ? "/VideoUpload" : "/tweets/create")}
                  className="flex items-center gap-2"
                >
                  <PlusCircle className="w-5 h-5" /> 
                  {activeTab === "videos" ? "Upload Video" : "Create Tweet"}
                </Button>
              </div>

              <div className="flex space-x-4 mb-6">
                <Input 
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>

              <TabsContent value="videos">
                {filteredAndSortedVideos.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Play className="mx-auto mb-4 w-16 h-16 text-blue-300" />
                    <p>No videos found. Start creating content!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAndSortedVideos.map((video) => (
                      <div 
                        key={video.id} 
                        className="bg-white border rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all"
                      >
                        <div className="relative"
                        onClick={() => navigate(`/video/${video.id}`)}>
                          <img 
                            src={video.thumbnail} 
                            alt={video.title} 
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                            {formatDuration(video.duration)}
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-2 truncate">
                            {video.title}
                          </h3>
                          
                          <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              {video.views || 0} Views
                            </div>
                            <div 
                              className={`px-2 py-1 rounded text-xs ${
                                video.isPublished 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {video.isPublished ? "Published" : "Unpublished"}
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => navigate(`/video/edit/${video.id}/true`)}
                              className="flex-1"
                            >
                              <Edit className="mr-2 w-4 h-4" /> Edit
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem 
                                  onSelect={() => handleTogglePublish(video.id, 'video')}
                                >
                                  {video.isPublished ? "Unpublish" : "Publish"}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onSelect={() => handleDeleteVideo(video.id)}
                                  className="text-red-600"
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tweets">
                {filteredAndSortedTweets.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="mx-auto mb-4 w-16 h-16 text-blue-300" />
                    <p>No tweets found. Start creating content!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredAndSortedTweets.map((tweet) => (
                      <div 
                      key={tweet.id} 
                      className="bg-white border rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all p-4"
                      onClick={() => navigate(`/tweet/${tweet.id}`)}
                    >
                      
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {/* User info header */}
                          <div className="flex items-center gap-3 mb-3">
                            {tweet.user ? (
                              <div className="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden">
                                <img
                                  src={tweet.user.avatar}
                                  alt={tweet.user.fullName || "Creator"}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                            ) : (
                              <User className="w-10 h-10 p-1 text-gray-500" />
                            )}
                            <div>
                              <p className="font-medium text-gray-800">{tweet.user.fullName || "Unknown User"}</p>
                              <p className="text-xs text-gray-500">@{tweet.user.username || "unknown"}</p>
                            </div>
                          </div>
                          
                          {/* Create a flex container for image and content */}
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <p className="text-gray-800 mb-3">{tweet.content}</p>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm text-gray-600 mt-4">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                {tweet.views || 0}
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageSquare className="w-4 h-4" />
                                {tweet.comments || 0}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {new Date(tweet.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div 
                              className={`px-2 py-1 rounded text-xs ${
                                tweet.isPublished 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {tweet.isPublished ? "Published" : "Unpublished"}
                            </div>
                          </div>
                        </div>
                    
                        <div className="flex gap-2 ml-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => navigate(`/tweet/edit/${tweet.id}`)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem 
                                onSelect={() => handleTogglePublish(tweet.id, 'tweet')}
                              >
                                {tweet.isPublished ? "Unpublish" : "Publish"}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onSelect={() => handleDeleteTweet(tweet.id)}
                                className="text-red-600"
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyContentPage;