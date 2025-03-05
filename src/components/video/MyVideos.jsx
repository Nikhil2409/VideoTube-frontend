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
  Clock
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

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function MyVideosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const api = axios.create({
    baseURL: "http://localhost:3900",
    withCredentials: true,
    headers: {
      Authorization: `Bearer ${user?.accessToken}`
    }
  });

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await api.get(`/api/v1/videos/user/id/${user.id}`);
        setVideos(response.data.videos || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching videos:", error);
        toast.error("Failed to load videos");
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchVideos();
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

  const handleTogglePublish = async (videoId) => {
    try {
      const response = await api.patch(`/api/v1/videos/toggle/publish/${videoId}`);
      setVideos(videos.map(video => 
        video.id === videoId 
          ? { ...video, isPublished: !video.isPublished } 
          : video
      ));
      toast.success(response.data.message);
    } catch (error) {
      console.error("Error toggling video status:", error);
      toast.error("Failed to update video status");
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
                <ListVideo className="mr-3 text-blue-600" /> My Videos
              </h1>
              <Button 
                onClick={() => navigate("/VideoUpload")}
                className="flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5" /> Upload Video
              </Button>
            </div>

            <div className="flex space-x-4 mb-6">
              <Input 
                placeholder="Search videos..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              
              <Select 
                value={filterStatus} 
                onValueChange={setFilterStatus}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Videos</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="unpublished">Unpublished</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={sortBy} 
                onValueChange={setSortBy}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="mostViews">Most Views</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                          onClick={() => navigate(`/video/edit/${video.id}`)}
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
                              onSelect={() => handleTogglePublish(video.id)}
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyVideosPage;