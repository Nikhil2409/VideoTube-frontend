import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';

const VideoUploadPage = () => {
  const navigate = useNavigate();
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [videoPreview, setVideoPreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  
  const api = axios.create({
    baseURL: process.env.REACT_APP_SERVER_URL || "http://localhost:3900",
    withCredentials: true,
  });
  
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      // Create a preview URL for the video
      const videoURL = URL.createObjectURL(file);
      setVideoPreview(videoURL);
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnail(file);
      // Create a preview URL for the image
      const imageURL = URL.createObjectURL(file);
      setThumbnailPreview(imageURL);
    }
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [videoPreview, thumbnailPreview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!videoFile || !thumbnail || !title.trim() || !description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('videoFile', videoFile);
      formData.append('thumbnail', thumbnail);
      formData.append('title', title);
      formData.append('description', description);
      
      const response = await api.post('/api/v1/videos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });
      
      console.log('Upload successful:', response.data);
      // Redirect to dashboard after successful upload
      navigate('/dashboard');
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.message || 'Failed to upload video. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 py-12">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-10">
        <button 
          onClick={() => navigate(-1)} 
          className="bg-white/80 hover:bg-white transition-colors rounded-full p-2 shadow-md flex items-center justify-center"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Upload New Video</h1>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-8 border border-blue-100">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                {/* Title Input */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                    Title *
                  </label>
                  <input
                    id="title"
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 transition-all"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter video title"
                    required
                  />
                </div>

                {/* Description Input */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-blue-200 transition-all"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter video description"
                    required
                  />
                </div>

                {/* Video File Input */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="video">
                    Video File *
                  </label>
                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center bg-blue-50">
                    <input
                      id="video"
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleVideoChange}
                      required
                    />
                    <label htmlFor="video" className="cursor-pointer">
                      {videoFile ? (
                        <div className="flex items-center justify-center flex-col">
                          <span className="text-sm text-gray-600 mb-2">
                            Selected: {videoFile.name}
                          </span>
                          {videoPreview && (
                            <video 
                              className="max-h-40 rounded-lg mt-2 shadow-md" 
                              src={videoPreview} 
                              controls 
                            />
                          )}
                          <button 
                            type="button"
                            className="mt-3 text-blue-600 hover:text-blue-800 font-medium"
                            onClick={() => {
                              setVideoFile(null);
                              setVideoPreview(null);
                            }}
                          >
                            Change Video
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                          </svg>
                          <span className="mt-2 text-sm text-gray-500">
                            Click to select a video file
                          </span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Thumbnail Input */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="thumbnail">
                    Thumbnail Image *
                  </label>
                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center bg-blue-50">
                    <input
                      id="thumbnail"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleThumbnailChange}
                      required
                    />
                    <label htmlFor="thumbnail" className="cursor-pointer">
                      {thumbnail ? (
                        <div className="flex items-center justify-center flex-col">
                          <span className="text-sm text-gray-600 mb-2">
                            Selected: {thumbnail.name}
                          </span>
                          {thumbnailPreview && (
                            <img 
                              className="max-h-40 rounded-lg mt-2 shadow-md" 
                              src={thumbnailPreview} 
                              alt="Thumbnail preview" 
                            />
                          )}
                          <button 
                            type="button"
                            className="mt-3 text-blue-600 hover:text-blue-800 font-medium"
                            onClick={() => {
                              setThumbnail(null);
                              setThumbnailPreview(null);
                            }}
                          >
                            Change Thumbnail
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          <span className="mt-2 text-sm text-gray-500">
                            Click to select a thumbnail image
                          </span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Upload Guidelines */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 shadow-sm">
                  <h3 className="font-medium text-blue-800 mb-2">Upload Guidelines</h3>
                  <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
                    <li>Video files should be in MP4, MOV, or AVI format</li>
                    <li>Maximum file size: 500MB</li>
                    <li>Thumbnails should be in JPG or PNG format</li>
                    <li>Recommended thumbnail size: 1280×720 pixels</li>
                    <li>Include a descriptive title and detailed description</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Upload Progress */}
            {isLoading && (
              <div className="mt-6">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-center mt-1 text-gray-600">{progress}% Uploaded</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 transition-colors shadow-md hover:shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? 'Uploading...' : 'Upload Video'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VideoUploadPage;