import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function AuthPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (endpoint) => {
    try {
      setIsLoading(true);
      setMessage("");
      
      const payload = {
        username,
        password
      };
      
      console.log("Sending auth request:", {
        endpoint,
        payload,
        url: `http://localhost:3900/api/v1/users/${endpoint}`
      });

      const response = await fetch(`http://localhost:3900/api/v1/users/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include" // Important for cookies
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Authentication failed");
      }
      
      const data = await response.json();
      console.log("Response Data:", data);
      
      if (data && data.data && data.data.accessToken) {
        login(data.data.accessToken);
        setMessage("Success! You are logged in.");
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        setMessage("Login successful but token was not received.");
      }
    } catch (error) {
      console.error("Error details:", error);
      setMessage(error.message || "Server error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-4">Sign In</h2>
        <input
          type="text"
          placeholder="Username"
          className="w-full p-2 border rounded mb-2"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          className={`w-full ${isLoading ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'} text-white py-2 rounded mb-2`}
          onClick={() => handleAuth("login")}
          disabled={isLoading}
        >
          {isLoading ? "Signing In..." : "Sign In"}
        </button>

        <button
          className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
          onClick={() => navigate("/register")}
          disabled={isLoading}
        >
          Register User
        </button>

        {message && <p className={`text-center text-sm mt-2 ${message.includes("Success") ? "text-green-600" : "text-red-600"}`}>{message}</p>}
      </div>
    </div>
  );
}

export default AuthPage;