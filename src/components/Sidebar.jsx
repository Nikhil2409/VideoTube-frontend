import React, { useState, useEffect } from "react";
import { 
  NavLink, 
  useNavigate, 
  useLocation 
} from "react-router-dom";
import { 
  Home, 
  User, 
  LogOut, 
  Compass, 
  Heart, 
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  Users
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "./ui/dialog";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { cacheUtils } from "./utils/cacheUtils";
import { set } from "date-fns";


function Sidebar({ isVisible, toggleSidebar }) {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [subscribers, setSubscribers] = useState([]);
  const [cacheSubscribers, setCacheSubscribers] = useState([]);

  const api = axios.create({
    baseURL: "http://localhost:3900",
    withCredentials: true,
  });

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
  
  // Sample subscribers - replace with actual data
  const dummySubscribers = [
    { id: 1, username: "JohnDoe", avatar: null },
    { id: 2, username: "JaneSmith", avatar: null },
    { id: 3, username: "RobertJohnson", avatar: null },
    { id: 4, username: "SarahWilliams", avatar: null },
    { id: 5, username: "MichaelBrown", avatar: null },
  ];

 useEffect(() => {
  const fetchSubscribers = async () => {
    try {
      if(cacheSubscribers.lenght > 0){
        setSubscribers(cacheSubscribers);
      }
      else{
      const response = await api.get(`/api/v1/subscriptions`);
      //console.log(response);
      
      if (response.data.data.channels && Array.isArray(response.data.data.channels)) {
        setSubscribers(response.data.data.channels);
        setCacheSubscribers(response.data.data.channels);
      } else {
        setSubscribers(dummySubscribers);
      }
    }} catch (error) {
      // Only use dummy data in case of error
      setSubscribers(dummySubscribers);
      console.error("Error fetching subscribers:", error);
    }
  };
  
  fetchSubscribers();
}, [user, api]);

  const menuItems = [
    { 
      icon: Home, 
      label: "Home", 
      path: "/dashboard",
      activeCondition: (path) => path === "/dashboard"
    },
    { 
      icon: Compass, 
      label: "Explore", 
      path: "/explore",
      activeCondition: (path) => path.startsWith("/explore")
    },
    { 
      icon: PlayCircle, 
      label: "My Content", 
      path: "/my-content",
      activeCondition: (path) => path.startsWith("/my-content")
    },
    { 
      icon: Heart, 
      label: "Liked Content", 
      path: "/likedContent",
      activeCondition: (path) => path ===  "/likedContent"
    },
  ];

  return (
    <div className={`fixed top-0 left-0 h-full bg-white border-r shadow-lg transition-all duration-300 flex flex-col ${isVisible ? 'translate-x-0' : '-translate-x-full'}`} style={{ width: '256px' }}>
      <div className="p-4 flex-shrink-0">
        <div className="mb-6 flex items-center space-x-3 px-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
          </div>
        </div>
      </div>

      {/* Scrollable navigation area */}
      <div className="flex-grow overflow-y-auto px-4">
        <nav className="space-y-1 mb-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 p-2 rounded-lg transition-all duration-200
                ${item.activeCondition(location.pathname) 
                  ? "bg-blue-50 text-blue-600 font-semibold" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"}
              `}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Separator */}
        <div className="border-t border-gray-200 my-4"></div>

        {/* Subscribers section */}
        <div className="mb-4">
          <h3 className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-3 px-2">
            <Users className="w-4 h-4" /> 
            Subscriptions
          </h3>
          <div className="space-y-2">
            {subscribers.map((subscriber) => (
              <div key={subscriber.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden"
                onClick={() => navigate(`/c/${subscriber.username}`)}>
                  {subscriber.avatar ? (
                    <img 
                      src={subscriber.avatar} 
                      alt={`${subscriber.username}'s avatar`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <span className="text-sm text-gray-700 truncate">
                  {subscriber.username}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed logout section */}
      <div className="border-t border-gray-200 p-4 flex-shrink-0">
        <button
          className="w-full flex items-center gap-3 p-2 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          onClick={() => setShowLogoutDialog(true)}
        >
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </div>

      {/* Toggle button */}
      <button
        className="absolute top-1/2 -right-3 bg-white border border-gray-200 rounded-full p-1 shadow-md"
        onClick={toggleSidebar}
      >
        {isVisible ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

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
  );
}

export { Sidebar };