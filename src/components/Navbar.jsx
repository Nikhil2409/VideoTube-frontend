import React, { useState, useCallback } from "react"
import { 
  Search, 
  Video, 
  ChevronLeft, 
  Pen, 
  Play, 
  Trash2, 
  Clock,  
  ListVideo, 
  Settings,
  Menu,
  User,
  LogOut
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { Button } from "./ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "./ui/dropdown-menu"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "./ui/alert-dialog"
import { toast } from "./ui/use-toast"
import axios from 'axios'
import { cacheUtils } from "./utils/cacheUtils"
import { Dialog, DialogContent, DialogFooter, DialogDescription, DialogTitle } from "./ui/dialog"
import { ChatBubbleIcon } from "@radix-ui/react-icons"

function Navbar({onDataDelete, toggleSidebar}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteConfirmation, setDeleteConfirmation] = useState(null)
  const {user, logout} = useAuth(); 
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const handleSearch = useCallback((e) => {
    e.preventDefault()
    const trimmedQuery = searchQuery.trim()
    if (trimmedQuery) {
      navigate(`/c/${trimmedQuery}`)
      setSearchQuery("")
    }
  }, [searchQuery, navigate])

  const handleGoBack = useCallback(() => {
    navigate(-1)
  }, [navigate])
  
  const api = axios.create({
    baseURL: process.env.REACT_APP_SERVER_URL || "http://localhost:3900",
    withCredentials: true,
  });

  const handleDeleteSpecificData = async (dataType) => {
    try {
        await api.post('/api/v1/users/delete-specific-data', {
          userId: user?.id,
          dataType: dataType
        });
        toast({
          title: "Data Deleted",
          description: `${dataType} has been successfully deleted.`,
          variant: "destructive"
        });
        
        // Clear local cache
        cacheUtils.clearUserCache(user.id);
      
      // Trigger dashboard refresh if callback is provided
      if (onDataDelete) {
        onDataDelete();
      }
        
        setDeleteConfirmation(null);
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to delete ${dataType}.`,
          variant: "destructive"
        });
      }
  };
   const handleLogout = async () => {
      try {
        console.log(localStorage);
        console.log(user.id);
        cacheUtils.clearUserCache(user.id);
        await api.post("/api/v1/users/logout", {}, { withCredentials: true });
        console.log(localStorage);
        logout();
        navigate("/login");
      } catch (error) {
        console.error("Error logging out:", error);
      }
    };
  const dataDeleteOptions = [
    { 
      type: 'playlist', 
      label: 'Playlists', 
      icon: ListVideo 
    },
    { 
      type: 'video', 
      label: 'Videos', 
      icon: Video 
    },
    { 
      type: 'tweet', 
      label: 'Tweets', 
      icon: Pen 
    },
    {
      type: 'watchHistory',
      label: 'WatchHistory',
      icon: Clock
    }
  ]

  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center space-x-4">
      <Button
        variant="ghost"
        className="p-2"
        onClick={toggleSidebar} // Trigger sidebar visibility toggle
      >
        <Menu className="h-6 w-6 text-gray-700" />
      </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleGoBack}
          className="hover:bg-gray-100" 
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </Button>
        <h1 
          className="text-2xl font-bold text-blue-600 cursor-pointer"
        >
          VideoTube
        </h1>
      </div>
    
      <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-8">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search channels, videos..."
            className="w-full p-2 pl-10 pr-24 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all duration-300"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <button 
            type="submit" 
            className="absolute inset-y-0 right-0 px-4 bg-blue-600 text-white rounded-r-full hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>
      </form>
    
      <div className="flex items-center space-x-4">
  <div className="relative group">
    <Button 
      variant="outline" 
      size="icon" 
      onClick={() => navigate("/VideoUpload")}
      className="hover:bg-blue-50 rounded-full p-2 border-gray-200 shadow-sm transition-all duration-200"
    >
      <Video className="h-5 w-5 text-blue-600" />
      <span className="sr-only">Upload Video</span>
    </Button>
    <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
      Upload a new video
      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
    </div>
  </div>

  <div className="relative group">
    <Button 
      variant="outline" 
      size="icon" 
      onClick={() => navigate("/tweets/create")}
      className="hover:bg-blue-50 rounded-full p-2 border-gray-200 shadow-sm transition-all duration-200"
    >
      <Pen className="h-5 w-5 text-blue-600" />
      <span className="sr-only">Create Tweet</span>
    </Button>
    <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
      Create a new tweet
      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
    </div>
  </div>

  <div className="relative group">
    <Button 
      variant="outline" 
      size="icon" 
      onClick={() => navigate("/chat")}
      className="hover:bg-blue-50 rounded-full p-2 border-gray-200 shadow-sm transition-all duration-200"
    >
      <ChatBubbleIcon className="h-5 w-5 text-blue-600" />
      <span className="sr-only">Chat</span>
    </Button>
    <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
      Chat
      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
    </div>
  </div>
  
  <div className="relative group">
    <Button
      variant="outline"
      size="icon"
      onClick={() => navigate("/profile")}
      className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 border-transparent shadow-md transition-all duration-200"
    >
      {user?.username ? (
        <span className="font-medium">{user.username.charAt(0).toUpperCase()}</span>
      ) : (
        <User className="h-5 w-5 text-white" />
      )}
      <span className="sr-only">User Profile</span>
    </Button>
    <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
      View your profile
      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
    </div>
  </div>
        
  <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button
      variant="ghost"
      className="flex items-center space-x-2 hover:bg-gray-100"
    >
      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
        <Settings className="w-5 h-5 text-blue-600" />
      </div>
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-64">
    <DropdownMenuLabel>Data Management</DropdownMenuLabel>
    <DropdownMenuSeparator />
    
    {dataDeleteOptions.map((option) => (
      <DropdownMenuItem
        key={option.type}
        className="cursor-pointer flex items-center justify-between"
        onSelect={() => setDeleteConfirmation(option.type)}
      >
        <div className="flex items-center">
          <option.icon className="mr-2 h-4 w-4 text-blue-600" />
          <span>{option.label}</span>
        </div>
        <Trash2 className="h-4 w-4 text-red-500" />
      </DropdownMenuItem>
    ))}
    
    <DropdownMenuSeparator />
    <DropdownMenuLabel>Account</DropdownMenuLabel>
    <DropdownMenuItem
      className="cursor-pointer text-red-600 flex items-center"
      onSelect={() => setShowLogoutDialog(true)}
    >
      <LogOut className="mr-2 h-4 w-4" />
      <span>Logout</span>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

{/* Logout confirmation dialog - use the same one from Sidebar */}
<Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
  <DialogContent className="sm:max-w-md">
    <DialogTitle>Confirm Logout</DialogTitle>
    <DialogDescription>
      Are you sure you want to log out of your account?
    </DialogDescription>
    <DialogFooter className="gap-2">
      <Button 
        variant="outline" 
        onClick={() => setShowLogoutDialog(false)}
      >
        Cancel
      </Button>
      <Button 
        variant="destructive" 
        onClick={handleLogout}
      >
        Logout
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
      </div>

      {deleteConfirmation && (
        <AlertDialog 
          open={!!deleteConfirmation} 
          onOpenChange={() => setDeleteConfirmation(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Confirmation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete your {
                  dataDeleteOptions.find(opt => opt.type === deleteConfirmation)?.label
                }? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => handleDeleteSpecificData(deleteConfirmation)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </nav>
  )
}

export { Navbar }