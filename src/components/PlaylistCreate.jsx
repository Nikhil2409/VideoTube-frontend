import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: process.env.REACT_APP_SERVER_URL || "http://localhost:3900",
  withCredentials: true,
});
const PlaylistCreationPage = () => {
  const {user} = useAuth();
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [availableVideos, setAvailableVideos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  console.log(user);
  const userId = user?.id;
  console.log("userId:" + userId)
  const playlistsKey = `user_playlists_${userId}`;
  const accessToken = user?.accessToken;
  // Simulate fetching available videos on component mount
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        
        const dashboardVideosResponse = await api.get(`/api/v1/videos/user/id/${userId}`, {
        });
        if (dashboardVideosResponse.data?.videos) {
          setAvailableVideos(dashboardVideosResponse.data?.videos);
        }
      } catch (err) {
        console.error("Error fetching videos:", err);
        setError("Failed to load videos. Please try again later.");
      } 
    };
  
    fetchVideos();
  }, [userId, accessToken]);

  const filteredVideos = availableVideos.filter(video => 
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.channel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRemoveVideo = (id) => {
    setVideos(videos.filter(video => video.id !== id));
  };

  const handleAddVideoToPlaylist = (video) => {
    // Check if video is already in playlist
    if (!videos.some(v => v.id === video.id)) {
      setVideos([...videos, video]);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!playlistName) {
      setError('Please provide a playlist name');
      return;
    }
  
    if (videos.length === 0) {
      setError('Please add at least one video to the playlist');
      return;
    }
  
    try {
      
      // Extract video IDs from the videos array
      const videoIds = videos.map(video => video.id);
      
      // Make API call to create playlist
      const response = await api.post('/api/v1/playlist', {
        name: playlistName,
        description: playlistDescription,
        videoIds: videoIds
      });
      
      // If successful
      if (response.data.statusCode === 201) {
        // Format the new playlist with necessary frontend properties
        const newPlaylist = {
          ...response.data.data,
          coverImage: videos[0]?.thumbnail || '/api/placeholder/480/270'
        };
        
        
        // Reset form
        setPlaylistName('');
        setPlaylistDescription('');
        setVideos([]);
        setError('');
        
        // Show success toast/notification
        toast.success('Playlist created successfully!');
        
        // Navigate back
        navigate(-1);
      }
    } catch (error) {
      // Handle errors
      const errorMessage = error.response?.data?.message || 'Failed to create playlist';
      setError(errorMessage);
      toast.error(errorMessage);
    } 
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8 border-b pb-4">Create New Playlist</h1>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mb-8">
            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-2" htmlFor="playlist-name">
                Playlist Name*
              </label>
              <input
                id="playlist-name"
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="My Awesome Playlist"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-2" htmlFor="playlist-description">
                Description (Optional)
              </label>
              <textarea
                id="playlist-description"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                value={playlistDescription}
                onChange={(e) => setPlaylistDescription(e.target.value)}
                placeholder="Describe your playlist..."
                rows="3"
              />
            </div>
          </div>
          
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Videos</h2>
              <button
                onClick={() => setIsDialogOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add Videos
              </button>
            </div>
            
            {videos.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No videos</h3>
                <p className="mt-1 text-sm text-gray-500">Click "Add Videos" to start building your playlist</p>
              </div>
            ) : (
              <div className="space-y-4">
                {videos.map((video, index) => (
                  <div key={video.id} className="flex items-center bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors">
                    <div className="mr-3 text-gray-500 font-bold">{index + 1}</div>
                    <div className="mr-4 flex-shrink-0">
                      <img 
                        src={video.thumbnail} 
                        alt="Video thumbnail" 
                        className="w-24 h-16 object-cover rounded-md"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{video.title}</h3>
                      <p className="text-sm text-gray-600">{video.channel}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveVideo(video.id)}
                      className="ml-4 text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-4">
            <button
              onClick={handleCreatePlaylist}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors text-lg "
            >
              Create Playlist
            </button>
            <button
              className="bg-red-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors text-lg"
              onClick={() => navigate(-1)}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
      
      {/* Video Selection Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Select Videos
                    </h3>
                    
                    {/* Search input */}
                    <div className="mb-6">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                          </svg>
                        </div>
                        <input
                          type="text"
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Search videos by title or channel"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    {/* Videos grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                      {filteredVideos.map(video => (
                        <div 
                          key={video.id} 
                          className="border border-gray-200 rounded-lg p-3 hover:bg-indigo-50 hover:border-indigo-300 cursor-pointer transition-colors"
                          onClick={() => handleAddVideoToPlaylist(video)}
                        >
                          <div className="relative">
                            <img 
                              src={video.thumbnail} 
                              alt={video.title} 
                              className="w-full h-32 object-cover rounded-md mb-2"
                            />
                            {videos.some(v => v.id === video.id) && (
                              <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                              </div>
                            )}
                          </div>
                          <h4 className="font-medium text-gray-900 line-clamp-2">{video.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{video.channel}</p>
                        </div>
                      ))}
                      
                      {filteredVideos.length === 0 && (
                        <div className="col-span-2 py-8 text-center text-gray-500">
                          No videos found matching your search.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Done
                </button>
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistCreationPage;