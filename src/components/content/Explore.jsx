import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { Navbar } from "../Navbar.jsx";
import { Sidebar } from "../Sidebar.jsx";
import { Card, CardContent } from "../ui/card.jsx";
import {
  Eye,
  User,
  Calendar,
  Video,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ListFilter,
  ThumbsUp,
  Search,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";

const api = axios.create({
  baseURL: process.env.REACT_APP_SERVER_URL || "http://localhost:3900",
  withCredentials: true,
});

function ExplorePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Main state variables
  const [contentType, setContentType] = useState("videos");
  const [videos, setVideos] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [userCache, setUserCache] = useState({});
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFixingViews, setIsFixingViews] = useState(false);

  // Sorting, filtering, and pagination state
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleSidebar = () => {
    setIsSidebarVisible((prev) => !prev);
  };

  // User data helper function
  const getUserForContent = async (item) => {
    if (!item) return null;

    if (item.user && typeof item.user === "object") {
      setUserCache((prev) => ({
        ...prev,
        [item.user.id]: item.user,
      }));
      return item.user;
    }

    const ownerId = item.owner;
    if (!ownerId) return null;

    if (userCache[ownerId]) {
      return userCache[ownerId];
    }

    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(ownerId);
    if (!isValidObjectId) return null;

    try {
      const response = await api.get(`/api/v1/users/getUser/${ownerId}`);
      const userData = response.data.data;

      setUserCache((prev) => ({
        ...prev,
        [ownerId]: userData,
      }));

      return userData;
    } catch (error) {
      console.error(`Error fetching user for ID ${ownerId}:`, error);
      return null;
    }
  };

  // Fetch content when component mounts or content type changes
  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      setError("");

      try {
        const accessToken = user?.accessToken;
        const headers = accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {};

        // Fetch videos
        if (contentType === "videos") {
          const response = await api.get("/api/v1/videos", { headers });
          const videosData = response.data.data;

          if (Array.isArray(videosData) && videosData.length > 0) {
            const processedVideos = videosData.map((video) => ({
              ...video,
              id: video._id || video.id,
            }));

            setVideos(processedVideos);

            processedVideos.forEach((video) => {
              if (video.user && video.user.id) {
                setUserCache((prev) => ({
                  ...prev,
                  [video.user.id]: video.user,
                }));
              }
            });
          } else {
            setError(
              "No videos found or invalid response. Showing sample videos."
            );
          }
        }
        // Fetch tweets
        else if (contentType === "tweets") {
          try {
            const response = await api.get(`/api/v1/tweets/`, { headers });
            const tweetsData = response.data.data.tweets;

            const tweetsWithComments = await Promise.all(
              tweetsData.map(async (tweet) => {
                try {
                  const commentsResponse = await api.get(
                    `/api/v1/comments/tweet/${tweet.id}`
                  );
                  const comments = commentsResponse.data.totalComments;

                  return {
                    ...tweet,
                    comments: comments,
                  };
                } catch (error) {
                  return {
                    ...tweet,
                    comments: 0,
                  };
                }
              })
            );

            if (
              Array.isArray(tweetsWithComments) &&
              tweetsWithComments.length > 0
            ) {
              const processedTweets = tweetsWithComments.map((tweet) => ({
                ...tweet,
                id: tweet._id || tweet.id,
              }));

              setTweets(processedTweets);
            } else {
              setError(
                "No tweets found or invalid response. Showing sample tweets."
              );
            }
          } catch (error) {
            console.error("Error fetching tweets:", error);
            setError("Failed to fetch tweets. Showing sample content.");
          }
        }
      } catch (error) {
        console.error(`Error fetching ${contentType}:`, error);
        setError(`Failed to fetch ${contentType}. Showing sample content.`);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchContent();
    }
  }, [user, contentType]);

  // Fetch missing user data
  useEffect(() => {
    const fetchMissingUsers = async () => {
      const contentItems = contentType === "videos" ? videos : tweets;

      const promises = contentItems.map(async (item) => {
        const ownerId = item.owner;

        if (ownerId && !userCache[ownerId] && !item.user) {
          await getUserForContent(item);
        }
      });

      await Promise.all(promises);
    };

    const contentItems = contentType === "videos" ? videos : tweets;
    if (contentItems.length > 0) {
      fetchMissingUsers();
    }
  }, [videos, tweets, contentType]);

  // Reset pagination when content type or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [contentType, filterBy, sortBy, searchQuery]);

  // Get available sort options based on content type
  const getSortOptions = () => {
    const commonOptions = [
      { value: "newest", label: "Newest First" },
      { value: "oldest", label: "Oldest First" },
      { value: "mostViews", label: "Most Views" },
      { value: "leastViews", label: "Least Views" },
    ];

    if (contentType === "videos") {
      return commonOptions;
    } else {
      return [
        ...commonOptions,
        { value: "mostComments", label: "Most Comments" },
        { value: "mostLikes", label: "Most Likes" },
      ];
    }
  };

  // Apply sorting and filtering to content
  const getSortedAndFilteredContent = () => {
    const contentArray = contentType === "videos" ? videos : tweets;

    // Apply search filtering first
    let searchedContent = contentArray;
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      searchedContent = contentArray.filter((item) => {
        if (contentType === "videos") {
          return (
            item.title.toLowerCase().includes(query) ||
            (item.description && item.description.toLowerCase().includes(query))
          );
        } else {
          return item.content.toLowerCase().includes(query);
        }
      });
    }

    // Apply status/popularity filtering
    let filteredContent = searchedContent;
    if (filterBy !== "all") {
      filteredContent = searchedContent.filter((item) => {
        if (filterBy === "popular") {
          return (item.views || 0) > 100;
        } else if (filterBy === "recent") {
          // Filter for content from the last 7 days
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return new Date(item.createdAt) >= oneWeekAgo;
        }
        return true;
      });
    }

    // Apply sorting
    let sortedContent = [...filteredContent];
    switch (sortBy) {
      case "newest":
        sortedContent.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        break;
      case "oldest":
        sortedContent.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        break;
      case "mostViews":
        sortedContent.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case "leastViews":
        sortedContent.sort((a, b) => (a.views || 0) - (b.views || 0));
        break;
      case "mostComments":
        sortedContent.sort((a, b) => (b.comments || 0) - (a.comments || 0));
        break;
      case "mostLikes":
        sortedContent.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      default:
        break;
    }

    return sortedContent;
  };

  // Get paginated content
  const getPaginatedContent = () => {
    const sortedAndFiltered = getSortedAndFilteredContent();
    const totalPages = Math.ceil(sortedAndFiltered.length / itemsPerPage);
    const totalItems = sortedAndFiltered.length;

    // Ensure current page is valid
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = sortedAndFiltered.slice(startIndex, endIndex);

    return {
      content: currentItems,
      totalPages,
      totalItems,
      startIndex,
      endIndex: Math.min(endIndex, totalItems),
    };
  };

  // Helper formatting functions
  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return "--:--";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Event handlers
  const handleVideoClick = (videoId) => {
    navigate(`/video/${videoId}`);
  };

  const handleTweetClick = (tweetId) => {
    navigate(`/tweet/${tweetId}`);
  };

  const toggleContentType = (type) => {
    if (type !== contentType) {
      setContentType(type);
      setIsLoading(true);
    }
  };

  // Get paginated content
  const {
    content: paginatedItems,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
  } = getPaginatedContent();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-gray-50 to-blue-50">
      <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} />
      <div className="flex flex-col flex-1">
        <Navbar toggleSidebar={toggleSidebar} />
        <div
          className={`p-6 space-y-6 overflow-auto transition-all duration-300 ${
            isSidebarVisible ? "ml-64" : "ml-0"
          }`}
        >
          {/* Header section with content type toggle */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex flex-col">
              <h1 className="text-4xl font-bold text-gray-800 mb-1">Explore</h1>
              <p className="text-gray-500">
                Discover videos and tweets from creators
              </p>
            </div>

            <div className="flex items-center bg-white rounded-full shadow-sm border border-gray-100 mt-4 md:mt-0 p-1">
              <button
                onClick={() => toggleContentType("videos")}
                className={`flex items-center px-5 py-2 rounded-full transition-all ${
                  contentType === "videos"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Video className="mr-2 h-4 w-4" />
                Videos
              </button>
              <button
                onClick={() => toggleContentType("tweets")}
                className={`flex items-center px-5 py-2 rounded-full transition-all ${
                  contentType === "tweets"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Tweets
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start">
              <div className="bg-red-100 p-1 rounded-full mr-3 mt-0.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-red-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p>{error}</p>
            </div>
          )}

          {/* Filter, Sort, and Search Controls - Single Line */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
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
                  placeholder={`Search ${contentType}...`}
                  className="w-full py-2 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filter dropdown */}
              <div className="relative min-w-[140px]">
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="appearance-none w-full py-2 pl-3 pr-9 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Content</option>
                  <option value="popular">Popular</option>
                  <option value="recent">Recent</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ListFilter className="w-4 h-4 text-gray-500" />
                </div>
              </div>

              {/* Sort dropdown */}
              <div className="relative min-w-[140px]">
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
                  <option value="4">4</option>
                  <option value="8">8</option>
                  <option value="12">12</option>
                  <option value="24">24</option>
                  <option value="48">48</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-1">
            <div className="text-sm text-gray-600 mb-2 sm:mb-0">
              Showing{" "}
              <span className="font-medium">
                {startIndex + 1}-{endIndex}
              </span>{" "}
              of <span className="font-medium">{totalItems}</span> {contentType}
            </div>
          </div>

          {/* No content message */}
          {paginatedItems.length === 0 && !error && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-10 text-center">
              <div className="mx-auto w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                {contentType === "videos" ? (
                  <Video className="h-10 w-10 text-blue-400" />
                ) : (
                  <MessageSquare className="h-10 w-10 text-blue-400" />
                )}
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">
                No {contentType} found
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                We couldn't find any {contentType} matching your criteria. Try
                adjusting your filters or search query.
              </p>
            </div>
          )}

          {/* Videos Content */}
          {contentType === "videos" && paginatedItems.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedItems.map((video) => {
                const videoId = video.id || video._id;
                const ownerId = video.owner;
                const videoUser =
                  video.user || (ownerId ? userCache[ownerId] : null);

                return (
                  <div
                    key={videoId}
                    onClick={() => handleVideoClick(videoId)}
                    className="cursor-pointer transition-all duration-300 transform hover:scale-102 hover:shadow-md"
                  >
                    <Card className="overflow-hidden h-full flex flex-col border border-gray-100 rounded-xl">
                      <div className="relative pb-[56.25%] bg-gray-100">
                        {video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="absolute inset-0 h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                            <span className="text-gray-500">No thumbnail</span>
                          </div>
                        )}
                        <div className="absolute bottom-3 right-3 bg-black/75 text-white text-xs px-2 py-1 rounded font-medium">
                          {formatDuration(video.duration)}
                        </div>
                      </div>

                      <CardContent className="p-4 flex-grow flex flex-col bg-white">
                        <h2 className="font-semibold text-base text-gray-900 mb-2 line-clamp-2 leading-tight hover:text-blue-600 transition-colors">
                          {video.title}
                        </h2>

                        <div className="flex items-center mb-2">
                          <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden mr-2 border border-gray-100">
                            {videoUser?.avatar ? (
                              <img
                                src={videoUser.avatar}
                                alt={videoUser.fullName || "Creator"}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <User className="h-full w-full p-1 text-gray-400" />
                            )}
                          </div>
                          <span className="text-sm text-gray-600 font-medium hover:text-blue-600 transition-colors">
                            {videoUser?.username || "Unknown Creator"}
                          </span>
                        </div>

                        <div className="mt-auto pt-2 border-t border-gray-100">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center">
                              <Eye className="mr-1 h-3.5 w-3.5" />
                              <span className="font-medium">
                                {video.views?.toLocaleString() || 0}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="mr-1 h-3.5 w-3.5" />
                              <span>{formatDate(video.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tweets Content */}
          {contentType === "tweets" && paginatedItems.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {paginatedItems.map((tweet) => {
                const tweetId = tweet.id || tweet._id;
                const ownerId = tweet.owner.id || tweet.owner;
                const tweetUser =
                  tweet.owner || (ownerId ? userCache[ownerId] : null);

                return (
                  <div
                    key={tweetId}
                    onClick={() => handleTweetClick(tweetId)}
                    className="cursor-pointer"
                  >
                    <Card className="overflow-hidden border border-gray-100 hover:shadow-md transition-all duration-300 rounded-xl">
                      <CardContent className="p-5">
                        <div className="flex items-center mb-4">
                          <div className="h-11 w-11 rounded-full bg-gray-200 overflow-hidden mr-3 border border-gray-100">
                            {tweetUser?.avatar ? (
                              <img
                                src={tweetUser.avatar}
                                alt={tweetUser.fullName || "Creator"}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <User className="h-full w-full p-1.5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm leading-tight">
                              {typeof tweetUser === "object"
                                ? tweetUser.username || "Unknown User"
                                : "Unknown User"}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatDate(tweet.createdAt)}
                            </p>
                          </div>
                        </div>

                        <p className="text-gray-800 mb-5 text-base leading-relaxed line-clamp-3 hover:text-blue-600 transition-colors">
                          {tweet.content}
                        </p>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Eye className="w-4 h-4 mr-1.5 text-gray-400" />
                              <span className="font-medium">
                                {tweet.views || 0}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <MessageSquare className="w-4 h-4 mr-1.5 text-gray-400" />
                              <span className="font-medium">
                                {tweet.comments || 0}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <ThumbsUp className="w-4 h-4 mr-1.5 text-gray-400" />
                              <span className="font-medium">
                                {tweet.likes.length || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
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
  );
}

export default ExplorePage;
