import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const api = axios.create({
  baseURL: "http://localhost:3900",
  withCredentials: true,
});

const PlaylistView = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const accessToken = user?.accessToken;
  const { playlistId } = useParams();
  let { canEdit } = useParams();
  canEdit = canEdit === "true";

  const navigate = useNavigate();
  
  const [playlist, setPlaylist] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [isAddVideoDialogOpen, setIsAddVideoDialogOpen] = useState(false);
  const [availableVideos, setAvailableVideos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Extract video fetching logic into a separate function
  const fetchAvailableVideos = async () => {
    if (!userId) return; 
    
    try {
      const dashboardVideosResponse = await api.get(`/api/v1/videos/user/id/${userId}`, {
      });
      if (dashboardVideosResponse.data?.data?.videos) {
        setAvailableVideos(dashboardVideosResponse.data.data.videos);
      }
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError("Failed to load videos. Please try again later.");
    } 
  };

  useEffect(() => {
    fetchAvailableVideos();
  }, [userId, accessToken]); 

  // Fetch playlist from API
  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        setLoading(true);

        const response = await api.get(`/api/v1/playlist/${playlistId}`, {
          });
        
        // Update state with response data
        const data = response.data.data;

        
        // Update state
        setPlaylist(data);
        setEditedName(data.name);
        setEditedDescription(data.description || '');
      } catch (error) {
        console.error('Error fetching playlist:', error);
        setError('Failed to load playlist. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (playlistId) {
      fetchPlaylist();
    }
  }, [playlistId, navigate, accessToken]);

  // Get videos that are not in the playlist already
  const getAvailableVideosNotInPlaylist = () => {
    if (!playlist || !playlist.videos) return availableVideos;
    
    // Filter out videos that are already in the playlist
    return availableVideos.filter(video => {
      return !playlist.videos.some(playlistVideo => playlistVideo.id === video.id);
    });
  };

  const handleSavePlaylist = async () => {
    if (!editedName) {
      setError('Playlist name cannot be empty');
      return;
    }

    try {
      const updatedPlaylistData = {
        name: editedName,
        description: editedDescription
      };
      
      // Send update to API using PATCH
      await api.patch(`/api/v1/playlist/${playlistId}`, updatedPlaylistData, {
      });
      
      // Fetch fresh data from API to ensure consistency
      const response = await api.get(`/api/v1/playlist/${playlistId}`, {
      });
      
      const updatedPlaylist = response.data.data;
      
      setPlaylist(updatedPlaylist);
      setEditMode(false);
      setError('');
    } catch (error) {
      console.error('Error updating playlist:', error);
      setError('Failed to update playlist. Please try again later.');
    }
  };

  const handleDeletePlaylist = async () => {
    if (!window.confirm('Are you sure you want to delete this playlist?')) {
      return;
    }

    try {
      // Send delete request to API
      await api.delete(`/api/v1/playlist/${playlistId}`, {
      });
    
      // Navigate back to playlists page
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting playlist:', error);
      setError('Failed to delete playlist. Please try again later.');
    }
  };

  const handleTogglePrivacy = async () => {
    try {
      const newIsPublic = !playlist.isPublic;
      
      // Send update to API
      await api.patch(`/api/v1/playlist/${playlistId}`, { isPublic: newIsPublic }, {
      });
      
      // Fetch fresh data from API to ensure consistency
      const response = await api.get(`/api/v1/playlist/${playlistId}`, {
      });
      
      const updatedPlaylist = response.data.data;
      setPlaylist(updatedPlaylist);
      
    } catch (error) {
      console.error('Error toggling playlist privacy:', error);
      setError('Failed to update playlist privacy. Please try again later.');
    }
  };

  const handleAddVideoToPlaylist = async (video) => {
    // Check if video is already in playlist
    if (playlist.videos && playlist.videos.some(v => v.id === video.id)) {
      return;
    }

    try {
      // Send request to API using the correct route
      await api.patch(`/api/v1/playlist/add/${video.id}/${playlistId}`, {}, {
      });
      
      // Fetch fresh data after modification
      const response = await api.get(`/api/v1/playlist/${playlistId}`, {
      });
      
      const updatedPlaylist = response.data.data;
      
      // Update state
      setPlaylist(updatedPlaylist);
      setIsAddVideoDialogOpen(false);
    } catch (error) {
      console.error('Error adding video to playlist:', error);
      setError('Failed to add video to playlist. Please try again later.');
    }
  };

  const handleRemoveVideo = async (videoId) => {
    if (!canEdit) {
      // Don't allow removal if not in edit mode
      return;
    }
    
    try {
      // Send request to API using the correct route
      await api.patch(`/api/v1/playlist/remove/${videoId}/${playlistId}`, {}, {
      });
      
      // Fetch fresh data after modification
      const response = await api.get(`/api/v1/playlist/${playlistId}`, {
      });
      
      const updatedPlaylist = response.data.data;
      
      // Update state
      setPlaylist(updatedPlaylist);
      
      fetchAvailableVideos();
    } catch (error) {
      console.error('Error removing video from playlist:', error);
      setError('Failed to remove video from playlist. Please try again later.');
    }
  };
  
  const handleOpenAddVideoDialog = () => {
    fetchVideosNotInPlaylist(); 
    setIsAddVideoDialogOpen(true);
  };

  // For drag and drop functionality
  const handleDragStart = (e, index) => {
    if (!canEdit) return; // Only allow drag if in edit mode
    e.dataTransfer.setData('videoIndex', index.toString());
  };

  const handleDrop = async (e, dropIndex) => {
    if (!canEdit) return; // Only allow drop if in edit mode
    
    const dragIndex = parseInt(e.dataTransfer.getData('videoIndex'));
    if (dragIndex === dropIndex) return;

    const updatedVideos = [...playlist.videos];
    const draggedVideo = updatedVideos[dragIndex];
    
    // Remove the dragged item
    updatedVideos.splice(dragIndex, 1);
    // Insert at the new position
    updatedVideos.splice(dropIndex, 0, draggedVideo);

    // Since reordering isn't implemented in the backend, we'll just update the local state for now
    const updatedPlaylist = {
      ...playlist,
      videos: updatedVideos
    };
    
    // Update state
    setPlaylist(updatedPlaylist);
    
    // Note: A proper implementation would send this reordering to the backend
    setError('Reordering saved locally. Refresh will revert to original order.');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 py-8 px-4 sm:px-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading playlist...</p>
        </div>
      </div>
    );
  }

  if (error && !playlist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 py-8 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Playlist</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
            onClick={() => navigate('/dashboard')}
          >
            Back to Playlists
          </button>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 py-8 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Playlist Not Found</h2>
          <p className="text-gray-600 mb-6">The playlist you're looking for doesn't exist or has been deleted.</p>
          <button 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
            onClick={() => navigate('/dashboard')}
          >
            Back to Playlists
          </button>
        </div>
      </div>
    );
  }

  const videos = playlist.videos || [];

  const fetchVideosNotInPlaylist = async () => {
    if (!userId || !playlistId) return;
    
    try {
      setLoading(true);
      
      // Make API call to get videos not in the playlist
      const response = await api.get(`/api/v1/videos/user/${userId}/not-in-playlist/${playlistId}`, {
      });
      
      if (response.data?.data?.videos) {
        setAvailableVideos(response.data.data.videos);
      } else {
        setAvailableVideos([]);
      }
      
      setError('');
    } catch (err) {
      console.error("Error fetching available videos:", err);
      setError("Failed to load videos. Please try again later.");
      setAvailableVideos([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header with back button */}
          <div className="p-4 border-b">
            <button
              className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
              onClick={() => navigate(-1)}
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              Back 
            </button>
          </div>
          
          {/* Playlist Detail */}
          <div>
            {/* Header */}
            <div className="p-6 border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              {editMode && canEdit ? (
                <div>
                  {error && (
                    <div className="bg-red-800 bg-opacity-50 border border-red-300 text-white px-4 py-3 rounded mb-4">
                      {error}
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <label className="block font-bold mb-2">
                      Playlist Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white text-gray-900"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block font-bold mb-2">
                      Description
                    </label>
                    <textarea
                      className="w-full px-4 py-2 border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white text-gray-900"
                      rows="3"
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                    ></textarea>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      className="px-4 py-2 bg-white text-indigo-600 rounded-md hover:bg-indigo-50 font-medium"
                      onClick={handleSavePlaylist}
                    >
                      Save Changes
                    </button>
                    <button
                      className="px-4 py-2 bg-transparent border border-white text-white rounded-md hover:bg-white hover:bg-opacity-10 font-medium"
                      onClick={() => {
                        setEditMode(false);
                        setEditedName(playlist.name);
                        setEditedDescription(playlist.description || '');
                        setError('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{playlist.name}</h2>
                    {playlist.description && (
                      <p className="text-indigo-100">{playlist.description}</p>
                    )}
                    <p className="text-sm text-indigo-200 mt-2">
                      {videos.length} videos • {playlist.isPublic ? 'Public' : 'Private'} playlist
                    </p>
                  </div>
                  {canEdit && ( // Only show edit buttons if in edit mode
                    <div className="flex gap-3">
                      <button
                        className="p-2 hover:bg-white hover:bg-opacity-10 rounded-full"
                        onClick={() => setEditMode(true)}
                        title="Edit Playlist"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                        </svg>
                      </button>
                      <button
                        className="p-2 hover:bg-white hover:bg-opacity-10 rounded-full"
                        onClick={handleTogglePrivacy}
                        title={playlist.isPublic ? "Make Private" : "Make Public"}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          {playlist.isPublic ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path>
                          )}
                        </svg>
                      </button>
                      <button
                        className="p-2 hover:bg-white hover:bg-opacity-10 rounded-full"
                        onClick={handleDeletePlaylist}
                        title="Delete Playlist"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Videos List */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Videos in this playlist</h3>
                {canEdit && ( // Only show add video button if in edit mode
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
                    onClick={handleOpenAddVideoDialog}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Add Video
                  </button>
                )}
              </div>
              
              {videos.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                  <p className="text-lg font-medium">No videos added yet</p>
                  {canEdit && (
                    <p className="mt-1">Click 'Add Video' to start building your playlist</p>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {videos.map((video, index) => (
                    <div 
                      key={video.id}
                      className="py-4 flex items-center"
                      draggable={canEdit} // Only draggable if in edit mode
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragOver={handleDragOver}
                    >
                      {canEdit && ( // Only show drag handle if in edit mode
                        <div className="flex items-center mr-4 text-gray-400 cursor-grab">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16"></path>
                          </svg>
                        </div>
                      )}
                      <div className="mr-4 w-32 flex-shrink-0">
                        <img src={video.thumbnail} alt="" className="w-full rounded-md" />
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-medium text-gray-900">{video.title}</h4>
                        <p className="text-sm text-gray-600">{video.owner || "Unknown Channel"}</p>
                      </div>
                      {canEdit && ( // Only show remove button if in edit mode
                        <button 
                          className="ml-4 p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                          onClick={() => handleRemoveVideo(video.id)}
                          title="Remove from playlist"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Video Dialog - Modified to show only videos not in playlist */}
      {isAddVideoDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-screen overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Add Video to Playlist</h3>
              <button 
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
                onClick={() => {
                  setIsAddVideoDialogOpen(false);
                  setSearchTerm('');
                }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="p-6 border-b">
              <div className="relative">
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Search videos by title or channel..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto p-6">
              {availableVideos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg font-medium">All available videos are already in your playlist</p>
                  <p className="mt-1">Upload more videos or create a new playlist</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {availableVideos
                    .filter(video => 
                      video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (video.owner && video.owner.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map(video => (
                      <div 
                        key={video.id} 
                        className="flex border rounded-lg overflow-hidden hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => handleAddVideoToPlaylist(video)}
                      >
                        <div className="w-1/3 flex-shrink-0">
                          <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="w-2/3 p-3 flex flex-col">
                          <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">{video.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{video.owner || "Unknown Channel"}</p>
                          <div className="mt-auto">
                            <button
                              className="w-full py-1 px-2 rounded text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                              Add to Playlist
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg"
                onClick={() => {
                  setIsAddVideoDialogOpen(false);
                  setSearchTerm('');
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistView;