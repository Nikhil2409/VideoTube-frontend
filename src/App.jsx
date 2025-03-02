import { Routes, Route } from "react-router-dom";
import AuthPage from "./components/Authpage.jsx";
import RegisterUser from "./components/RegisterUser";
import Dashboard from "./components/Dashboard.jsx";
import Profile from "./components/Profile/Profile.jsx";
import EditProfile from "./components/Profile/EditProfile.jsx";
//import VideoUpload from "./components/VideoUpload";
//import VideoPlayer from "./components/VideoPlayer";
//import VideoEdit from "./components/VideoEdit";
//import Explore from "./components/Explore";
//import PlaylistCreate from "./components/PlaylistCreate";
//import PlaylistView from "./components/PlaylistView";
//import PlaylistEdit from "./components/PlaylistEdit";
//import ChannelView from "./components/ChannelView";
//import TweetCreate from "./components/TweetCreate";
//import TweetEdit from "./components/TweetEdit";
//import WatchHistory from "./components/WatchHistory";

function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/" element={<AuthPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<RegisterUser />} />

      {/* Main Dashboard */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* User Profile */}
      <Route path="/profile" element={<Profile />} />
      <Route path="/edit-profile" element={<EditProfile />} />
    </Routes>
  );
}

/*         <Route path="/channel/:username" element={<ChannelView />} /> 
          
          <Route path="/upload" element={<VideoUpload />} />
          <Route path="/video/:videoId" element={<VideoPlayer />} />
          <Route path="/video/edit/:videoId" element={<VideoEdit />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/history" element={<WatchHistory />} />
          
        
          <Route path="/playlist/create" element={<PlaylistCreate />} />
          <Route path="/playlist/:playlistId" element={<PlaylistView />} />
          <Route path="/playlist/edit/:playlistId" element={<PlaylistEdit />} />
          
          <Route path="/tweets/create" element={<TweetCreate />} />
          <Route path="/tweet/edit/:tweetId" element={<TweetEdit />} />

          */

export default App;
