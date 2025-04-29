import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Send, X, Image, Loader2, ArrowLeft } from 'lucide-react';


const api = axios.create({
    baseURL: process.env.REACT_APP_SERVER_URL || "http://localhost:3900",
    withCredentials: true,
});

const CreateTweetPage = () => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const maxCharCount = 280;
  const remainingChars = maxCharCount - content.length;
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (content.trim() === '') {
      setError('Tweet cannot be empty');
      return;
    }
    
    if (content.length > maxCharCount) {
      setError(`Tweet is too long (${content.length}/${maxCharCount})`);
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Create form data for text and possible image
      const formData = new FormData();
      formData.append('content', content);
      if (image) {
        formData.append('image', image);
      }
      
      // Better debugging of FormData
      console.log("Content being sent:", content);
      console.log("Image being sent:", image ? image.name : "No image");
      
      // Send the tweet data to your API
      const response = await api.post('/api/v1/tweets', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log("Response from server:", response.data);
      
      // Navigate based on your API response structure
      // Assuming your ApiResponse structure returns data.data
      if (response.data && response.data.data) {
        navigate(`/tweet/${response.data.data.id}`);
      } else {
        // Fallback to home page if response structure is different
        navigate('/');
      }
    } catch (err) {
      console.error('Error creating tweet:', err);
      console.error('Error response:', err.response?.data);
      
      // Handle error message based on your API error structure
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to create tweet. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto mt-8 p-4">
        <div className="absolute top-4 left-4 z-10">
        <button 
          onClick={() => navigate(-1)} 
          className="bg-white/80 hover:bg-white transition-colors rounded-full p-2 shadow-md flex items-center justify-center"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h1 className="text-xl font-bold text-center">Create Tweet</h1>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-4">
            <textarea
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              placeholder="What's happening?"
              rows="5"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={maxCharCount + 10} // Allow slight overflow to show error
              disabled={isSubmitting}
            ></textarea>
            
            {/* Character counter */}
            <div className={`text-right text-sm mt-2 ${remainingChars < 0 ? 'text-red-500' : remainingChars < 20 ? 'text-yellow-500' : 'text-gray-500'}`}>
              {remainingChars} characters remaining
            </div>
            
            {/* Image preview */}
            {imagePreview && (
              <div className="mt-3 relative">
                <div className="rounded-lg overflow-hidden">
                  <img 
                    src={imagePreview} 
                    alt="Tweet attachment preview" 
                    className="max-h-64 max-w-full object-contain"
                  />
                </div>
                <button 
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            
            {/* Error message */}
            {error && (
              <div className="mt-3 text-red-500 text-sm">
                {error}
              </div>
            )}
          </div>
          
          <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center">
            {/* Image upload button */}
            <label className="cursor-pointer text-blue-500 hover:text-blue-600 flex items-center">
              <Image size={20} />
              <span className="ml-2">Add Image</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
                className="hidden" 
                disabled={isSubmitting}
              />
            </label>
            
            {/* Tweet button */}
            <button
              type="submit"
              disabled={isSubmitting || content.trim() === '' || remainingChars < 0}
              className={`px-4 py-2 rounded-full flex items-center ${
                isSubmitting || content.trim() === '' || remainingChars < 0
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white font-medium`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Posting...
                </>
              ) : (
                <>
                  <Send size={16} className="mr-2" />
                  Tweet
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTweetPage;