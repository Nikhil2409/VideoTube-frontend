import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Navbar } from "../Navbar";
import { Sidebar } from "../Sidebar";
import {
  ListVideo,
  Play,
  MessageSquare,
  Eye,
  Clock,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  ArrowUpDown,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";

function formatDuration(seconds) {
  // Ensure seconds is a number
  seconds = Number(seconds);

  // Calculate minutes and remaining seconds
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  // Pad with leading zeros if needed
  const formattedMinutes = minutes.toString().padStart(2, "0");
  const formattedSeconds = remainingSeconds.toString().padStart(2, "0");

  return `${formattedMinutes}:${formattedSeconds}`;
}

function LikedContentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [likedVideos, setLikedVideos] = useState([]);
  const [likedTweets, setLikedTweets] = useState([]);
  const [loading, setLoading] = useState({ videos: true, tweets: true });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("videos");
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  // New state for pagination & filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");

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
  }, [activeTab, filterBy, sortBy, searchQuery]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchLikedVideos = async () => {
      try {
        const response = await api.get("/api/v1/likes/videos");
        const fetchedLikedVideos = response.data.data || [];

        const formattedVideos = fetchedLikedVideos.map((video) => ({
          id: video.id,
          title: video.title,
          thumbnail: video.thumbnail || "/api/placeholder/300/200",
          views: video.views || 0,
          likedAt: new Date(video.likedAt || Date.now()),
          createdAt: new Date(video.createdAt || video.likedAt || Date.now()),
          duration: video.duration,
        }));

        setLikedVideos(formattedVideos);
        setLoading((prev) => ({ ...prev, videos: false }));
      } catch (error) {
        console.error("Failed to fetch liked videos", error);
        toast.error("Failed to load liked videos");
        setLoading((prev) => ({ ...prev, videos: false }));
      }
    };

    const fetchLikedTweets = async () => {
      try {
        const response = await api.get("/api/v1/likes/tweets");
        const fetchedLikedTweets = response.data.data || [];

        const tweetsWithComments = await Promise.all(
          fetchedLikedTweets.map(async (tweet) => {
            const commentsResponse = await api.get(
              `/api/v1/comments/tweet/${tweet.id}`
            );
            const comments = commentsResponse.data.comments;

            // Return the tweet with an added commentCount property
            return {
              ...tweet,
              comments: comments.length,
            };
          })
        );

        const formattedTweets = tweetsWithComments.map((tweet) => ({
          id: tweet.id,
          content: tweet.content,
          image: tweet.image,
          views: tweet.views || 0,
          comments: tweet.comments || 0,
          likedAt: new Date(tweet.likedAt || Date.now()),
          createdAt: new Date(tweet.createdAt || Date.now()),
          owner: tweet.owner, // Preserve the owner information
        }));

        setLikedTweets(formattedTweets);
        setLoading((prev) => ({ ...prev, tweets: false }));
      } catch (error) {
        console.error("Failed to fetch liked tweets", error);
        toast.error("Failed to load liked tweets");
        setLoading((prev) => ({ ...prev, tweets: false }));
      }
    };

    fetchLikedVideos();
    fetchLikedTweets();
  }, [user, navigate]);

  const handleTweetClick = (tweetId) => {
    navigate(`/tweet/${tweetId}`);
  };

  const handleVideoClick = (videoId) => {
    navigate(`/video/${videoId}`);
  };

  // Get available sort options based on active tab
  const getSortOptions = () => {
    const commonOptions = [
      { value: "newest", label: "Newest First" },
      { value: "oldest", label: "Oldest First" },
      { value: "mostViews", label: "Most Views" },
      { value: "leastViews", label: "Least Views" },
      { value: "recentlyLiked", label: "Recently Liked" },
    ];

    if (activeTab === "videos") {
      return commonOptions;
    } else {
      return [
        ...commonOptions,
        { value: "mostComments", label: "Most Comments" },
      ];
    }
  };

  // Filter and sort content based on active filters
  const filteredAndSortedVideos = useMemo(() => {
    let result = likedVideos;

    // Apply search filtering
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter((video) =>
        video.title.toLowerCase().includes(query)
      );
    }

    // Apply status/period filtering
    if (filterBy !== "all") {
      result = result.filter((video) => {
        if (filterBy === "lastWeek") {
          // Filter for content liked in the last 7 days
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return video.likedAt >= oneWeekAgo;
        } else if (filterBy === "lastMonth") {
          // Filter for content liked in the last 30 days
          const oneMonthAgo = new Date();
          oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
          return video.likedAt >= oneMonthAgo;
        }
        return true;
      });
    }

    // Apply sorting
    switch (sortBy) {
      case "newest":
        return result.sort((a, b) => b.createdAt - a.createdAt);
      case "oldest":
        return result.sort((a, b) => a.createdAt - b.createdAt);
      case "mostViews":
        return result.sort((a, b) => (b.views || 0) - (a.views || 0));
      case "leastViews":
        return result.sort((a, b) => (a.views || 0) - (b.views || 0));
      case "recentlyLiked":
        return result.sort((a, b) => b.likedAt - a.likedAt);
      default:
        return result;
    }
  }, [likedVideos, searchQuery, filterBy, sortBy]);

  const filteredAndSortedTweets = useMemo(() => {
    let result = likedTweets;

    // Apply search filtering
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter((tweet) =>
        tweet.content.toLowerCase().includes(query)
      );
    }

    // Apply status/period filtering
    if (filterBy !== "all") {
      result = result.filter((tweet) => {
        if (filterBy === "lastWeek") {
          // Filter for content liked in the last 7 days
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return tweet.likedAt >= oneWeekAgo;
        } else if (filterBy === "lastMonth") {
          // Filter for content liked in the last 30 days
          const oneMonthAgo = new Date();
          oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
          return tweet.likedAt >= oneMonthAgo;
        }
        return true;
      });
    }

    // Apply sorting
    switch (sortBy) {
      case "newest":
        return result.sort((a, b) => b.createdAt - a.createdAt);
      case "oldest":
        return result.sort((a, b) => a.createdAt - b.createdAt);
      case "mostViews":
        return result.sort((a, b) => (b.views || 0) - (a.views || 0));
      case "leastViews":
        return result.sort((a, b) => (a.views || 0) - (b.views || 0));
      case "mostComments":
        return result.sort((a, b) => (b.comments || 0) - (a.comments || 0));
      case "recentlyLiked":
        return result.sort((a, b) => b.likedAt - a.likedAt);
      default:
        return result;
    }
  }, [likedTweets, searchQuery, filterBy, sortBy]);

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

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

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
            <Tabs
              defaultValue="videos"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-bold text-gray-800">
                    Liked Content
                  </h1>
                  <TabsList className="bg-gray-100">
                    <TabsTrigger
                      value="videos"
                      className="flex items-center gap-2"
                    >
                      <ListVideo className="w-4 h-4" /> Videos
                    </TabsTrigger>
                    <TabsTrigger
                      value="tweets"
                      className="flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" /> Tweets
                    </TabsTrigger>
                  </TabsList>
                </div>
                <Button
                  onClick={() => navigate("/")}
                  className="flex items-center gap-2"
                >
                  Explore {activeTab === "videos" ? "Videos" : "Tweets"}
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
                      placeholder={`Search liked ${activeTab}...`}
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
                      <option value="all">All Time</option>
                      <option value="lastWeek">Last 7 Days</option>
                      <option value="lastMonth">Last 30 Days</option>
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
                      <option value="4">4</option>
                      <option value="8">8</option>
                      <option value="12">12</option>
                      <option value="24">24</option>
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
                  of <span className="font-medium">{totalItems}</span>{" "}
                  {activeTab}
                </div>
              </div>

              <TabsContent value="videos">
                {paginatedItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Play className="mx-auto mb-4 w-16 h-16 text-blue-300" />
                    <p>No liked videos found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedItems.map((video) => (
                      <div
                        key={video.id}
                        className="bg-white border rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer"
                        onClick={() => handleVideoClick(video.id)}
                      >
                        <div className="relative">
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

                          <div className="flex justify-between items-center text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              <span>
                                {(video.views || 0).toLocaleString()} Views
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Liked {formatDate(video.likedAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tweets">
                {paginatedItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="mx-auto mb-4 w-16 h-16 text-blue-300" />
                    <p>No liked tweets found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {paginatedItems.map((tweet) => (
                      <div
                        onClick={() => handleTweetClick(tweet.id)}
                        key={tweet.id}
                        className="bg-white border rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all p-4"
                      >
                        <div className="flex flex-col">
                          {/* User info header */}
                          <div className="flex items-center gap-3 mb-3">
                            {tweet?.owner ? (
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
                                {tweet?.owner?.fullName || "Unknown User"}
                              </p>
                              <p className="text-xs text-gray-500">
                                @{tweet?.owner?.username || "unknown"}
                              </p>
                            </div>
                          </div>

                          {/* Tweet content */}
                          <div className="mb-3">
                            <p className="text-gray-800">{tweet.content}</p>
                          </div>

                          {/* Tweet stats */}
                          <div className="flex justify-between items-center text-sm text-gray-600">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                {(tweet.views || 0).toLocaleString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageSquare className="w-4 h-4" />
                                {(tweet.comments || 0).toLocaleString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatDate(tweet.createdAt)}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              Liked {formatDate(tweet.likedAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

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
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
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
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LikedContentPage;
