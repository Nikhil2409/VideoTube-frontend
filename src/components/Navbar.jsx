import { Bell, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user } = useAuth();

  return (
    <div className="bg-white shadow-md p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">Dashboard</h1>
      <div className="flex items-center gap-4">
        <Bell className="w-6 h-6 text-gray-600 cursor-pointer" />
        <div className="flex items-center gap-2">
          <User className="w-6 h-6 text-gray-600" />
          <span className="text-gray-700 font-medium">{user?.fullName}</span>
        </div>
      </div>
    </div>
  );
}

export { Navbar };
