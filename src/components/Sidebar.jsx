import { NavLink, useNavigate } from "react-router-dom";
import { Home, User, LogOut } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

function Sidebar() {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const api = axios.create({
    baseURL: "http://localhost:3900",
    withCredentials: true,
  });

  const handleLogout = async () => {
    try {
      await api.post("/api/v1/users/logout", {}, { withCredentials: true });
      logout();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="w-64 bg-white shadow-lg h-screen p-6 flex flex-col">
      <nav className="flex flex-col gap-4">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 ${
              isActive ? "bg-gray-200" : ""
            }`
          }
        >
          <Home className="w-5 h-5" /> Home
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 ${
              isActive ? "bg-gray-200" : ""
            }`
          }
        >
          <User className="w-5 h-5" /> Profile
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
          <DialogTitle className="text-xl font-semibold mb-4">
            Are you sure you want to log out?
          </DialogTitle>
          <DialogFooter className="mt-4 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
            >
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
