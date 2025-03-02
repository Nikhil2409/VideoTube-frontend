import { NavLink, useNavigate } from "react-router-dom";
import { Home, User, LogOut } from "lucide-react";
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogFooter 
} from "./ui/dialog";
import { Button } from "./ui/button";

function Sidebar() {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    // You can add your logout logic here (e.g., clearing auth tokens)
    // Then navigate to root
    navigate("/");
  };

  return (
    <div className="w-64 bg-white shadow-lg h-screen p-6 flex flex-col">
      <nav className="flex flex-col gap-4">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 ${isActive ? "bg-gray-200" : ""}`
          }
        >
          <Home className="w-5 h-5" /> Home
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 ${isActive ? "bg-gray-200" : ""}`
          }
        >
          <User className="w-5 h-5" onClick={() => navigate("/profile")} /> Profile
        </NavLink>
      </nav>
      <div className="mt-auto">
        <button 
          className="flex items-center gap-2 p-2 text-red-600 rounded-lg hover:bg-gray-100 w-full"
          onClick={() => setShowLogoutDialog(true)}
        >
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="text-xl font-semibold mb-4">Are you sure you want to log out?</DialogTitle>
          <DialogFooter className="mt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { Sidebar };