import { Routes, Route } from "react-router-dom";
import AuthPage from "./components/Authpage.jsx";
import RegisterUser from "./components/RegisterUser.jsx";
import Dashboard from "./components/content/Dashboard.jsx";
import Profile from "./components/Profile/Profile.jsx";
import EditProfile from "./components/Profile/EditProfile.jsx";
import Channel from "./components/Channel/Channel.jsx";
import VideoUpload from "./components/Channel/video/VideoUpload.jsx";
import VideoPlayer from "./components/Channel/video/VideoPlayer.jsx";
import Explore from "./components/content/Explore.jsx";
import MyContentPage from "./components/content/MyContent.jsx";
import LikedContentPage from "./components/content/LikedContent.jsx";
import PlaylistCreate from "./components/playlist/PlaylistCreate.jsx";
import PlaylistView from "./components/playlist/PlaylistView.jsx";
import ChatPage from "./components/chat/ChatPage.jsx";
import TweetCreate from "./components/Channel/tweet/TweetCreate.jsx";
import TweetShow from "./components/Channel/tweet/TweetShow.jsx";
import { ReduxProvider } from "./ReduxProvider";
import { AuthProvider } from "./context/AuthContext.jsx";

function App() {
  return (
    <ReduxProvider>
      <AuthProvider>
        <Routes>
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
          <Route path="/my-content" element={<MyContentPage />} />

          <Route path="/likedContent" element={<LikedContentPage />} />
          <Route path="/create-playlist" element={<PlaylistCreate />} />
          <Route
            path="/playlist/:playlistId/:canEdit"
            element={<PlaylistView />}
          />

          <Route path="/tweets/create" element={<TweetCreate />} />
          <Route path="/tweet/:tweetId" element={<TweetShow />} />

          <Route path="/chat" element={<ChatPage />} />
        </Routes>
      </AuthProvider>
    </ReduxProvider>
  );
}

export default App;
