import React, { useState, useEffect, useMemo } from "react";
import {
  Play,
  ListFilter,
  ArrowUpDown,
  Eye,
  Edit,
  Search,
  MoreVertical,
  PlusCircle,
  ListVideo,
  Clock,
  MessageSquare,
  User,
  ThumbsUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Navbar } from "../Navbar";
import { Sidebar } from "../Sidebar";

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function formatDate(dateString) {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

function MyContentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState({ videos: true, tweets: true });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [activeTab, setActiveTab] = useState("videos");
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const toggleSidebar = () => {
    setIsSidebarVisible((prev) => !prev);
  };

  const api = axios.create({
    baseURL: process.env.REACT_APP_SERVER_URL || "http://localhost:3900",
    withCredentials: true,
    headers: {
      Authorization: `Bearer ${user?.accessToken}`,
    },
  });

  // Reset pagination when tab, filter, or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filterStatus, sortBy, searchQuery]);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await api.get(`/api/v1/videos/user/id/${user.id}`);
        setVideos(response.data.videos || []);
        setLoading((prev) => ({ ...prev, videos: false }));
      } catch (error) {
        console.error("Error fetching videos:", error);
        toast.error("Failed to load videos");
        setLoading((prev) => ({ ...prev, videos: false }));
      }
    };
    const fetchTweets = async () => {
      try {
        const response = await api.get(`/api/v1/tweets/user/${user.id}`);
        if (!response.data.data || !Array.isArray(response.data.data)) {
          console.error("Unexpected API response structure:", response.data);
          setTweets([]);
          setLoading((prev) => ({ ...prev, tweets: false }));
          return;
        }

        const tweetsWithComments = await Promise.all(
          response.data.data.map(async (tweet) => {
            try {
              const tweetId = tweet.id;
              const commentsResponse = await api.get(
                `/api/v1/comments/tweet/${tweetId}`
              );
              const comments = commentsResponse.data.comments || [];

              return {
                ...tweet,
                comments: Array.isArray(comments) ? comments.length : 0,
              };
            } catch (commentError) {
              console.error(
                `Error fetching comments for tweet ${tweet.id}:`,
                commentError
              );
              return {
                ...tweet,
                comments: 0,
              };
            }
          })
        );

        setTweets(tweetsWithComments);
        setLoading((prev) => ({ ...prev, tweets: false }));
      } catch (error) {
        console.error("Error fetching tweets:", error);
        toast.error("Failed to load tweets");
        setTweets([]);
        setLoading((prev) => ({ ...prev, tweets: false }));
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
      setVideos(videos.filter((video) => video.id !== videoId));
      toast.success("Video deleted successfully");
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("Failed to delete video");
    }
  };

  const handleDeleteTweet = async (tweetId) => {
    try {
      await api.delete(`/api/v1/tweets/${tweetId}`);
      setTweets(tweets.filter((tweet) => tweet.id !== tweetId));
      toast.success("Tweet deleted successfully");
    } catch (error) {
      console.error("Error deleting tweet:", error);
      toast.error("Failed to delete tweet");
    }
  };

  const handleTogglePublish = async (contentId, contentType, event) => {
    // Prevent event propagation to avoid navigation
    if (event) {
      event.stopPropagation();
    }

    try {
      if (contentType === "video") {
        const response = await api.patch(
          `/api/v1/videos/toggle/publish/${contentId}`
        );
        setVideos(
          videos.map((video) =>
            video.id === contentId
              ? { ...video, isPublished: !video.isPublished }
              : video
          )
        );
        toast.success(response.data.message);
      } else {
        const response = await api.patch(
          `/api/v1/tweets/toggle/publish/${contentId}`
        );
        setTweets(
          tweets.map((tweet) =>
            tweet.id === contentId
              ? { ...tweet, isPublished: !tweet.isPublished }
              : tweet
          )
        );
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error("Error toggling content status:", error);
      toast.error("Failed to update content status");
    }
  };

  // Get available sort options based on content type
  const getSortOptions = () => {
    const commonOptions = [
      { value: "newest", label: "Newest First" },
      { value: "oldest", label: "Oldest First" },
      { value: "mostViews", label: "Most Views" },
      { value: "leastViews", label: "Least Views" },
    ];

    if (activeTab === "videos") {
      return [
        ...commonOptions,
        { value: "titleAZ", label: "Title (A-Z)" },
        { value: "titleZA", label: "Title (Z-A)" },
      ];
    } else {
      return [
        ...commonOptions,
        { value: "mostComments", label: "Most Comments" },
        { value: "mostLikes", label: "Most Likes" },
      ];
    }
  };

  // Filter and sort videos
  const filteredAndSortedVideos = useMemo(() => {
    let result = videos.filter((video) => {
      const matchesSearch = video.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "published" && video.isPublished) ||
        (filterStatus === "unpublished" && !video.isPublished);

      return matchesSearch && matchesStatus;
    });

    switch (sortBy) {
      case "newest":
        return result.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      case "oldest":
        return result.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      case "mostViews":
        return result.sort((a, b) => (b.views || 0) - (a.views || 0));
      case "leastViews":
        return result.sort((a, b) => (a.views || 0) - (b.views || 0));
      case "titleAZ":
        return result.sort((a, b) => a.title.localeCompare(b.title));
      case "titleZA":
        return result.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return result;
    }
  }, [videos, searchQuery, filterStatus, sortBy]);

  // Filter and sort tweets
  const filteredAndSortedTweets = useMemo(() => {
    if (!tweets || tweets.length === 0) {
      return [];
    }

    let result = tweets.filter((tweet) => {
      // Check if content exists
      if (!tweet || !tweet.content) {
        return false;
      }

      const matchesSearch = tweet.content
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "published" && tweet.isPublished) ||
        (filterStatus === "unpublished" && !tweet.isPublished);

      return matchesSearch && matchesStatus;
    });

    // Sort the tweets
    switch (sortBy) {
      case "newest":
        return result.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      case "oldest":
        return result.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      case "mostViews":
        return result.sort((a, b) => (b.views || 0) - (a.views || 0));
      case "leastViews":
        return result.sort((a, b) => (a.views || 0) - (b.views || 0));
      case "mostComments":
        return result.sort((a, b) => (b.comments || 0) - (a.comments || 0));
      case "mostLikes":
        return result.sort(
          (a, b) =>
            ((b.likes && b.likes.length) || 0) -
            ((a.likes && a.likes.length) || 0)
        );
      default:
        return result;
    }
  }, [tweets, searchQuery, filterStatus, sortBy]);

  // Get paginated content
  const getPaginatedContent = () => {
    const contentArray =
      activeTab === "videos"
        ? filteredAndSortedVideos
        : filteredAndSortedTweets;
    const totalPages = Math.ceil(contentArray.length / itemsPerPage);
    const totalItems = contentArray.length;

    // Ensure current page is valid
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = contentArray.slice(startIndex, endIndex);

    return {
      content: currentItems,
      totalPages,
      totalItems,
      startIndex,
      endIndex: Math.min(endIndex, totalItems),
    };
  };

  const {
    content: paginatedItems,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
  } = getPaginatedContent();

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
      <div className="flex flex-col flex-1">
        <Navbar toggleSidebar={toggleSidebar} />
        <div
          className={`p-8 space-y-8 overflow-auto transition-all duration-300 ${
            isSidebarVisible ? "ml-64" : "ml-0"
          }`}
        >
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800 mr-10">
                  My Content
                </h1>
                {/* Tab Navigation */}
                <div className="bg-gray-100 rounded-md inline-flex items-center p-1">
                  <button
                    onClick={() => setActiveTab("videos")}
                    className={`flex items-center gap-2 px-2 py-2 rounded-md transition-all ${
                      activeTab === "videos"
                        ? "bg-white shadow-sm text-gray-900"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    <ListVideo className="w-4 h-4" /> Videos
                  </button>
                  <button
                    onClick={() => setActiveTab("tweets")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                      activeTab === "tweets"
                        ? "bg-white shadow-sm text-gray-900"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" /> Tweets
                  </button>
                </div>
              </div>

              <Button
                onClick={() =>
                  navigate(
                    activeTab === "videos" ? "/VideoUpload" : "/tweets/create"
                  )
                }
                className="flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                {activeTab === "videos" ? "Upload Video" : "Create Tweet"}
              </Button>
            </div>

            {/* Filter, Sort, and Search Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search input */}
                <div className="relative flex-1 min-w-[200px]">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${activeTab}...`}
                    className="w-full py-2 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Filter dropdown */}
                <div className="relative min-w-[140px]">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="appearance-none w-full py-2 pl-3 pr-9 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Content</option>
                    <option value="published">Published</option>
                    <option value="unpublished">Unpublished</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ListFilter className="w-4 h-4 text-gray-500" />
                  </div>
                </div>

                {/* Sort dropdown */}
                <div className="relative min-w-[160px]">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none w-full py-2 pl-3 pr-9 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {getSortOptions().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ArrowUpDown className="w-4 h-4 text-gray-500" />
                  </div>
                </div>

                {/* Items per page selector */}
                <div className="flex items-center space-x-2 min-w-[120px]">
                  <span className="text-sm text-gray-600">Show:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="appearance-none py-2 pl-2 pr-7 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="6">6</option>
                    <option value="12">12</option>
                    <option value="24">24</option>
                    <option value="48">48</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-1 mb-4">
              <div className="text-sm text-gray-600 mb-2 sm:mb-0">
                Showing{" "}
                <span className="font-medium">
                  {totalItems === 0 ? 0 : startIndex + 1}-{endIndex}
                </span>{" "}
                of <span className="font-medium">{totalItems}</span> {activeTab}
              </div>
            </div>

            {/* Videos Content */}
            {activeTab === "videos" ? (
              <>
                {paginatedItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Play className="mx-auto mb-4 w-16 h-16 text-blue-300" />
                    <p>No videos found. Start creating content!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedItems.map((video) => (
                      <div
                        key={video.id}
                        className="bg-white border rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all"
                      >
                        <div
                          className="relative cursor-pointer"
                          onClick={() => navigate(`/video/${video.id}`)}
                        >
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
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                {video.views || 0}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatDate(video.createdAt)}
                              </div>
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
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/video/edit/${video.id}/true`);
                              }}
                              className="flex-1"
                            >
                              <Edit className="mr-2 w-4 h-4" /> Edit
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                onClick={(e) => e.stopPropagation()}
                              >
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    handleTogglePublish(video.id, "video");
                                  }}
                                >
                                  {video.isPublished ? "Unpublish" : "Publish"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    handleDeleteVideo(video.id);
                                  }}
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
              </>
            ) : (
              <>
                {/* Tweets Content */}
                {paginatedItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="mx-auto mb-4 w-16 h-16 text-blue-300" />
                    <p>No tweets found. Start creating content!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {paginatedItems.map((tweet) => (
                      <div
                        key={tweet.id}
                        className="bg-white border rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all p-4 cursor-pointer"
                        onClick={() => navigate(`/tweet/${tweet.id}`)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            {/* User info header */}
                            <div className="flex items-center gap-3 mb-3">
                              {tweet.owner ? (
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
                                <p className="font-medium text-gray-800">
                                  {tweet.owner?.fullName || "Unknown User"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  @{tweet.owner?.username || "unknown"}
                                </p>
                              </div>
                            </div>

                            {/* Tweet content */}
                            <div className="flex gap-4">
                              <div className="flex-1">
                                <p className="text-gray-800 mb-3">
                                  {tweet.content}
                                </p>
                              </div>
                            </div>

                            {/* Tweet metadata */}
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
                                  <ThumbsUp className="w-4 h-4" />
                                  {(tweet.likes && tweet.likes.length) || 0}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {formatDate(tweet.createdAt)}
                                </div>
                              </div>
                              <div
                                className={`px-2 py-1 rounded text-xs ${
                                  tweet.isPublished
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {tweet.isPublished
                                  ? "Published"
                                  : "Unpublished"}
                              </div>
                            </div>
                          </div>

                          {/* Tweet actions */}
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/tweet/edit/${tweet.id}`);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                onClick={(e) => e.stopPropagation()}
                              >
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    handleTogglePublish(tweet.id, "tweet", e);
                                  }}
                                >
                                  {tweet.isPublished ? "Unpublish" : "Publish"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    handleDeleteTweet(tweet.id);
                                  }}
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
              </>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-10 flex flex-col items-center space-y-4">
                <div className="flex items-center justify-between w-full max-w-lg">
                  <div className="text-sm text-gray-600">
                    Page <span className="font-medium">{currentPage}</span> of{" "}
                    <span className="font-medium">{totalPages}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className={`p-2.5 rounded-md border ${
                        currentPage === 1
                          ? "text-gray-300 border-gray-200 cursor-not-allowed"
                          : "text-blue-600 border-blue-300 hover:bg-blue-50"
                      }`}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <div className="flex space-x-1">
                      {/* Show smart page numbers */}
                      {(() => {
                        // Logic to determine which page numbers to show
                        let pageNumbers = [];

                        if (totalPages <= 5) {
                          // If 5 or fewer pages, show all
                          pageNumbers = Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                          );
                        } else if (currentPage <= 3) {
                          // If near start, show first 5
                          pageNumbers = [1, 2, 3, 4, 5, "...", totalPages];
                        } else if (currentPage >= totalPages - 2) {
                          // If near end, show last 5
                          pageNumbers = [
                            1,
                            "...",
                            totalPages - 4,
                            totalPages - 3,
                            totalPages - 2,
                            totalPages - 1,
                            totalPages,
                          ];
                        } else {
                          // Otherwise show current and surrounding
                          pageNumbers = [
                            1,
                            "...",
                            currentPage - 1,
                            currentPage,
                            currentPage + 1,
                            "...",
                            totalPages,
                          ];
                        }

                        return pageNumbers.map((page, index) => {
                          if (page === "...") {
                            return (
                              <span
                                key={`ellipsis-${index}`}
                                className="w-9 flex items-center justify-center"
                              >
                                ...
                              </span>
                            );
                          }

                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-9 h-9 rounded-md ${
                                currentPage === page
                                  ? "bg-blue-500 text-white font-medium shadow-sm"
                                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        });
                      })()}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className={`p-2.5 rounded-md border ${
                        currentPage === totalPages
                          ? "text-gray-300 border-gray-200 cursor-not-allowed"
                          : "text-blue-600 border-blue-300 hover:bg-blue-50"
                      }`}
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyContentPage;
