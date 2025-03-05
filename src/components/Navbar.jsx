import React, { useState, useCallback } from "react"
import { 
  User, 
  Search, 
  Video, 
  LogOut, 
  ChevronLeft, 
  Pen, 
  Play, 
  Trash2, 
  Clock, 
  Heart, 
  MessageCircle, 
  ListVideo, 
  Settings,
  WatchIcon
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

function Navbar({ user: propsUser, logout, onDataDelete, onWatchHistoryCleared }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteConfirmation, setDeleteConfirmation] = useState(null)
  const [user, setUser] = useState(propsUser);
  const navigate = useNavigate()
  console.log(user);
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
    baseURL: "http://localhost:3900",
    withCredentials: true,
  });

  const handleDeleteSpecificData = async (dataType) => {
    try {
      if(dataType === 'watch history'){
        await api.post('/api/v1/users/deleteWatchHistory', {
          userId: user?.id,
        });

        setUser(prevUser => ({
          ...prevUser,
          watchHistoryIds: [] // Clear watch history IDs
        }));

        // Call the callback to trigger watch history clearing in Dashboard
        if (onWatchHistoryCleared) {
          onWatchHistoryCleared();
        }
      } else {
        await api.post('/api/v1/users/delete-specific-data', {
          userId: user?.id,
          dataType: dataType
        });
      }
      
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
      type: 'watch history',
      label: 'WatchHistory',
      icon: Clock
    }
  ]

  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center space-x-4">
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
          onClick={() => navigate("/")}
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
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate("/VideoUpload")}
          className="hover:bg-blue-50"
        >
          <Video className="h-5 w-5 text-blue-600" />
        </Button>

        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate("/makeTweet")}
          className="hover:bg-gray-50"
        >
          <Pen className="h-5 w-5 text-blue-600" />
        </Button>
      
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate("/addPlaylist")}
          className="hover:bg-gray-50"
        >
          <Play className="h-5 w-5 text-blue-600" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex items-center space-x-2 hover:bg-gray-100"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-medium text-sm">
                {'Settings'}
              </span>
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
            
          </DropdownMenuContent>
        </DropdownMenu>
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