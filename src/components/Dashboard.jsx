import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "./ui/dialog";

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);

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
          <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Stats Cards */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{user.fullName}</p>
                <p className="text-gray-500">{user.email}</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Account Status</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-600 font-semibold">Active</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Role</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{user.role || "User"}</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Logout Button */}
          <div className="mt-6">
            <Button 
              variant="destructive" 
              onClick={() => setShowLogout(true)}
              className="px-6"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
      
      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogout} onOpenChange={setShowLogout}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="text-xl font-semibold mb-4">Are you sure you want to log out?</DialogTitle>
          <DialogFooter className="mt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowLogout(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { logout(); navigate("/login"); }}>Logout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Dashboard;