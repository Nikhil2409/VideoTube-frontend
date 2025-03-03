import { Bell, User, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/c/${searchQuery.trim()}`);
      setSearchQuery("");
    }
  };

  return (
    <div className="bg-white shadow-md p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">Dashboard</h1>
      
      <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a channel..."
            className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <button 
            type="submit" 
            className="absolute inset-y-0 right-0 px-3 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
          >
            Search
          </button>
        </div>
      </form>
      
      <div className="flex items-center gap-4">
      <button
            type="button"
            style={{
              backgroundColor: "#4caf50",
              color: "white",
              padding: "5px 10px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              flex: 1,
              margin: "0 0 0 5px",
            }}
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </button>
        <div className="flex items-center gap-2">
          <User className="w-6 h-6 text-gray-600" />
          <span className="text-gray-700 font-medium">{user?.fullName}</span>
        </div>
      </div>
    </div>
  );
}

export { Navbar };