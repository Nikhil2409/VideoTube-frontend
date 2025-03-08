import React, { useState } from "react";
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

function Sidebar() {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

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
    { 
      icon: User, 
      label: "Profile", 
      path: "/profile",
      activeCondition: (path) => path === "/profile"
    },
  ];

  return (
    <div className="w-64 bg-white border-r shadow-lg h-screen p-4 flex flex-col overflow-y-auto">
      <div className="mb-8 flex items-center space-x-3 px-2">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            {user?.fullName || 'Creator'}
          </h2>
          <p className="text-xs text-gray-500">
            {user?.email || 'Welcome back!'}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
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

      <div className="border-t pt-4">
        <button
          className="w-full flex items-center gap-3 p-2 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          onClick={() => setShowLogoutDialog(true)}
        >
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </div>

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