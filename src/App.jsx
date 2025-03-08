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
import MyContentPage from "./components/content/MyContent.jsx";
import LikedContentPage from "./components/content/LikedContent.jsx";
import PlaylistCreate from "./components/PlaylistCreate";
import PlaylistView from "./components/PlaylistView";
//import PlaylistEdit from "./components/PlaylistEdit";
//import ChannelView from "./components/ChannelView";
import TweetCreate from "./components/tweet/TweetCreate";
import TweetShow from "./components/tweet/TweetShow.jsx";
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
      <Route path="/my-content" element={< MyContentPage/>} />

      <Route path="/likedContent" element={<LikedContentPage />} />
      <Route path="/create-playlist" element={<PlaylistCreate />} />
      <Route path="/playlist/:playlistId/:canEdit" element={<PlaylistView />} />

      <Route path="/tweets/create" element={<TweetCreate />} />
      <Route path="/tweet/:tweetId" element={<TweetShow />} />
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
          


          */

export default App;
