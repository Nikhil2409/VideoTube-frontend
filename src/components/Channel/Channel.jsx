import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Users, Heart, MessageSquare, Share2 } from 'lucide-react';
import { Navbar } from "../Navbar.jsx";

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

const Channel = () => {
  const { username } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [activeTab, setActiveTab] = useState('videos');
  const [error, setError] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  
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
        
        // Fetch videos for this channel
        const videosResponse = await api.get(`/api/v1/videos/${response.data.data.username}`);
        setVideos(videosResponse.data.data || DUMMY_VIDEOS);
        console.log("videos");
        
        // Fetch tweets for this channel
        const tweetsResponse = await api.get(`/api/v1/tweets/user/${response.data.data._id}`);
        setTweets(tweetsResponse.data.data || DUMMY_TWEETS);
        console.log("tweets");
      } catch (error) {
        console.error("API error:", error);
        
        // Use dummy data when API fails
        setChannel(DUMMY_CHANNEL);
        setVideos(DUMMY_VIDEOS);
        setTweets(DUMMY_TWEETS);
        
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
        setIsLoading(false);
      }, 5); // Simulate loading delay
    } else if (username) {
      fetchChannelData();
    }
  }, [username]);

  const toggleSubscribe = async () => {
    if (!channel || isSubscribing) return;
    
    setIsSubscribing(true);
    
    try {
      // Update UI optimistically
      setChannel(prev => ({
        ...prev,
        isSubscribed: !prev.isSubscribed,
        subscribersCount: prev.isSubscribed ? prev.subscribersCount - 1 : prev.subscribersCount + 1
      }));
      
      // Call the API to toggle subscription
      const response = await api.post(`/api/v1/subscriptions/c/${channel._id}`);
      
      // If there was an error, revert the UI change
      if (!response.data.success) {
        setChannel(prev => ({
          ...prev,
          isSubscribed: !prev.isSubscribed,
          subscribersCount: !prev.isSubscribed ? prev.subscribersCount - 1 : prev.subscribersCount + 1
        }));
        setError("Failed to update subscription");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      
      // Revert UI change on error
      setChannel(prev => ({
        ...prev,
        isSubscribed: !prev.isSubscribed,
        subscribersCount: !prev.isSubscribed ? prev.subscribersCount - 1 : prev.subscribersCount + 1
      }));
      
      setError(error.response?.data?.message || "Failed to update subscription");
    } finally {
      setIsSubscribing(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

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
        <div className="max-w-4xl mx-auto mt-8">
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
  onClick={toggleSubscribe}
  disabled={isSubscribing}
  className={`px-4 py-2 rounded-md font-medium ${
    isSubscribing ? 'bg-gray-300 text-gray-500' : 
    channel.isSubscribed ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 
    'bg-red-600 text-white hover:bg-red-700'
  }`}
>
  {isSubscribing ? 'Processing...' : channel.isSubscribed ? 'Subscribed' : 'Subscribe'}
</button>
            </div>
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
                onClick={() => setActiveTab('tweets')} 
                className={`flex-1 py-3 font-medium ${activeTab === 'tweets' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'}`}
              >
                Tweets
              </button>
            </div>
            
            {/* Videos Content */}
            {activeTab === 'videos' && (
              <div className="p-4">
                {videos.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No videos found</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {videos.map(video => (
                      <div key={video._id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="relative pt-[56.25%] bg-gray-200">
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
            
            {/* Tweets Content */}
            {activeTab === 'tweets' && (
              <div className="p-4">
                {tweets.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No tweets found</p>
                ) : (
                  <div className="space-y-4">
                    {tweets.map(tweet => (
                      <div key={tweet._id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow transition-shadow">
                        <p className="text-gray-900">{tweet.content}</p>
                        <div className="flex mt-3 text-gray-500 space-x-6">
                          <div className="flex items-center space-x-1 cursor-pointer hover:text-red-500 transition-colors">
                            <Heart size={16} />
                            <span className="text-sm">{tweet.likes || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1 cursor-pointer hover:text-blue-500 transition-colors">
                            <MessageSquare size={16} />
                            <span className="text-sm">{tweet.comments || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1 cursor-pointer hover:text-green-500 transition-colors">
                            <Share2 size={16} />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{new Date(tweet.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Channel;