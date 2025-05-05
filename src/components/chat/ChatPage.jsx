import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { useAuth } from "../../context/AuthContext";
import {
  ArrowLeft,
  Send,
  Users,
  Home,
  LogOut,
  Mic,
  Image,
  Smile,
  PlusCircle,
  Paperclip,
  Search,
  MoreHorizontal,
  Phone,
  Video,
  X,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const ChatPage = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [rooms, setRooms] = useState([
    {
      id: "general",
      name: "General",
      emoji: "💬",
      description: "Chat about anything and everything",
    },
    {
      id: "tech",
      name: "Technology",
      emoji: "💻",
      description: "Discuss the latest in tech and gadgets",
    },
    {
      id: "random",
      name: "Random",
      emoji: "🎲",
      description: "Random topics, memes, and fun stuff",
    },
    {
      id: "gaming",
      name: "Gaming",
      emoji: "🎮",
      description: "Gaming discussions and find teammates",
    },
    {
      id: "music",
      name: "Music",
      emoji: "🎵",
      description: "Share and discuss your favorite tunes",
    },
  ]);
  const [joined, setJoined] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [roomMembers, setRoomMembers] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("room"); // 'room' or 'dm'
  const [selectedUser, setSelectedUser] = useState(null);
  const [privateMessages, setPrivateMessages] = useState({});
  const [showUserList, setShowUserList] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showJoinScreen, setShowJoinScreen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [messageStatus, setMessageStatus] = useState({});
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const userListRef = useRef(null);
  const messageInputRef = useRef(null);
  const navigate = useNavigate();

  // Common emojis for quick use
  const quickEmojis = ["😊", "👍", "❤️", "😂", "🎉", "🔥", "👀", "✨"];

  // Simulated read receipts for DMs
  const simulatedReadStatus = {
    SENT: "sent",
    DELIVERED: "delivered",
    READ: "read",
  };

  useEffect(() => {
    if (user && user.username) {
      setUsername(user.username);
    }

    // Check for user preference on dark mode
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    setDarkMode(prefersDark);
  }, [user]);

  // Initialize socket connection as early as possible
  useEffect(() => {
    // Only initialize socket if we have a username
    if (!username) return;

    const newSocket = io(process.env.REACT_APP_SERVER_URL, {
      withCredentials: true,
      query: {
        userId: user?.id || username, // Use user ID if available, otherwise username
        username: username,
      },
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to server with ID:", newSocket.id);
      // Request online users immediately after connecting
      newSocket.emit("get-online-users");
    });

    newSocket.on("receive-message", (message) => {
      if (activeTab === "room" && message.roomId === room) {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            username: message.senderName || message.senderId,
            text: message.content,
            time: message.timestamp,
            type: "message",
          },
        ]);
      }
    });

    newSocket.on("room-count", (data) => {
      console.log(
        `Received room count for ${data.roomId}: ${data.count} members`
      );

      // Only update the count if this is for our current room
      if (room && data.roomId.toLowerCase() === room.toLowerCase() && joined) {
        console.log(`Updating room members count to: ${data.count}`);
        setRoomMembers(data.count);
      }
    });

    // Receive private message
    newSocket.on("private-message", (message) => {
      const senderId = message.senderId;
      const senderName = message.senderName || senderId;

      setPrivateMessages((prev) => {
        const userMessages = prev[senderId] || [];
        return {
          ...prev,
          [senderId]: [
            ...userMessages,
            {
              username: senderName,
              text: message.content,
              time: message.timestamp,
              type: "message",
              read: activeTab === "dm" && selectedUser === senderId,
            },
          ],
        };
      });

      // If message is from the currently selected user, no need for notification
      if (activeTab === "dm" && selectedUser === senderId) {
        return;
      }

      // Show notification or indicator
      showNotification(`New message from ${senderName}`);
    });

    // Handle delivery confirmations
    newSocket.on("private-message-delivered", (data) => {
      console.log("Message delivered to:", data.receiverName);
      setMessageStatus((prev) => ({
        ...prev,
        [data.messageId]: simulatedReadStatus.DELIVERED,
      }));
    });

    // Simulate read receipts after a delay (in a real app this would come from the server)
    setTimeout(() => {
      Object.keys(messageStatus).forEach((msgId) => {
        if (messageStatus[msgId] === simulatedReadStatus.DELIVERED) {
          setMessageStatus((prev) => ({
            ...prev,
            [msgId]: simulatedReadStatus.READ,
          }));
        }
      });
    }, 8000);

    // Handle delivery failures
    newSocket.on("private-message-failed", (data) => {
      console.error("Message failed to deliver:", data.reason);
      // You could add this message to the chat or show an error
      if (data.receiverId === selectedUser) {
        setPrivateMessages((prev) => {
          const userMessages = prev[selectedUser] || [];
          return {
            ...prev,
            [selectedUser]: [
              ...userMessages,
              {
                username: "System",
                text: `Message could not be delivered: ${data.reason}`,
                time: data.timestamp,
                type: "system",
              },
            ],
          };
        });
      }
    });

    newSocket.on("user-joined", (data) => {
      if (data.username !== username && data.roomId === room) {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            username: "System",
            text: `${data.username} has joined the room`,
            time: data.timestamp,
            type: "system",
          },
        ]);
      }

      // Always request updated online users list to refresh member counts
      newSocket.emit("get-online-users");
    });

    newSocket.on("user-left", (data) => {
      if (data.username !== username && data.roomId === room) {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            username: "System",
            text: `${data.username} has left the room`,
            time: data.timestamp,
            type: "system",
          },
        ]);
      }

      // Always request updated online users list to refresh member counts
      newSocket.emit("get-online-users");
    });

    // Get list of all connected users
    newSocket.on("online-users", (users) => {
      // Filter out current user from the online users list
      const filteredUsers = users.filter(
        (u) => u.userId !== user?.id && u.username !== username
      );
      console.log("Online users received:", filteredUsers);
      setOnlineUsers(filteredUsers);

      // Update room members count based on users in the current room
      if (room && joined) {
        const usersInRoom = users.filter((u) => u.currentRoom === room);
        setRoomMembers(usersInRoom.length);
      }
    });

    newSocket.on("user-typing", (data) => {
      if (data.isPrivate) {
        // Handle private typing indicator for DMs
        if (activeTab === "dm" && selectedUser === data.userId) {
          setTypingUsers((prev) => {
            if (!prev.some((user) => user.userId === data.userId)) {
              return [...prev, data];
            }
            return prev;
          });
        }
      } else if (data.roomId === room) {
        // Handle room typing indicator
        setTypingUsers((prev) => {
          if (!prev.some((user) => user.userId === data.userId)) {
            return [...prev, data];
          }
          return prev;
        });
      }

      setTimeout(() => {
        setTypingUsers((prev) =>
          prev.filter((user) => user.userId !== data.userId)
        );
      }, 3000);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    return () => {
      if (room && joined) {
        newSocket.emit("leave-room", room);
      }
      newSocket.disconnect();
    };
  }, [username, user?.id, activeTab, room, selectedUser, messageStatus]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, privateMessages, selectedUser, activeTab]);

  // Handle clicks outside the user list panel to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        userListRef.current &&
        !userListRef.current.contains(event.target) &&
        !event.target.closest("[data-users-toggle]")
      ) {
        setShowUserList(false);
      }

      // Close emoji picker when clicking outside
      if (
        showEmojiPicker &&
        !event.target.closest("[data-emoji-toggle]") &&
        !event.target.closest(".emoji-picker")
      ) {
        setShowEmojiPicker(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const joinRoom = (e) => {
    e.preventDefault();
    if (username && room) {
      socket.emit("join-room", room);
      setJoined(true);
      setMessages([]);
      setActiveTab("room");
      setShowJoinScreen(false);

      const joinMessage = {
        username: "System",
        text: `You have joined the ${rooms.find((r) => r.id === room)?.name || room} room`,
        time: new Date().toISOString(),
        type: "system",
      };
      setMessages([joinMessage]);

      // Explicitly request room count after joining
      socket.emit("get-room-count", room);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const messageId = Date.now().toString();

    if (activeTab === "room" && joined) {
      const messageData = {
        content: message,
        senderId: user?.id || username,
        senderName: username,
        roomId: room,
        timestamp: new Date().toISOString(),
      };

      socket.emit("send-message", messageData);

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          username: username,
          text: message,
          time: new Date().toISOString(),
          type: "message",
        },
      ]);
    } else if (activeTab === "dm" && selectedUser) {
      // Send private message
      const privateMessageData = {
        content: message,
        senderId: user?.id || username,
        senderName: username,
        receiverId: selectedUser,
        messageId: messageId,
        timestamp: new Date().toISOString(),
      };

      socket.emit("private-message", privateMessageData);

      // Update private messages locally
      setPrivateMessages((prev) => {
        const userMessages = prev[selectedUser] || [];
        return {
          ...prev,
          [selectedUser]: [
            ...userMessages,
            {
              username: username, // Your own username for sent messages
              text: message,
              time: new Date().toISOString(),
              type: "message",
              messageId: messageId,
            },
          ],
        };
      });

      // Set initial message status to sent
      setMessageStatus((prev) => ({
        ...prev,
        [messageId]: simulatedReadStatus.SENT,
      }));

      // After 1-2 seconds update to delivered for demo purposes
      setTimeout(
        () => {
          setMessageStatus((prev) => ({
            ...prev,
            [messageId]: simulatedReadStatus.DELIVERED,
          }));
        },
        1000 + Math.random() * 1000
      );
    }

    setMessage("");
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Explicitly stop typing indicator on the server
    if (activeTab === "room") {
      socket.emit("typing", {
        userId: user?.id || username,
        username: username,
        roomId: room,
        isTyping: false,
      });
    } else if (activeTab === "dm" && selectedUser) {
      socket.emit("typing", {
        userId: user?.id || username,
        username: username,
        receiverId: selectedUser,
        isTyping: false,
      });
    }

    // Focus back on the input
    messageInputRef.current?.focus();
  };

  const handleTyping = (e) => {
    const typedMessage = e.target.value;
    setMessage(typedMessage);

    if (!isTyping && typedMessage) {
      setIsTyping(true);
      if (activeTab === "room") {
        socket.emit("typing", {
          userId: user?.id || username,
          username: username,
          roomId: room,
          isTyping: true,
        });
      } else if (activeTab === "dm" && selectedUser) {
        socket.emit("typing", {
          userId: user?.id || username,
          username: username,
          receiverId: selectedUser,
          isTyping: true,
        });
      }
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      // Let the server know you stopped typing
      if (socket) {
        if (activeTab === "room") {
          socket.emit("typing", {
            userId: user?.id || username,
            username: username,
            roomId: room,
            isTyping: false,
          });
        } else if (activeTab === "dm" && selectedUser) {
          socket.emit("typing", {
            userId: user?.id || username,
            username: username,
            receiverId: selectedUser,
            isTyping: false,
          });
        }
      }
    }, 3000);
  };

  const leaveRoom = () => {
    socket.emit("leave-room", room);

    // Update socket query to indicate user is not in any room
    if (socket.io.opts.query) {
      socket.io.opts.query.currentRoom = "";
    }

    setJoined(false);
    setRoom("");
    setMessages([]);
    setRoomMembers(0);
    setTypingUsers([]);
    setActiveTab("room");
    setShowJoinScreen(true);

    // Request updated user list to refresh member counts for all clients
    socket.emit("get-online-users");

    // Don't reset selectedUser to allow DM to persist when leaving a room
  };

  const startDirectMessage = (user) => {
    setSelectedUser(user.userId || user.username);
    setActiveTab("dm");
    setShowUserList(false);
    setShowJoinScreen(false);

    // Mark messages as read
    if (privateMessages[user.userId || user.username]) {
      setPrivateMessages((prev) => ({
        ...prev,
        [user.userId || user.username]: prev[user.userId || user.username].map(
          (msg) => ({
            ...msg,
            read: true,
          })
        ),
      }));
    }
  };

  const showNotification = (message) => {
    // Simple browser notification
    if (Notification.permission === "granted") {
      new Notification("Messenger", { body: message });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("Messenger", { body: message });
        }
      });
    }
  };

  // Function to get avatar based on username
  const getAvatar = (name) => {
    if (!name) return "👤";
    if (name === "System") return "🔔";

    // Generate a consistent color and avatar based on username
    const charCode = name.charCodeAt(0) % 10;
    const emojis = ["😊", "🚀", "🔥", "💡", "🌟", "🎯", "🎨", "🎮", "🎧", "📱"];
    return emojis[charCode];
  };

  // Get room emoji based on room name
  const getRoomEmoji = (roomId) => {
    const room = rooms.find((r) => r.id === roomId);
    return room ? room.emoji : "🏠";
  };

  // Check if a user has unread messages
  const hasUnreadMessages = (userId) => {
    return (
      privateMessages[userId] &&
      privateMessages[userId].some(
        (msg) => msg.username !== username && (!msg.read || msg.read === false)
      )
    );
  };

  // Function to get current chat messages
  const getCurrentMessages = () => {
    if (activeTab === "room") {
      return messages;
    } else if (activeTab === "dm" && selectedUser) {
      return privateMessages[selectedUser] || [];
    }
    return [];
  };

  // Add emoji to message
  const addEmoji = (emoji) => {
    setMessage((prev) => prev + emoji);
    messageInputRef.current?.focus();
  };

  // Filter rooms or users based on search term
  const getFilteredRooms = () => {
    return rooms.filter(
      (room) =>
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getFilteredUsers = () => {
    return onlineUsers.filter((user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Get read status icon for messages
  const getReadStatusIcon = (messageId) => {
    if (!messageId) return null;

    const status = messageStatus[messageId];

    if (status === simulatedReadStatus.SENT) {
      return <Check size={14} className="text-gray-400" />;
    } else if (status === simulatedReadStatus.DELIVERED) {
      return (
        <div className="flex">
          <Check size={14} className="text-gray-400" />
          <Check size={14} className="text-gray-400 -ml-1" />
        </div>
      );
    } else if (status === simulatedReadStatus.READ) {
      return (
        <div className="flex">
          <Check size={14} className="text-blue-500" />
          <Check size={14} className="text-blue-500 -ml-1" />
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className={`flex flex-col h-screen ${darkMode ? "bg-gray-900" : "bg-gradient-to-br from-blue-50 to-indigo-100"}`}
    >
      {/* Background with blur effect */}
      <div
        className={`absolute inset-0 bg-no-repeat bg-cover bg-center`}
        style={{
          backgroundImage: `url('/image.jpg')`,
          filter: "blur(4px)",
          opacity: "0.12",
        }}
      />

      {/* Main container with glass effect */}
      <div className="relative z-10 flex flex-col h-full max-w-7xl mx-auto w-full my-4 rounded-xl overflow-hidden shadow-2xl">
        {/* Header area */}
        <div
          className={`${darkMode ? "bg-gray-800" : "bg-white"} border-b ${darkMode ? "border-gray-700" : "border-gray-100"} p-4 flex items-center justify-between`}
        >
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className={`${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"} rounded-full p-2 mr-4 transition-colors`}
            >
              <ArrowLeft size={20} />
            </button>
            <h1
              className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}
            >
              Messenger
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`${darkMode ? "bg-gray-700 text-yellow-400" : "bg-gray-100 text-gray-600"} p-2 rounded-full transition-colors`}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
            <div className="relative">
              <img
                src={user?.avatar || "/images/default-avatar.png"}
                alt={username}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.innerText = username?.charAt(0) || "U";
                  e.target.className = `${darkMode ? "bg-gray-700 text-white" : "bg-blue-100 text-blue-600"} flex items-center justify-center text-xl font-bold rounded-full h-10 w-10`;
                }}
                className="h-10 w-10 rounded-full object-cover border-2 border-blue-500"
              />
              <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></span>
            </div>
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex flex-grow overflow-hidden">
          {/* Left sidebar */}
          <div
            className={`w-80 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-r hidden md:block overflow-hidden flex-shrink-0`}
          >
            <div className="flex flex-col h-full">
              {/* Search bar */}
              <div className="p-4">
                <div
                  className={`relative ${darkMode ? "bg-gray-700" : "bg-gray-100"} rounded-full overflow-hidden`}
                >
                  <Search
                    size={18}
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                  />
                  <input
                    type="text"
                    placeholder="Search rooms and users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full py-2.5 pl-10 pr-4 ${darkMode ? "bg-gray-700 text-white placeholder-gray-400" : "bg-gray-100 text-gray-800 placeholder-gray-500"} focus:outline-none`}
                  />
                </div>
              </div>

              {/* Tabs */}
              <div
                className={`flex border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
              >
                <button
                  onClick={() => setActiveTab("room")}
                  className={`flex-1 py-3 px-4 text-center font-medium ${
                    activeTab === "room"
                      ? darkMode
                        ? "text-blue-400 border-b-2 border-blue-400"
                        : "text-blue-600 border-b-2 border-blue-600"
                      : darkMode
                        ? "text-gray-400"
                        : "text-gray-600"
                  }`}
                >
                  Rooms
                </button>
                <button
                  onClick={() => setActiveTab("dm")}
                  className={`flex-1 py-3 px-4 text-center font-medium relative ${
                    activeTab === "dm"
                      ? darkMode
                        ? "text-blue-400 border-b-2 border-blue-400"
                        : "text-blue-600 border-b-2 border-blue-600"
                      : darkMode
                        ? "text-gray-400"
                        : "text-gray-600"
                  }`}
                >
                  Direct Messages
                  {Object.keys(privateMessages).some((userId) =>
                    hasUnreadMessages(userId)
                  ) && (
                    <span className="absolute top-3 right-6 h-2 w-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
              </div>

              {/* Content based on active tab */}
              <div className="flex-grow overflow-y-auto p-2">
                {activeTab === "room" ? (
                  // Rooms list
                  <AnimatePresence>
                    {getFilteredRooms().map((roomItem) => (
                      <motion.div
                        key={roomItem.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <button
                          onClick={() => {
                            setRoom(roomItem.id);
                            setShowJoinScreen(
                              room !== roomItem.id ? true : false
                            );
                            if (room === roomItem.id && joined) {
                              setActiveTab("room");
                            }
                          }}
                          className={`w-full flex items-center p-3 rounded-lg mb-1 transition-colors ${
                            room === roomItem.id && joined
                              ? darkMode
                                ? "bg-blue-600 bg-opacity-20 text-blue-400"
                                : "bg-blue-50 text-blue-700"
                              : darkMode
                                ? "text-gray-300 hover:bg-gray-700"
                                : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <span className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-400 to-violet-500 text-white text-xl mr-3">
                            {roomItem.emoji}
                          </span>
                          <div className="flex-grow text-left">
                            <div
                              className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}
                            >
                              {roomItem.name}
                            </div>
                            <div
                              className={`text-xs mt-0.5 truncate ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                            >
                              {roomItem.description}
                            </div>
                          </div>
                          {room === roomItem.id && joined && (
                            <span
                              className={`text-xs rounded-full px-2 py-1 ${darkMode ? "bg-blue-800 text-blue-200" : "bg-blue-100 text-blue-700"}`}
                            >
                              Active
                            </span>
                          )}
                        </button>
                      </motion.div>
                    ))}

                    {/* Create new room placeholder */}
                    <div
                      className={`flex items-center justify-center p-3 rounded-lg mt-2 border border-dashed ${darkMode ? "border-gray-600 text-gray-400" : "border-gray-300 text-gray-500"}`}
                    >
                      <PlusCircle size={18} className="mr-2" />
                      <span>Create New Room</span>
                    </div>
                  </AnimatePresence>
                ) : (
                  // Direct messages list
                  <AnimatePresence>
                    {getFilteredUsers().length > 0 ? (
                      getFilteredUsers().map((user) => (
                        <motion.div
                          key={user.userId || user.username}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <button
                            onClick={() => startDirectMessage(user)}
                            className={`w-full flex items-center p-3 rounded-lg mb-1 transition-colors relative ${
                              selectedUser === (user.userId || user.username) &&
                              activeTab === "dm"
                                ? darkMode
                                  ? "bg-blue-600 bg-opacity-20 text-blue-400"
                                  : "bg-blue-50 text-blue-700"
                                : darkMode
                                  ? "text-gray-300 hover:bg-gray-700"
                                  : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            <span
                              className={`w-10 h-10 flex items-center justify-center rounded-full text-xl mr-3 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
                            >
                              {getAvatar(user.username)}
                            </span>
                            <div className="flex-grow text-left">
                              <div
                                className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}
                              >
                                {user.username}
                              </div>
                              <div
                                className={`text-xs mt-0.5 truncate ${
                                  hasUnreadMessages(
                                    user.userId || user.username
                                  )
                                    ? "text-blue-500 font-medium"
                                    : darkMode
                                      ? "text-gray-400"
                                      : "text-gray-500"
                                }`}
                              >
                                {typingUsers.some(
                                  (u) =>
                                    u.userId ===
                                      (user.userId || user.username) &&
                                    u.isPrivate
                                )
                                  ? "typing..."
                                  : "Online"}
                              </div>
                            </div>

                            {/* Online status indicator */}
                            <span className="h-3 w-3 bg-green-500 rounded-full absolute top-4 right-3"></span>

                            {/* Unread message indicator */}
                            {hasUnreadMessages(
                              user.userId || user.username
                            ) && (
                              <span className="absolute right-3 bottom-4 min-w-5 h-5 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs px-1.5">
                                {
                                  privateMessages[
                                    user.userId || user.username
                                  ]?.filter(
                                    (msg) =>
                                      msg.username !== username &&
                                      (!msg.read || msg.read === false)
                                  ).length
                                }
                              </span>
                            )}
                          </button>
                        </motion.div>
                      ))
                    ) : (
                      <div
                        className={`flex flex-col items-center justify-center p-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                      >
                        <Users size={48} className="mb-3 opacity-50" />
                        <p className="text-center mb-1">
                          No online users found
                        </p>
                        <p className="text-xs text-center opacity-75">
                          Check back later or invite others to join!
                        </p>
                      </div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>

          {/* Main chat content */}
          <div className="flex-grow flex flex-col overflow-hidden relative">
            {showJoinScreen && !selectedUser ? (
              /* Join Room */
              <div
                className={`flex flex-col items-center justify-center h-full ${darkMode ? "bg-gray-900" : "bg-white bg-opacity-75"} p-6`}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`max-w-md w-full p-8 rounded-xl shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"} overflow-hidden`}
                >
                  <div className="text-center mb-6">
                    <h2
                      className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}
                    >
                      {room
                        ? `Join ${rooms.find((r) => r.id === room)?.name || room} Room`
                        : "Select a Room to Join"}
                    </h2>
                    {room && (
                      <p
                        className={`mt-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}
                      >
                        {rooms.find((r) => r.id === room)?.description ||
                          "Start chatting with others"}
                      </p>
                    )}
                  </div>

                  <form onSubmit={joinRoom} className="space-y-4">
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Username
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className={`w-full p-3 rounded-lg ${
                          darkMode
                            ? "bg-gray-700 text-white placeholder-gray-400 border-gray-600"
                            : "bg-gray-50 text-gray-900 placeholder-gray-500 border-gray-200"
                        } border focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        placeholder="Enter your name"
                        required
                        readOnly={user && user.username}
                      />
                      {user && user.username && (
                        <p className="text-xs text-blue-500 mt-1">
                          Auto-filled from your account
                        </p>
                      )}
                    </div>

                    {!room && (
                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                        >
                          Select a Room
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {rooms.map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => setRoom(r.id)}
                              className={`p-3 rounded-lg border flex items-center transition-colors ${
                                darkMode
                                  ? "bg-gray-700 hover:bg-gray-600 border-gray-600 text-white"
                                  : "bg-white hover:bg-gray-50 border-gray-200 text-gray-800"
                              }`}
                            >
                              <span className="text-2xl mr-2">{r.emoji}</span>
                              <span className="font-medium">{r.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!username || !room}
                      className={`w-full p-3 rounded-lg flex items-center justify-center font-medium transition-transform transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                        darkMode
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      }`}
                    >
                      Join Room
                    </button>
                  </form>

                  <div
                    className={`mt-8 text-sm text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    <p>Or start a direct message with any online user</p>
                    <div className="flex flex-wrap justify-center mt-3 gap-2">
                      {onlineUsers.slice(0, 5).map((user) => (
                        <button
                          key={user.userId || user.username}
                          onClick={() => startDirectMessage(user)}
                          className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
                            darkMode
                              ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                          }`}
                        >
                          <span>{getAvatar(user.username)}</span>
                          <span>{user.username}</span>
                        </button>
                      ))}
                      {onlineUsers.length > 5 && (
                        <button
                          onClick={() => setShowUserList(true)}
                          className={`px-2 py-1 rounded-full ${
                            darkMode
                              ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                          }`}
                        >
                          +{onlineUsers.length - 5} more
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            ) : (
              /* Active chat */
              <>
                {/* Chat header */}
                <div
                  className={`border-b ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} py-3 px-4 flex items-center justify-between`}
                >
                  <div className="flex items-center">
                    {activeTab === "room" ? (
                      <>
                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-400 to-violet-500 text-white text-xl mr-3">
                          {getRoomEmoji(room)}
                        </div>
                        <div>
                          <h2
                            className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
                          >
                            {rooms.find((r) => r.id === room)?.name || room}
                          </h2>
                          <p
                            className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                          >
                            {roomMembers}{" "}
                            {roomMembers === 1 ? "member" : "members"} online
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          className={`w-10 h-10 flex items-center justify-center rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"} text-xl mr-3 relative`}
                        >
                          {getAvatar(
                            onlineUsers.find((u) => u.userId === selectedUser)
                              ?.username || selectedUser
                          )}
                          <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></span>
                        </div>
                        <div>
                          <h2
                            className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
                          >
                            {onlineUsers.find((u) => u.userId === selectedUser)
                              ?.username || selectedUser}
                          </h2>
                          <p
                            className={`text-xs ${
                              typingUsers.some(
                                (u) => u.userId === selectedUser && u.isPrivate
                              )
                                ? "text-blue-500"
                                : darkMode
                                  ? "text-gray-400"
                                  : "text-gray-500"
                            }`}
                          >
                            {typingUsers.some(
                              (u) => u.userId === selectedUser && u.isPrivate
                            )
                              ? "typing..."
                              : "Online"}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    {activeTab === "dm" && (
                      <>
                        <button
                          className={`p-2 rounded-full ${darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}
                        >
                          <Phone size={20} />
                        </button>
                        <button
                          className={`p-2 rounded-full ${darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}
                        >
                          <Video size={20} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setShowRoomInfo(!showRoomInfo)}
                      className={`p-2 rounded-full ${darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}
                    >
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                </div>

                {/* Info sidebar - conditionally rendered */}
                {showRoomInfo && (
                  <div
                    className={`absolute right-0 top-[61px] bottom-0 w-72 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-l shadow-lg z-10`}
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3
                          className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
                        >
                          {activeTab === "room"
                            ? "Room Information"
                            : "Contact Information"}
                        </h3>
                        <button
                          onClick={() => setShowRoomInfo(false)}
                          className={`p-1 rounded-full ${darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {activeTab === "room" ? (
                        <div>
                          <div className="flex items-center mb-4">
                            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-400 to-violet-500 text-white text-3xl mr-4">
                              {getRoomEmoji(room)}
                            </div>
                            <div>
                              <h4
                                className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}
                              >
                                {rooms.find((r) => r.id === room)?.name || room}
                              </h4>
                              <p
                                className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                              >
                                {rooms.find((r) => r.id === room)
                                  ?.description || "Chat Room"}
                              </p>
                            </div>
                          </div>

                          <div
                            className={`mb-4 pb-4 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
                          >
                            <p
                              className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}
                            >
                              {roomMembers}{" "}
                              {roomMembers === 1 ? "member" : "members"} online
                            </p>
                            <button
                              className={`mt-2 text-sm font-medium ${darkMode ? "text-blue-400" : "text-blue-600"}`}
                            >
                              View all members
                            </button>
                          </div>

                          <div>
                            <button
                              onClick={leaveRoom}
                              className={`flex items-center space-x-2 text-red-500 py-2 px-3 rounded-lg ${darkMode ? "hover:bg-gray-700" : "hover:bg-red-50"} transition-colors w-full`}
                            >
                              <LogOut size={18} />
                              <span>Leave Room</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex flex-col items-center mb-6">
                            <div
                              className={`w-20 h-20 flex items-center justify-center rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"} text-4xl mb-3 relative`}
                            >
                              {getAvatar(
                                onlineUsers.find(
                                  (u) => u.userId === selectedUser
                                )?.username || selectedUser
                              )}
                              <span className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 rounded-full border-2 border-white"></span>
                            </div>
                            <h4
                              className={`font-bold text-lg ${darkMode ? "text-white" : "text-gray-800"}`}
                            >
                              {onlineUsers.find(
                                (u) => u.userId === selectedUser
                              )?.username || selectedUser}
                            </h4>
                            <p
                              className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                            >
                              Online
                            </p>
                          </div>

                          <div
                            className={`grid grid-cols-2 gap-2 mb-4 pb-4 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
                          >
                            <button
                              className={`flex flex-col items-center p-3 rounded-lg ${darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800"}`}
                            >
                              <Phone size={20} className="mb-1" />
                              <span className="text-xs">Call</span>
                            </button>
                            <button
                              className={`flex flex-col items-center p-3 rounded-lg ${darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800"}`}
                            >
                              <Video size={20} className="mb-1" />
                              <span className="text-xs">Video</span>
                            </button>
                          </div>

                          {/* Shared media placeholder */}
                          <div className="mb-4">
                            <h5
                              className={`font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                            >
                              Shared Media
                            </h5>
                            <div
                              className={`flex items-center justify-center py-8 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}
                            >
                              <p
                                className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                              >
                                No shared media yet
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Messages area */}
                <div
                  className={`flex-grow overflow-y-auto p-4 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
                >
                  <div className="max-w-3xl mx-auto space-y-4">
                    {getCurrentMessages().length === 0 ? (
                      <div
                        className={`flex flex-col items-center justify-center py-12 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                      >
                        <div
                          className={`w-16 h-16 flex items-center justify-center rounded-full text-2xl ${darkMode ? "bg-gray-800" : "bg-gray-200"} mb-4`}
                        >
                          {activeTab === "room"
                            ? getRoomEmoji(room)
                            : getAvatar(
                                onlineUsers.find(
                                  (u) => u.userId === selectedUser
                                )?.username || selectedUser
                              )}
                        </div>
                        <h3
                          className={`text-xl font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}
                        >
                          {activeTab === "room"
                            ? `Welcome to ${rooms.find((r) => r.id === room)?.name || room}!`
                            : `Start chatting with ${onlineUsers.find((u) => u.userId === selectedUser)?.username || selectedUser}`}
                        </h3>
                        <p className="text-center max-w-sm">
                          {activeTab === "room"
                            ? `This is the beginning of the conversation in ${rooms.find((r) => r.id === room)?.name || room} room.`
                            : "Send a message to start the conversation."}
                        </p>
                      </div>
                    ) : (
                      getCurrentMessages().map((msg, index) => (
                        <div
                          key={index}
                          className={`flex ${
                            msg.type === "system"
                              ? "justify-center"
                              : msg.username === username
                                ? "justify-end"
                                : "justify-start"
                          }`}
                        >
                          {msg.type !== "system" &&
                            msg.username !== username && (
                              <div
                                className={`flex-shrink-0 h-8 w-8 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-300"} flex items-center justify-center mr-2 text-lg`}
                              >
                                {getAvatar(msg.username)}
                              </div>
                            )}

                          <div
                            className={`max-w-xs sm:max-w-md break-words rounded-2xl px-4 py-2 ${
                              msg.type === "system"
                                ? darkMode
                                  ? "bg-gray-800 text-gray-300 text-center text-sm italic"
                                  : "bg-gray-200 text-gray-600 text-center text-sm italic"
                                : msg.username === username
                                  ? darkMode
                                    ? "bg-blue-600 text-white"
                                    : "bg-blue-500 text-white"
                                  : darkMode
                                    ? "bg-gray-800 text-white"
                                    : "bg-white text-gray-800 shadow-sm"
                            }`}
                          >
                            {msg.type !== "system" &&
                              activeTab === "room" &&
                              msg.username !== username && (
                                <div
                                  className={`font-medium text-xs mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                                >
                                  {msg.username}
                                </div>
                              )}
                            <div>{msg.text}</div>
                            <div className="flex items-center justify-end mt-1 space-x-1">
                              <span
                                className={`text-xs ${
                                  msg.username === username
                                    ? darkMode
                                      ? "text-blue-200 opacity-80"
                                      : "text-blue-100 opacity-80"
                                    : darkMode
                                      ? "text-gray-400"
                                      : "text-gray-500"
                                }`}
                              >
                                {new Date(msg.time).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>

                              {/* Show read/delivered status only for sent direct messages */}
                              {activeTab === "dm" &&
                                msg.username === username &&
                                msg.messageId && (
                                  <span className="ml-1">
                                    {getReadStatusIcon(msg.messageId)}
                                  </span>
                                )}
                            </div>
                          </div>

                          {msg.type !== "system" &&
                            msg.username === username && (
                              <div
                                className={`flex-shrink-0 h-8 w-8 rounded-full ${darkMode ? "bg-blue-600" : "bg-blue-500"} flex items-center justify-center ml-2 text-lg text-white`}
                              >
                                {getAvatar(msg.username)}
                              </div>
                            )}
                        </div>
                      ))
                    )}

                    {/* Typing indicator */}
                    {typingUsers.length > 0 &&
                      typingUsers.some(
                        (user) =>
                          (activeTab === "room" && !user.isPrivate) ||
                          (activeTab === "dm" &&
                            user.isPrivate &&
                            user.userId === selectedUser)
                      ) && (
                        <div
                          className={`flex items-center ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                        >
                          <div
                            className={`flex-shrink-0 h-8 w-8 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-300"} flex items-center justify-center mr-2 text-lg`}
                          >
                            {activeTab === "room"
                              ? getAvatar(
                                  typingUsers.find((u) => !u.isPrivate)
                                    ?.username || "User"
                                )
                              : getAvatar(
                                  onlineUsers.find(
                                    (u) => u.userId === selectedUser
                                  )?.username || selectedUser
                                )}
                          </div>
                          <div
                            className={`rounded-2xl px-4 py-2 ${darkMode ? "bg-gray-800" : "bg-white"}`}
                          >
                            <div className="flex space-x-1">
                              <div
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0ms" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "150ms" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "300ms" }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}

                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Message input area */}
                <div
                  className={`p-3 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-t`}
                >
                  <form
                    onSubmit={sendMessage}
                    className="flex items-end space-x-2"
                  >
                    <div className="flex-shrink-0">
                      <button
                        type="button"
                        className={`p-2 rounded-full ${darkMode ? "text-gray-400 hover:text-gray-300 hover:bg-gray-700" : "text-gray-500 hover:text-gray-600 hover:bg-gray-100"}`}
                      >
                        <Paperclip size={20} />
                      </button>
                    </div>

                    <div className="relative flex-grow">
                      <textarea
                        ref={messageInputRef}
                        rows={1}
                        value={message}
                        onChange={handleTyping}
                        placeholder={
                          activeTab === "room"
                            ? `Message ${rooms.find((r) => r.id === room)?.name || room}...`
                            : `Message ${onlineUsers.find((u) => u.userId === selectedUser)?.username || selectedUser}...`
                        }
                        className={`w-full pr-12 py-3 px-4 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          darkMode
                            ? "bg-gray-700 text-white placeholder-gray-400 border-gray-600"
                            : "bg-gray-100 text-gray-900 placeholder-gray-500 border-transparent"
                        } border`}
                        style={{ minHeight: "44px", maxHeight: "120px" }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (message.trim()) {
                              sendMessage(e);
                            }
                          }
                        }}
                      ></textarea>

                      <div className="absolute right-2 bottom-2 flex">
                        <button
                          type="button"
                          data-emoji-toggle
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className={`p-1.5 rounded-full ${darkMode ? "text-gray-400 hover:text-gray-300 hover:bg-gray-600" : "text-gray-500 hover:text-gray-600 hover:bg-gray-200"}`}
                        >
                          <Smile size={18} />
                        </button>
                        <button
                          type="button"
                          className={`p-1.5 rounded-full ${darkMode ? "text-gray-400 hover:text-gray-300 hover:bg-gray-600" : "text-gray-500 hover:text-gray-600 hover:bg-gray-200"}`}
                        >
                          <Mic size={18} />
                        </button>
                      </div>

                      {/* Emoji picker */}
                      {showEmojiPicker && (
                        <div className="emoji-picker absolute bottom-14 right-0 bg-white rounded-lg shadow-lg p-2 border border-gray-200">
                          <div className="grid grid-cols-8 gap-1">
                            {quickEmojis.map((emoji, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => addEmoji(emoji)}
                                className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-100 rounded"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={!message.trim()}
                      className={`p-3 rounded-full ${
                        message.trim()
                          ? darkMode
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-blue-500 text-white hover:bg-blue-600"
                          : darkMode
                            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      } transition-colors`}
                    >
                      <Send size={20} />
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>

          {/* Mobile users drawer */}
          {showUserList && (
            <div
              ref={userListRef}
              className={`fixed inset-0 z-50 md:hidden ${darkMode ? "bg-gray-900 bg-opacity-90" : "bg-black bg-opacity-50"}`}
            >
              <div
                className={`w-3/4 max-w-xs h-full ${darkMode ? "bg-gray-800" : "bg-white"} ml-auto flex flex-col`}
              >
                <div
                  className={`p-4 border-b ${darkMode ? "border-gray-700" : "border-gray-200"} flex justify-between items-center`}
                >
                  <h3
                    className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
                  >
                    Online Users
                  </h3>
                  <button
                    onClick={() => setShowUserList(false)}
                    className={`p-1 rounded-full ${darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-3">
                  <div className="relative">
                    <Search
                      size={18}
                      className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                    />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full py-2.5 pl-10 pr-4 rounded-lg ${
                        darkMode
                          ? "bg-gray-700 text-white placeholder-gray-400 border-gray-600"
                          : "bg-gray-100 text-gray-800 placeholder-gray-500 border-transparent"
                      } border focus:outline-none`}
                    />
                  </div>
                </div>

                <div className="flex-grow overflow-y-auto p-2">
                  {getFilteredUsers().length > 0 ? (
                    getFilteredUsers().map((user) => (
                      <button
                        key={user.userId || user.username}
                        onClick={() => {
                          startDirectMessage(user);
                          setShowUserList(false);
                        }}
                        className={`w-full flex items-center p-3 rounded-lg mb-1 transition-colors ${
                          darkMode
                            ? "text-gray-300 hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <span
                          className={`w-10 h-10 flex items-center justify-center rounded-full text-xl mr-3 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
                        >
                          {getAvatar(user.username)}
                        </span>
                        <div className="flex-grow text-left">
                          <div
                            className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}
                          >
                            {user.username}
                          </div>
                          <div
                            className={`text-xs mt-0.5 ${
                              typingUsers.some(
                                (u) =>
                                  u.userId === (user.userId || user.username) &&
                                  u.isPrivate
                              )
                                ? "text-blue-500"
                                : darkMode
                                  ? "text-gray-400"
                                  : "text-gray-500"
                            }`}
                          >
                            {typingUsers.some(
                              (u) =>
                                u.userId === (user.userId || user.username) &&
                                u.isPrivate
                            )
                              ? "typing..."
                              : "Online"}
                          </div>
                        </div>

                        {/* Unread message indicator */}
                        {hasUnreadMessages(user.userId || user.username) && (
                          <span className="min-w-5 h-5 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs px-1.5">
                            {
                              privateMessages[
                                user.userId || user.username
                              ]?.filter(
                                (msg) =>
                                  msg.username !== username &&
                                  (!msg.read || msg.read === false)
                              ).length
                            }
                          </span>
                        )}
                      </button>
                    ))
                  ) : (
                    <div
                      className={`flex flex-col items-center justify-center p-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      <Users size={48} className="mb-3 opacity-50" />
                      <p className="text-center mb-1">No users found</p>
                      <p className="text-xs text-center opacity-75">
                        Try another search
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
