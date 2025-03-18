import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, Heart, MessageSquare, Share2, Eye } from 'lucide-react';
import { Navbar } from "../Navbar.jsx";
import { useAuth } from "../../context/AuthContext.jsx"
import { set } from 'date-fns';
import { List } from 'lucide-react';
import { Sidebar } from "../Sidebar";

// Dummy data that will be used if API calls fail
const DUMMY_CHANNEL = {
  _id: "user123",
  username: "techcreator",
  fullName: "Tech Creator",
  avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  coverImage: "https://images.unsplash.com/photo-1594732832278-abd644401426",
  subscribersCount: 5420,
  channelsSubscribedToCount: 28,
  isSubscribed: false
};

const DUMMY_VIDEOS = [
  {
    _id: "vid1",
    title: "How to Build a React App in 10 Minutes",
    thumbnail: "https://images.unsplash.com/photo-1587620962725-abab7fe55159",
    views: 1204,
    createdAt: "2024-02-15T12:00:00Z"
  },
  {
    _id: "vid2",
    title: "MongoDB for Beginners: Complete Tutorial",
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
    views: 3782,
    createdAt: "2024-02-10T14:30:00Z"
  },
  {
    _id: "vid3",
    title: "Advanced JavaScript Patterns You Should Know",
    thumbnail: "https://images.unsplash.com/photo-1579403124614-197f69d8187b",
    views: 2159,
    createdAt: "2024-02-05T09:15:00Z"
  },
  {
    _id: "vid4",
    title: "Creating Responsive Layouts with Tailwind CSS",
    thumbnail: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4",
    views: 958,
    createdAt: "2024-01-28T16:45:00Z"
  }
];

const DUMMY_TWEETS = [
  {
    _id: "tweet1",
    content: "Just launched my new course on building APIs with Node.js and Express! Check it out on my channel 🚀",
    likes: 42,
    comments: 7,
    createdAt: "2024-02-18T10:30:00Z"
  },
  {
    _id: "tweet2",
    content: "What tech stack are you currently learning? I'm diving deeper into Next.js and really enjoying it so far!",
    likes: 28,
    comments: 15,
    createdAt: "2024-02-15T15:20:00Z"
  },
  {
    _id: "tweet3",
    content: "Working on a new video about performance optimization in React applications. Any specific topics you'd like me to cover?",
    likes: 35,
    comments: 22,
    createdAt: "2024-02-12T09:10:00Z"
  }
];

const DUMMY_PLAYLISTS = [
  {
    _id: "playlist1",
    name: "React Tutorials",
    description: "A collection of tutorials for learning React.js from scratch",
    thumbnail: "https://images.unsplash.com/photo-1556740749-887f6717d7e4",
    videos: [
      {
        _id: "vid1",
        title: "How to Build a React App in 10 Minutes", 
        thumbnail: "https://images.unsplash.com/photo-1587620962725-abab7fe55159"
      },
      {
        _id: "vid2",
        title: "React Hooks Crash Course",
        thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c"
      },
      {
        _id: "vid3",
        title: "Advanced React Patterns and Techniques",
        thumbnail: "https://images.unsplash.com/photo-1579403124614-197f69d8187b"
      }
    ]
  },
];

const Channel = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const {user} = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [owner, setOwner] = useState(null);
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [activeTab, setActiveTab] = useState('videos');
  const [error, setError] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribers, setSubscribers] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
  const toggleSidebar = () => {
    setIsSidebarVisible((prev) => !prev);
  };
  
  const api = axios.create({
    baseURL: "http://localhost:3900",
    withCredentials: true,
  });

  useEffect(() => {
    const fetchChannelData = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // Fetch channel profile
        const response = await api.get(`/api/v1/users/c/${username}`);
        setChannel(response.data.data);
        console.log("channel");
        console.log(response);
        setIsSubscribed(response.data.data.isSubscribed);
        setSubscribers(response.data.data.subscribersCount);
        setOwner(response.data.data.id);
        const accessToken = username.accessToken;
        // Fetch videos for this channel
        const videoResponse = await api.get(`/api/v1/videos/user/${username}`,{
        });
        setVideos(videoResponse.data.videos || DUMMY_VIDEOS);
        console.log("videos");
        
        const tweetsResponse = await api.get(`/api/v1/tweets/user/${response.data.data.id}`);
        console.log(tweetsResponse);
        
        // Extract tweet data
        const tweetdata = tweetsResponse.data.data || tweetsResponse.data.tweets;
        
        // Map tweets and fetch comments for each
        const tweetsWithComments = await Promise.all(
          tweetdata.map(async (tweet) => {
            const commentsResponse = await api.get(`/api/v1/comments/tweet/${tweet.id}`);
            console.log(commentsResponse);
            const comments = commentsResponse.data.data.comments;
            
            // Return the tweet with an added comments count property
            return {
              ...tweet,
              comments: comments?.length || 0
            };
          })
        );
        
        setTweets(tweetsWithComments || DUMMY_TWEETS);
        console.log(tweets);
        const playlistResponse = await api.get(`/api/v1/playlist/user/${response.data.data.id}`);
        setPlaylists(playlistResponse.data.data || DUMMY_PLAYLISTS);

        console.log(playlistResponse);
      } catch (error) {
        console.error("API error:", error);
        
        // Use dummy data when API fails
        setChannel(DUMMY_CHANNEL);
        setVideos(DUMMY_VIDEOS);
        setTweets(DUMMY_TWEETS);
        setPlaylists(DUMMY_PLAYLISTS);
        
        // Still show the error for debugging
        setError("Using dummy data: " + (error.response?.data?.message || 'Failed to fetch channel'));
      } finally {
        setIsLoading(false);
      }
    };

    // Skip API calls altogether and use dummy data directly for testing
    const useDummyData = false; // Set to false when you want to try the real API
    
    if (useDummyData) {
      setTimeout(() => {
        setChannel(DUMMY_CHANNEL);
        setVideos(DUMMY_VIDEOS);
        setTweets(DUMMY_TWEETS);
        setPlaylists(DUMMY_PLAYLISTS);
        setIsLoading(false);
      }, 5); // Simulate loading delay
    } else if (username) {
      fetchChannelData();
    }
  },[username]);

  const handleSubscribe = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    if (!owner || isSubscribing) return;
    
    setIsSubscribing(true);
    
    try {
      const accessToken = user.accessToken;
      const response = await api.post(`/api/v1/subscriptions/c/${owner}`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      // Update subscription state based on the server response
      if (response.data.success) {
        // The backend now tells us explicitly if we're subscribed or not
        const newSubscriptionState = response.data.data.subscribed;
        
        // Update local state
        setIsSubscribed(newSubscriptionState);
        
        // Update subscriber count
        setSubscribers(prev => newSubscriptionState ? prev + 1 : Math.max(0, prev - 1));
        
        // Update channel object consistently
        setChannel(prevChannel => ({
          ...prevChannel,
          isSubscribed: newSubscriptionState,
          subscribersCount: newSubscriptionState ? 
            prevChannel.subscribersCount + 1 : 
            Math.max(0, prevChannel.subscribersCount - 1)
        }));
        
        console.log(`${newSubscriptionState ? 'Subscribed' : 'Unsubscribed'} successfully`);
      }
    } catch (error) {
      console.error("Error toggling subscription:", error);
      setError("Failed to update subscription status");
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-gray-50 to-blue-50">
       <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} />
       <div 
         className={`flex flex-col flex-1`}
       >
         <Navbar
           toggleSidebar={toggleSidebar}
         />

        {isLoading && (
          <div className="flex justify-center items-center mt-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="max-w-4xl mx-auto mt-8 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

{channel && (
  <div className={`max-w-4xl mx-auto mt-8 mb-8 container px-4 py-6 overflow-auto transition-all duration-300`}>
            {/* Channel Header with Cover Image */}
            <div className="relative">
              <div className="h-48 bg-gray-300 rounded-t-lg overflow-hidden">
                {channel.coverImage ? (
                  <img 
                    src={channel.coverImage} 
                    alt="Cover" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
                )}
              </div>
              
              <div className="absolute bottom-0 left-4 transform translate-y-1/2">
                <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-white">
                  {channel.avatar ? (
                    <img 
                      src={channel.avatar} 
                      alt={channel.fullName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                      <Users size={32} className="text-gray-500" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Channel Info */}
            <div className="bg-white rounded-b-lg shadow-md p-4 pt-16">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold">{channel.fullName}</h1>
                  <p className="text-gray-600">@{channel.username}</p>
                  <div className="flex items-center mt-2 space-x-4">
                    <div className="text-sm">
                      <span className="font-bold">{channel.subscribersCount}</span> subscribers
                    </div>
                    <div className="text-sm">
                      <span className="font-bold">{channel.channelsSubscribedToCount}</span> subscriptions
                    </div>
                  </div>
                </div>
                
                <button 
                    onClick={handleSubscribe}
                    disabled={isSubscribing}
                    className={`px-4 py-2 rounded-md font-medium ${
                      isSubscribing ? 'bg-gray-300 text-gray-500' : 
                      isSubscribed ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 
                      'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {isSubscribing ? 'Processing...' : isSubscribed ? 'Subscribed' : 'Subscribe'}
                  </button>
            </div>
            
            {/* Tabs */}
            <div className="bg-white mt-4 rounded-lg shadow-md">
              <div className="flex border-b">
                <button 
                  onClick={() => setActiveTab('videos')} 
                  className={`flex-1 py-3 font-medium ${activeTab === 'videos' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Videos
                </button>
                <button 
                  onClick={() => setActiveTab('playlists')} 
                  className={`flex-1 py-3 font-medium ${activeTab === 'playlists' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Playlists
                </button>
                <button 
                  onClick={() => setActiveTab('tweets')} 
                  className={`flex-1 py-3 font-medium ${activeTab === 'tweets' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Tweets
                </button>
                </div>
              </div>
              
              {/* Tab Content Container with fixed exact height */}
              <div className="h-96 overflow-y-auto">
                {/* Videos Content */}
                {activeTab === 'videos' && (
                  <div className="p-4">
                    {videos.length === 0 ? (
                      <div className="flex justify-center items-center h-80">
                        <p className="text-center text-gray-500">No videos found</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {videos.map(video => (
                          <div key={video._id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="relative pt-[56.25%] bg-gray-200" onClick={() => navigate(`/video/${video.id}`)}>
                              {video.thumbnail ? (
                                <img 
                                  src={video.thumbnail} 
                                  alt={video.title} 
                                  className="absolute inset-0 w-full h-full object-cover" 
                                />
                              ) : (
                                <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                                  <span className="text-gray-400">No thumbnail</span>
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <h3 className="font-medium text-gray-900 line-clamp-2">{video.title}</h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {video.views?.toLocaleString() || 0} views • {new Date(video.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Playlists Content */}
                {activeTab === 'playlists' && (
                  <div className="p-4">
                    {playlists.length === 0 ? (
                      <div className="flex justify-center items-center h-80">
                        <p className="text-center text-gray-500">No playlists found</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {playlists.map(playlist => (
                          <div key={playlist.id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="relative pt-[56.25%] bg-gray-200" onClick={() => navigate(`/playlist/${playlist.id}/false`)}>
                              {playlist.user.avatar ? (
                                <img 
                                  src={playlist.user.avatar} 
                                  alt={playlist.name} 
                                  className="absolute inset-0 w-full h-full object-cover" 
                                />
                              ) : (
                                <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                                  <List size={32} className="text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <h3 className="font-medium text-gray-900 line-clamp-2">{playlist.name}</h3>
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{playlist.description}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {playlist.videos.length} videos
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tweets Content */}
                {activeTab === 'tweets' && (
                  <div className="p-4">
                    {tweets.length === 0 ? (
                      <div className="flex justify-center items-center h-80">
                        <p className="text-center text-gray-500">No tweets found</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tweets.map(tweet => (
                          <div 
                            key={tweet.id} 
                            className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => navigate(`/tweet/${tweet.id}`)}
                          >
                            <div className="relative pt-[56.25%] bg-gray-200" onClick={() => navigate(`/tweet/${tweet.id}`)}>
                              {tweet.image ? (
                                <img 
                                  src={tweet.user.avatar} 
                                  className="absolute inset-0 w-full h-full object-cover" 
                                />
                              ) : (
                                <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                                  <span className="text-gray-400">No thumbnail</span>
                                </div>
                              )}
                            </div>
                            {/* Tweet Content */}
                            <div className="p-3">
                              <p className="text-gray-900 line-clamp-3">{tweet.content}</p>
                            </div>
                
                            {/* Tweet Metadata */}
                            <div className="flex justify-between items-center px-3 pb-3 text-gray-500 text-sm">
                              <span>{new Date(tweet.createdAt).toLocaleDateString()}</span>
                              <div className="flex space-x-4">
                                <div className="flex items-center space-x-1 hover:text-red-500 transition-colors">
                                  <Eye size={16} />
                                  <span>{tweet.views || 0}</span>
                                </div>
                                <div className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
                                  <MessageSquare size={16} />
                                  <span>{tweet.comments || 0}</span>
                                </div>
                                <div className="flex items-center space-x-1 hover:text-green-500 transition-colors">
                                  <Share2 size={16} />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Channel;