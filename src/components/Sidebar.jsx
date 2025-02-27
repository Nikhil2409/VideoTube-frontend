import { NavLink } from "react-router-dom";
import { Home, User, LogOut } from "lucide-react";

function Sidebar() {
  return (
    <div className="w-64 bg-white shadow-lg h-screen p-6 flex flex-col">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
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
          <User className="w-5 h-5" /> Profile
        </NavLink>
      </nav>
      <div className="mt-auto">
        <button className="flex items-center gap-2 p-2 text-red-600 rounded-lg hover:bg-gray-100 w-full">
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </div>
    </div>
  );
}

export { Sidebar };