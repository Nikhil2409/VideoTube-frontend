import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../Navbar';
import { Sidebar } from '../Sidebar';
import { ListVideo, Play, MessageSquare, Eye, Clock, User } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";

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

function LikedContentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [likedVideos, setLikedVideos] = useState([]);
  const [likedTweets, setLikedTweets] = useState([]);
  const [loading, setLoading] = useState({ videos: true, tweets: true });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("videos");
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarVisible((prev) => !prev);
  };

  const api = axios.create({
    baseURL: "http://localhost:3900",
    withCredentials: true,
    headers: {
      Authorization: `Bearer ${user?.accessToken}`
    }
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchLikedVideos = async () => {
      try {
        const response = await api.get('/api/v1/likes/videos');
        const fetchedLikedVideos = response.data.data || [];
        
        const formattedVideos = fetchedLikedVideos.map(video => ({
          id: video.id,
          title: video.title,
          thumbnail: video.thumbnail || '/api/placeholder/300/200',
          views: video.views || 0,
          likedAt: new Date(video.likedAt || Date.now()),
          duration: video.duration
        }));
        
        setLikedVideos(formattedVideos);
        setLoading(prev => ({ ...prev, videos: false }));
      } catch (error) {
        console.error('Failed to fetch liked videos', error);
        toast.error('Failed to load liked videos');
        setLoading(prev => ({ ...prev, videos: false }));
      }
    };

    const fetchLikedTweets = async () => {
      try {
        const response = await api.get('/api/v1/likes/tweets');
        const fetchedLikedTweets = response.data.data || [];
        console.log('Liked tweets response:', response);
    
        const tweetsWithComments = await Promise.all(
          fetchedLikedTweets.map(async (tweet) => {
            const commentsResponse = await api.get(`/api/v1/comments/tweet/${tweet.id}`);
            console.log('Comments response:', commentsResponse);
            const comments = commentsResponse.data.data.comments;
            
            // Return the tweet with an added commentCount property
            return {
              ...tweet,
              comments: comments.length
            };
          })
        );
        
        const formattedTweets = tweetsWithComments.map(tweet => ({
          id: tweet.id,
          content: tweet.content,
          image: tweet.image,
          views: tweet.views || 0,
          comments: tweet.comments || 0,
          likedAt: new Date(tweet.likedAt || Date.now()),
          createdAt: new Date(tweet.createdAt || Date.now()),
          owner: tweet.owner  // Preserve the owner information
        }));
        
        console.log('Formatted tweets:', formattedTweets);
        setLikedTweets(formattedTweets);
        setLoading(prev => ({ ...prev, tweets: false }));
      } catch (error) {
        console.error('Failed to fetch liked tweets', error);
        toast.error('Failed to load liked tweets');
        setLoading(prev => ({ ...prev, tweets: false }));
      }
    };

    fetchLikedVideos();
    fetchLikedTweets();
  }, [user, navigate]);
  
  const handleTweetClick = (tweetId) => {
    navigate(`/tweet/${tweetId}`);
  };

  const filteredVideos = likedVideos.filter(video => 
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTweets = likedTweets.filter(tweet => 
    tweet.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  <h1 className="text-3xl font-bold text-gray-800">Liked Content</h1>
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
                  onClick={() => navigate("/")}
                  className="flex items-center gap-2"
                >
                  Explore {activeTab === "videos" ? "Videos" : "Tweets"}
                </Button>
              </div>

              <div className="mb-6">
                <Input 
                  placeholder={`Search liked ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>

              <TabsContent value="videos">
                {filteredVideos.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Play className="mx-auto mb-4 w-16 h-16 text-blue-300" />
                    <p>No liked videos found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVideos.map((video) => (
                      <div 
                        key={video.id} 
                        className="bg-white border rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer"
                        onClick={() => navigate(`/video/${video.id}`)}
                      >
                        <div className="relative">
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
                          
                          <div className="flex justify-between items-center text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              <span>{video.views.toLocaleString()} Views</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Liked {video.likedAt.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="tweets">
  {filteredTweets.length === 0 ? (
    <div className="text-center py-12 text-gray-500">
      <MessageSquare className="mx-auto mb-4 w-16 h-16 text-blue-300" />
      <p>No liked tweets found.</p>
    </div>
  ) : (
    <div className="grid grid-cols-1 gap-4">
      {filteredTweets.map((tweet) => (
        <div 
        onClick={() => handleTweetClick(tweet.id)}
        key={tweet.id} 
        className="bg-white border rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all p-4"
      >
        <div className="flex flex-col">
          {/* User info header */}
          <div className="flex items-center gap-3 mb-3">
            {tweet?.owner ? (
              <div className="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden">
                <img
                  src={tweet.owner.avatar}
                  alt={tweet.owner.fullName || "Creator"}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : (
              <User className="w-10 h-10 p-1 text-gray-500" />
            )}
            <div>
              <p className="font-medium text-gray-800">{tweet?.owner?.fullName || "Unknown User"}</p>
              <p className="text-xs text-gray-500">@{tweet?.owner?.username || "unknown"}</p>
            </div>
          </div>
          
          {/* Tweet content */}
          <div className="mb-3">
            <p className="text-gray-800">{tweet.content}</p>
            {tweet.image && (
              <img 
                src={tweet.image} 
                alt="Tweet image" 
                className="mt-2 rounded-lg max-h-64 object-cover"
              />
            )}
          </div>
          
          {/* Tweet stats */}
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {tweet.views.toLocaleString()}
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {tweet.comments.toLocaleString()}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {tweet.createdAt.toLocaleDateString()}
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Liked {tweet.likedAt.toLocaleDateString()}
            </div>
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

export default LikedContentPage;