import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "./ui/dialog";
import { 
  Play, MessageSquare, ListVideo, Users, 
  ThumbsUp, Twitter, Bell
} from "lucide-react";

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);
  const [activeTab, setActiveTab] = useState("videos");

  // Mock data for each model
  const modelData = {
    videos: [
      { id: 1, title: "React Hooks Tutorial", views: 1287, likes: 142, comments: 28, duration: "10:25", date: "3 days ago" },
      { id: 2, title: "Building a YouTube Clone", views: 876, likes: 95, comments: 17, duration: "15:10", date: "1 week ago" },
      { id: 3, title: "CSS Animation Masterclass", views: 543, likes: 67, comments: 12, duration: "22:45", date: "2 weeks ago" }
    ],
    likes: [
      { id: 1, videoTitle: "Top 10 JavaScript Tips", likedBy: "user123", date: "2 days ago" },
      { id: 2, videoTitle: "Learn Node.js Fast", likedBy: "dev_jane", date: "4 days ago" },
      { id: 3, videoTitle: "Full Stack Development Guide", likedBy: "coder_mike", date: "1 week ago" }
    ],
    comments: [
      { id: 1, videoTitle: "React Hooks Tutorial", comment: "Great explanation, thank you!", author: "react_fan", date: "1 day ago" },
      { id: 2, videoTitle: "MongoDB Crash Course", comment: "This helped me so much with my project", author: "dbmaster", date: "3 days ago" },
      { id: 3, videoTitle: "AWS Basics", comment: "Could you cover Lambda functions next?", author: "cloud_dev", date: "5 days ago" }
    ],
    playlists: [
      { id: 1, title: "JavaScript Essentials", videoCount: 12, views: 543 },
      { id: 2, title: "Web Dev Tutorials", videoCount: 8, views: 327 },
      { id: 3, title: "Backend Development", videoCount: 5, views: 189 }
    ],
    users: [
      { id: 1, username: "techguru", name: "Tech Guru", subscribed: true, date: "1 month ago" },
      { id: 2, username: "codemaster", name: "Code Master", subscribed: true, date: "2 weeks ago" },
      { id: 3, username: "webdev_pro", name: "Web Dev Pro", subscribed: false, date: "3 days ago" }
    ],
    tweets: [
      { id: 1, content: "Just uploaded a new React tutorial! Check it out on my channel.", likes: 24, retweets: 7, date: "2 days ago" },
      { id: 2, content: "What topics would you like to see next? Reply with your suggestions!", likes: 18, retweets: 3, date: "4 days ago" },
      { id: 3, content: "Streaming live coding session tomorrow at 8PM EST. Don't miss it!", likes: 32, retweets: 12, date: "1 week ago" }
    ],
    subscriptions: [
      { id: 1, channelName: "JavaScript Mastery", subscribers: "250K", date: "Subscribed 2 months ago" },
      { id: 2, channelName: "CSS Wizard", subscribers: "125K", date: "Subscribed 3 weeks ago" },
      { id: 3, channelName: "Backend Guru", subscribers: "75K", date: "Subscribed 1 week ago" }
    ]
  };

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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Channel Dashboard</h1>
            <Button 
              onClick={() => navigate("/upload")}
              className="bg-red-600 hover:bg-red-700"
            >
              Upload Video
            </Button>
          </div>

          {/* Model Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
            <Card className="shadow-sm" onClick={() => setActiveTab("videos")}>
              <CardContent className="p-4 flex items-center space-x-2 cursor-pointer">
                <Play className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Videos</p>
                  <p className="text-2xl font-bold">{modelData.videos.length}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm" onClick={() => setActiveTab("likes")}>
              <CardContent className="p-4 flex items-center space-x-2 cursor-pointer">
                <ThumbsUp className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Likes</p>
                  <p className="text-2xl font-bold">{modelData.likes.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm" onClick={() => setActiveTab("comments")}>
              <CardContent className="p-4 flex items-center space-x-2 cursor-pointer">
                <MessageSquare className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Comments</p>
                  <p className="text-2xl font-bold">{modelData.comments.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm" onClick={() => setActiveTab("playlists")}>
              <CardContent className="p-4 flex items-center space-x-2 cursor-pointer">
                <ListVideo className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Playlists</p>
                  <p className="text-2xl font-bold">{modelData.playlists.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm" onClick={() => setActiveTab("users")}>
              <CardContent className="p-4 flex items-center space-x-2 cursor-pointer">
                <Users className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Users</p>
                  <p className="text-2xl font-bold">{modelData.users.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm" onClick={() => setActiveTab("tweets")}>
              <CardContent className="p-4 flex items-center space-x-2 cursor-pointer">
                <Twitter className="h-4 w-4 text-cyan-600" />
                <div>
                  <p className="text-sm font-medium">Tweets</p>
                  <p className="text-2xl font-bold">{modelData.tweets.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm" onClick={() => setActiveTab("subscriptions")}>
              <CardContent className="p-4 flex items-center space-x-2 cursor-pointer">
                <Bell className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">Subs</p>
                  <p className="text-2xl font-bold">{modelData.subscriptions.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Tabs for different models */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-7 gap-2">
              <TabsTrigger value="videos">Videos</TabsTrigger>
              <TabsTrigger value="likes">Likes</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="playlists">Playlists</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="tweets">Tweets</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            </TabsList>
            
            {/* Videos Tab */}
            <TabsContent value="videos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Your Videos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {modelData.videos.map(video => (
                      <div key={video.id} className="flex items-start border-b border-gray-200 pb-4">
                        <div className="bg-gray-300 h-20 w-36 flex-shrink-0 rounded mr-4 relative">
                          <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                            {video.duration}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium mb-1 hover:text-blue-600 cursor-pointer">{video.title}</h3>
                          <div className="flex space-x-3 text-xs text-gray-500">
                            <span>{video.views} views</span>
                            <span>{video.likes} likes</span>
                            <span>{video.comments} comments</span>
                            <span>{video.date}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => navigate(`/video/edit/${video.id}`)}>
                          Edit
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Likes Tab */}
            <TabsContent value="likes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Recent Likes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {modelData.likes.map(like => (
                      <div key={like.id} className="flex items-center justify-between border-b border-gray-200 pb-3">
                        <div>
                          <h3 className="font-medium hover:text-blue-600 cursor-pointer">{like.videoTitle}</h3>
                          <p className="text-sm text-gray-500">Liked by @{like.likedBy} · {like.date}</p>
                        </div>
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Recent Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {modelData.comments.map(comment => (
                      <div key={comment.id} className="border-b border-gray-200 pb-3">
                        <h3 className="font-medium hover:text-blue-600 cursor-pointer">{comment.videoTitle}</h3>
                        <p className="my-1">"{comment.comment}"</p>
                        <div className="flex justify-between">
                          <p className="text-sm text-gray-500">By @{comment.author} · {comment.date}</p>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">Reply</Button>
                            <Button variant="ghost" size="sm">Delete</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Playlists Tab */}
            <TabsContent value="playlists" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Your Playlists</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {modelData.playlists.map(playlist => (
                      <div key={playlist.id} className="border rounded-md p-4 hover:border-blue-400 cursor-pointer">
                        <div className="bg-gray-300 h-32 rounded-md mb-2"></div>
                        <h3 className="font-medium">{playlist.title}</h3>
                        <p className="text-sm text-gray-500">{playlist.videoCount} videos · {playlist.views} views</p>
                        <div className="mt-3 flex justify-end">
                          <Button variant="ghost" size="sm">Edit</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">User Interactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {modelData.users.map(user => (
                      <div key={user.id} className="flex items-center justify-between border-b border-gray-200 pb-3">
                        <div className="flex items-center">
                          <div className="bg-gray-300 h-10 w-10 rounded-full mr-3"></div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-500">@{user.username} · {user.date}</p>
                          </div>
                        </div>
                        <div>
                          {user.subscribed ? (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Subscribed</span>
                          ) : (
                            <Button size="sm" variant="outline">Subscribe</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tweets Tab */}
            <TabsContent value="tweets" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Your Tweets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {modelData.tweets.map(tweet => (
                      <div key={tweet.id} className="border-b border-gray-200 pb-3">
                        <p className="mb-2">{tweet.content}</p>
                        <div className="flex justify-between items-center">
                          <div className="flex space-x-4 text-sm text-gray-500">
                            <span>{tweet.likes} likes</span>
                            <span>{tweet.retweets} retweets</span>
                            <span>{tweet.date}</span>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">Edit</Button>
                            <Button variant="ghost" size="sm">Delete</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subscriptions Tab */}
            <TabsContent value="subscriptions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Your Subscriptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {modelData.subscriptions.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between border-b border-gray-200 pb-3">
                        <div className="flex items-center">
                          <div className="bg-gray-300 h-10 w-10 rounded-full mr-3"></div>
                          <div>
                            <p className="font-medium">{sub.channelName}</p>
                            <p className="text-sm text-gray-500">{sub.subscribers} subscribers · {sub.date}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Unsubscribe</Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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