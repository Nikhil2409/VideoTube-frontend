import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "./ui/dialog";
import { BarChart, Activity, Eye, ThumbsUp, Users, Upload, Clock } from "lucide-react";

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);

  // Dummy data for a YouTube-like dashboard
  const channelStats = {
    subscribers: "1.2K",
    totalViews: "45.3K",
    totalLikes: "3.2K",
    uploadCount: 24
  };

  const recentVideos = [
    { id: 1, title: "How to Build a React App in 10 Minutes", views: "1.2K", likes: "142", date: "3 days ago", duration: "10:25" },
    { id: 2, title: "JavaScript Tips and Tricks 2025", views: "876", likes: "95", date: "1 week ago", duration: "15:10" },
    { id: 3, title: "CSS Animation Masterclass", views: "543", likes: "67", date: "2 weeks ago", duration: "22:45" }
  ];

  const trendingTopics = ["React Hooks", "Tailwind CSS", "NextJS 14", "Web Development", "TypeScript"];

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="flex h-screen w-full bg-gray-100">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-auto">
        <Navbar user={user} />
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Channel Dashboard</h1>
            <Button 
              onClick={() => navigate("/upload")}
              className="bg-red-600 hover:bg-red-700"
            >
              <Upload className="mr-2 h-4 w-4" /> Upload Video
            </Button>
          </div>

          {/* Channel Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 pt-6">
                <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{channelStats.subscribers}</div>
                <p className="text-xs text-green-500 flex items-center mt-1">
                  <Activity className="mr-1 h-3 w-3" /> +8% from last month
                </p>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 pt-6">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{channelStats.totalViews}</div>
                <p className="text-xs text-green-500 flex items-center mt-1">
                  <Activity className="mr-1 h-3 w-3" /> +12% from last month
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 pt-6">
                <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                <ThumbsUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{channelStats.totalLikes}</div>
                <p className="text-xs text-green-500 flex items-center mt-1">
                  <Activity className="mr-1 h-3 w-3" /> +5% from last month
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 pt-6">
                <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                <BarChart className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{channelStats.uploadCount}</div>
                <p className="text-xs text-gray-500 flex items-center mt-1">
                  <Clock className="mr-1 h-3 w-3" /> Last upload 3 days ago
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Channel Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Uploads */}
            <Card className="col-span-2 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Recent Uploads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentVideos.map(video => (
                    <div key={video.id} className="flex items-start border-b border-gray-200 pb-4">
                      <div className="bg-gray-300 h-20 w-36 flex-shrink-0 rounded mr-4 relative">
                        <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                          {video.duration}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium mb-1 hover:text-blue-600 cursor-pointer">{video.title}</h3>
                        <div className="flex space-x-3 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Eye className="mr-1 h-3 w-3" /> {video.views} views
                          </span>
                          <span className="flex items-center">
                            <ThumbsUp className="mr-1 h-3 w-3" /> {video.likes}
                          </span>
                          <span>{video.date}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => navigate(`/video/edit/${video.id}`)}>
                        Edit
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full">
                    View All Videos
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Sidebar Content */}
            <div className="space-y-6">
              {/* Channel Info */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">Channel Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-300 mr-3"></div>
                    <div>
                      <p className="text-lg font-semibold">{user.fullName}</p>
                      <p className="text-gray-500 text-sm">@{user.username}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/channel/edit")}>
                    Edit Channel
                  </Button>
                </CardContent>
              </Card>
              
              {/* Trending Topics */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">Trending Topics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {trendingTopics.map((topic, index) => (
                      <span key={index} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-gray-300">
                        {topic}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 text-sm text-blue-600 cursor-pointer">
                    View all trending topics
                  </div>
                </CardContent>
              </Card>
              
              {/* Quick Actions */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/studio")}>
                      Go to Creator Studio
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/analytics")}>
                      View Analytics
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/monetization")}>
                      Monetization Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogout} onOpenChange={setShowLogout}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="text-xl font-semibold mb-4">Are you sure you want to log out?</DialogTitle>
          <DialogFooter className="mt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowLogout(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { logout(); navigate("/"); }}>Logout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Dashboard;