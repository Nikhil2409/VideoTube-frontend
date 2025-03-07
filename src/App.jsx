import { Routes, Route } from "react-router-dom";
import AuthPage from "./components/Authpage.jsx";
import RegisterUser from "./components/RegisterUser.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Profile from "./components/Profile/Profile.jsx";
import EditProfile from "./components/Profile/EditProfile.jsx";
import Channel from "./components/Channel/Channel.jsx"
import VideoUpload from "./components/video/VideoUpload.jsx";
import VideoPlayer from "./components/video/VideoPlayer.jsx";
import Explore from "./components/Explore.jsx";
import MyVideosPage from "./components/video/MyVideos.jsx";
import LikedVideosPage from "./components/video/LikedVideos.jsx";
import PlaylistCreate from "./components/PlaylistCreate";
import PlaylistView from "./components/PlaylistView";
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
      <Route path="/c/:username" element={<Channel />} /> 

      <Route path="/VideoUpload" element={<VideoUpload />} />
      <Route path="/video/:videoId" element={<VideoPlayer />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/my-videos" element={< MyVideosPage/>} />

      <Route path="/likedVideos" element={<LikedVideosPage />} />
      <Route path="/create-playlist" element={<PlaylistCreate />} />
      <Route path="/playlist/:playlistId" element={<PlaylistView />} />
    </Routes>
  );
}

/*        
          
          <Route path="/upload" element={<VideoUpload />} />
          <Route path="/video/:videoId" element={<VideoPlayer />} />
          <Route path="/video/edit/:videoId" element={<VideoEdit />} />
          
          <Route path="/history" element={<WatchHistory />} />
          
        
          <Route path="/playlist/create" element={<PlaylistCreate />} />

          <Route path="/playlist/edit/:playlistId" element={<PlaylistEdit />} />
          
          <Route path="/tweets/create" element={<TweetCreate />} />
          <Route path="/tweet/edit/:tweetId" element={<TweetEdit />} />

          */

export default App;
