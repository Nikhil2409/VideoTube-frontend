import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../Navbar';
import { Sidebar } from '../Sidebar';
import { ListVideo, Play } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Button } from '../ui/button';

function LikedVideosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [likedVideos, setLikedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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
          channelName: video.channelName || 'Unknown Channel',
          views: video.views || 0,
          likedAt: new Date(video.likedAt || Date.now())
        }));
        
        setLikedVideos(formattedVideos);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch liked videos', error);
        toast.error('Failed to load liked videos');
        setLoading(false);
      }
    };

    fetchLikedVideos();
  }, [user, navigate]);

  const filteredVideos = likedVideos.filter(video => 
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="p-6 flex-1 overflow-auto">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <ListVideo className="mr-3 text-blue-600" /> Liked Videos
              </h1>
              <Button 
                onClick={() => navigate("/")}
                className="flex items-center gap-2"
              >
                Explore Videos
              </Button>
            </div>

            <div className="mb-6">
              <input 
                type="text" 
                placeholder="Search liked videos..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

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
                        {video.likedAt.toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 truncate">
                        {video.title}
                      </h3>
                      
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <span>{video.channelName}</span>
                          <span className="px-1">•</span>
                          <span>{video.views.toLocaleString()} Views</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LikedVideosPage;