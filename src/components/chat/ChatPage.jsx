import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


const ChatPage = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [rooms, setRooms] = useState(['general', 'tech', 'random']);
  const [joined, setJoined] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [roomMembers, setRoomMembers] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('room'); // 'room' or 'dm'
  const [selectedUser, setSelectedUser] = useState(null);
  const [privateMessages, setPrivateMessages] = useState({});
  const [showUserList, setShowUserList] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const userListRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.username) {
      setUsername(user.username);
    }
  }, [user]);

  // Initialize socket connection as early as possible
  useEffect(() => {
    // Only initialize socket if we have a username
    if (!username) return;
    
    const newSocket = io(process.env.REACT_APP_SERVER_URL, {
      withCredentials: true,
      query: {
        userId: user?._id || username, // Use user ID if available, otherwise username
        username: username
      }
    });
    
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server with ID:', newSocket.id);
      // Request online users immediately after connecting
      newSocket.emit('get-online-users');
    });

    newSocket.on('receive-message', (message) => {
      if (activeTab === 'room' && message.roomId === room) {
        setMessages((prevMessages) => [...prevMessages, {
          username: message.senderName || message.senderId,
          text: message.content,
          time: message.timestamp,
          type: 'message'
        }]);
      }
    });

    // Receive private message
    newSocket.on('private-message', (message) => {
      const senderId = message.senderId;
      const senderName = message.senderName || senderId;
      
      setPrivateMessages(prev => {
        const userMessages = prev[senderId] || [];
        return {
          ...prev,
          [senderId]: [...userMessages, {
            username: senderName,
            text: message.content,
            time: message.timestamp,
            type: 'message',
            read: activeTab === 'dm' && selectedUser === senderId
          }]
        };
      });
      
      // If message is from the currently selected user, no need for notification
      if (activeTab === 'dm' && selectedUser === senderId) {
        return;
      }
      
      // Show notification or indicator
      showNotification(`New message from ${senderName}`);
    });

    // Handle delivery confirmations
    newSocket.on('private-message-delivered', (data) => {
      console.log('Message delivered to:', data.receiverName);
      // You could update UI to show delivered status if you want
    });

    // Handle delivery failures
    newSocket.on('private-message-failed', (data) => {
      console.error('Message failed to deliver:', data.reason);
      // You could add this message to the chat or show an error
      if (data.receiverId === selectedUser) {
        setPrivateMessages(prev => {
          const userMessages = prev[selectedUser] || [];
          return {
            ...prev,
            [selectedUser]: [...userMessages, {
              username: 'System',
              text: `Message could not be delivered: ${data.reason}`,
              time: data.timestamp,
              type: 'system'
            }]
          };
        });
      }
    });

    newSocket.on('user-joined', (data) => {
      if (data.username !== username && data.roomId === room) {
        setMessages((prevMessages) => [...prevMessages, {
          username: 'System',
          text: `${data.username} has joined the room`,
          time: data.timestamp,
          type: 'system'
        }]);
      }
      
      // Request updated online users list
      newSocket.emit('get-online-users');
    });

    newSocket.on('user-left', (data) => {
      if (data.username !== username && data.roomId === room) {
        setMessages((prevMessages) => [...prevMessages, {
          username: 'System',
          text: `${data.username} has left the room`,
          time: data.timestamp,
          type: 'system'
        }]);
      }
      
      // Request updated online users list
      newSocket.emit('get-online-users');
    });

    // Get list of all connected users
    newSocket.on('online-users', (users) => {
      // Filter out current user from the online users list
      const filteredUsers = users.filter(u => u.userId !== user?._id && u.username !== username);
      console.log('Online users received:', filteredUsers);
      setOnlineUsers(filteredUsers);
    });

    newSocket.on('user-typing', (data) => {
      if (data.isPrivate) {
        // Handle private typing indicator for DMs
        if (activeTab === 'dm' && selectedUser === data.userId) {
          setTypingUsers(prev => {
            if (!prev.some(user => user.userId === data.userId)) {
              return [...prev, data];
            }
            return prev;
          });
        }
      } else if (data.roomId === room) {
        // Handle room typing indicator
        setTypingUsers(prev => {
          if (!prev.some(user => user.userId === data.userId)) {
            return [...prev, data];
          }
          return prev;
        });
      }
      
      setTimeout(() => {
        setTypingUsers(prev => prev.filter(user => user.userId !== data.userId));
      }, 3000);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return () => {
      if (room && joined) {
        newSocket.emit('leave-room', room);
      }
      newSocket.disconnect();
    };
  }, [username, user?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, privateMessages, selectedUser, activeTab]);

  // Handle clicks outside the user list panel to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (userListRef.current && !userListRef.current.contains(event.target) && 
          !event.target.closest('[data-users-toggle]')) {
        setShowUserList(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const joinRoom = (e) => {
    e.preventDefault();
    if (username && room) {
      socket.emit('join-room', room);
      setJoined(true);
      setMessages([]);
      setActiveTab('room');
      
      const joinMessage = {
        username: 'System',
        text: `You have joined the room ${room}`,
        time: new Date().toISOString(),
        type: 'system'
      };
      setMessages([joinMessage]);
      
      // Request online users
      socket.emit('get-online-users');
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    if (activeTab === 'room' && joined) {
      const messageData = {
        content: message,
        senderId: user?._id || username,
        senderName: username,
        roomId: room,
        timestamp: new Date().toISOString()
      };
      
      socket.emit('send-message', messageData);
      
      setMessages(prevMessages => [...prevMessages, {
        username: username,
        text: message,
        time: new Date().toISOString(),
        type: 'message'
      }]);
    } else if (activeTab === 'dm' && selectedUser) {
      // Send private message
      const privateMessageData = {
        content: message,
        senderId: user?._id || username,
        senderName: username,
        receiverId: selectedUser,
        messageId: Date.now().toString(), // For tracking message delivery
        timestamp: new Date().toISOString()
      };
      
      socket.emit('private-message', privateMessageData);
      
      // Update private messages locally
      setPrivateMessages(prev => {
        const userMessages = prev[selectedUser] || [];
        return {
          ...prev,
          [selectedUser]: [...userMessages, {
            username: username, // Your own username for sent messages
            text: message,
            time: new Date().toISOString(),
            type: 'message'
          }]
        };
      });
    }
    
    setMessage('');
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Explicitly stop typing indicator on the server
    if (activeTab === 'room') {
      socket.emit('typing', {
        userId: user?._id || username,
        username: username,
        roomId: room,
        isTyping: false
      });
    } else if (activeTab === 'dm' && selectedUser) {
      socket.emit('typing', {
        userId: user?._id || username,
        username: username,
        receiverId: selectedUser,
        isTyping: false
      });
    }
  };

  const handleTyping = (e) => {
    const typedMessage = e.target.value;
    setMessage(typedMessage);
    
    if (!isTyping && typedMessage) {
      setIsTyping(true);
      if (activeTab === 'room') {
        socket.emit('typing', {
          userId: user?._id || username,
          username: username,
          roomId: room,
          isTyping: true
        });
      } else if (activeTab === 'dm' && selectedUser) {
        socket.emit('typing', {
          userId: user?._id || username,
          username: username,
          receiverId: selectedUser,
          isTyping: true
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
        if (activeTab === 'room') {
          socket.emit('typing', {
            userId: user?._id || username,
            username: username,
            roomId: room,
            isTyping: false
          });
        } else if (activeTab === 'dm' && selectedUser) {
          socket.emit('typing', {
            userId: user?._id || username,
            username: username,
            receiverId: selectedUser,
            isTyping: false
          });
        }
      }
    }, 3000);
  };

  const leaveRoom = () => {
    socket.emit('leave-room', room);
    setJoined(false);
    setRoom('');
    setMessages([]);
    setRoomMembers(0);
    setTypingUsers([]);
    setActiveTab('room');
    // Don't reset selectedUser to allow DM to persist when leaving a room
  };

  const startDirectMessage = (user) => {
    setSelectedUser(user.userId || user.username);
    setActiveTab('dm');
    setShowUserList(false);
    
    // Mark messages as read
    if (privateMessages[user.userId || user.username]) {
      setPrivateMessages(prev => ({
        ...prev,
        [user.userId || user.username]: prev[user.userId || user.username].map(msg => ({
          ...msg,
          read: true
        }))
      }));
    }
  };

  const showNotification = (message) => {
    // Simple browser notification
    if (Notification.permission === "granted") {
      new Notification("Messenger", { body: message });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification("Messenger", { body: message });
        }
      });
    }
  };

  // Function to get avatar based on username
  const getAvatar = (name) => {
    if (name === 'System') return '🔔';
    // Generate a consistent color based on username
    const charCode = name.charCodeAt(0) % 10;
    const emojis = ['😊', '🚀', '🔥', '💡', '🌟', '🎯', '🎨', '🎮', '🎧', '📱'];
    return emojis[charCode];
  };

  // Get room emoji based on room name
  const getRoomEmoji = (roomName) => {
    const roomEmojis = {
      'general': '💬',
      'tech': '💻',
      'random': '🎲'
    };
    return roomEmojis[roomName] || '🏠';
  };

  // Check if a user has unread messages
  const hasUnreadMessages = (userId) => {
    return privateMessages[userId] && 
           privateMessages[userId].some(msg => 
             msg.username !== username && 
             (!msg.read || msg.read === false)
           );
  };

  // Function to get current chat messages
  const getCurrentMessages = () => {
    if (activeTab === 'room') {
      return messages;
    } else if (activeTab === 'dm' && selectedUser) {
      return privateMessages[selectedUser] || [];
    }
    return [];
  };

  return (
    <div className="flex flex-col h-screen bg-cover bg-center bg-no-repeat p-4 font-sans"
    style={{
      backgroundImage: "url('/image.jpg')",
    }}>
     <div className="absolute top-4 left-4 z-10">
        <button 
          onClick={() => navigate(-1)} 
          className="bg-white/80 hover:bg-white transition-colors rounded-full p-2 shadow-md flex items-center justify-center"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
      </div>
            <div className="absolute inset-0 bg-blue bg-opacity-30"></div>
      <div className="max-w-5xl mx-auto w-full h-full flex flex-col rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm">
      <div className="bg-white bg-opacity-70 backdrop-blur-md p-3 text-center text-blue-600 text-opacity-100 text-sm">
      <h1 className="text-3xl font-bold text-center bg">Messenger</h1>
          <p className="text-center">Connect with people around the world</p>
        </div>
        
        {!joined && !selectedUser ? (
          <div className="flex-grow flex flex-col md:flex-row p-6 gap-6">
            {/* Left side: Join Room form */}
            <div className="flex-1">
              <div className="bg-white bg-opacity-20 backdrop-blur-md p-8 rounded-xl shadow-xl border border-white border-opacity-20 h-full">
                <h2 className="text-2xl font-bold mb-6 text-white text-center">Join a Room</h2>
                <form onSubmit={joinRoom} className="space-y-6">
                  <div>
                    <label className="block text-white font-medium mb-2">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full p-3 border-0 bg-white bg-opacity-20 backdrop-blur-md rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-white placeholder-opacity-60"
                      placeholder="Enter your name"
                      required
                      readOnly={user && user.username}
                    />
                    {user && user.username && (
                    <p className="text-xs text-blue-600 text-opacity-100 mt-1">
                    Auto-filled from your account
                  </p>                    )}
                  </div>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">Choose a Room</label>
                    <select
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      className="w-full p-3 border-0 bg-white bg-opacity-20 backdrop-blur-md rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white"
                      required
                    >
                      <option value="" className="text-gray-800">Select a room</option>
                      {rooms.map((r) => (
                        <option key={r} value={r} className="text-gray-800">
                          {getRoomEmoji(r)} {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-white text-blue-600 py-3 px-6 rounded-lg font-bold transform transition duration-200 hover:scale-105 hover:shadow-lg"
                  >
                    Join Conversation
                  </button>
                </form>
              </div>
            </div>
            
            {/* Right side: Online Users */}
            <div className="flex-1">
              <div className="bg-white bg-opacity-20 backdrop-blur-md p-8 rounded-xl shadow-xl border border-white border-opacity-20 h-full">
                <h2 className="text-2xl font-bold mb-6 text-white text-center">Online Users</h2>
                
                {!socket ? (
                  <div className="text-center text-white py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
                    <p className="mt-4">Connecting to chat server...</p>
                  </div>
                ) : onlineUsers.length === 0 ? (
                  <div className="text-white text-center py-8">
                    <p className="text-xl mb-2">No users online</p>
                    <p className="text-sm opacity-80">Be the first to start a conversation!</p>
                  </div>
                ) : (
                  <ul className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {onlineUsers.map((user) => (
                      <li key={user.userId || user.username}>
                        <button
                          onClick={() => startDirectMessage(user)}
                          className="w-full p-4 flex items-center text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
                        >
                          <span className="mr-3 text-lg">{getAvatar(user.username)}</span>
                          <span className="font-medium flex-grow text-left">{user.username}</span>
                          <span className="bg-blue-600 px-3 py-1 rounded-full text-sm">
                            Message
                          </span>
                          {hasUnreadMessages(user.userId || user.username) && (
                            <span className="ml-2 w-3 h-3 bg-red-500 rounded-full"></span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-grow flex flex-col bg-white bg-opacity-10 backdrop-blur-md overflow-hidden relative">
            {/* Chat header with tabs */}
            <div className="bg-white bg-opacity-20 backdrop-blur-md border-b border-white border-opacity-20">
              <div className="flex overflow-x-auto">
                {/* Home button to go back to selection screen */}
                <button
                  onClick={() => {
                    if (joined) {
                      socket.emit('leave-room', room);
                      setJoined(false);
                    }
                    setActiveTab('room');
                    setSelectedUser(null);
                  }}
                  className="px-6 py-4 font-medium text-white text-opacity-80 hover:bg-white hover:bg-opacity-10 transition-colors"
                >
                  <span className="mr-2">🏠</span> Home
                </button>
                
                {joined && (
                  <button
                    onClick={() => setActiveTab('room')}
                    className={`px-6 py-4 font-medium transition-colors ${
                      activeTab === 'room' 
                        ? 'text-white bg-purple-600 bg-opacity-50' 
                        : 'text-white text-opacity-80 hover:bg-white hover:bg-opacity-10'
                    }`}
                  >
                    {getRoomEmoji(room)} {room}
                    {activeTab !== 'room' && <span className="ml-2 px-2 py-0.5 text-xs bg-white bg-opacity-20 rounded-full">{roomMembers}</span>}
                  </button>
                )}
                
                {selectedUser && (
                  <button
                    onClick={() => setActiveTab('dm')}
                    className={`px-6 py-4 font-medium flex items-center transition-colors ${
                      activeTab === 'dm' 
                        ? 'text-white bg-purple-600 bg-opacity-50' 
                        : 'text-white text-opacity-80 hover:bg-white hover:bg-opacity-10'
                    }`}
                  >
                    <span className="mr-2">{getAvatar(onlineUsers.find(u => u.userId === selectedUser)?.username || selectedUser)}</span>
                    {onlineUsers.find(u => u.userId === selectedUser)?.username || selectedUser}
                    {activeTab !== 'dm' && hasUnreadMessages(selectedUser) && (
                      <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </button>
                )}
                
                <div className="ml-auto flex items-center pr-4">
                  <button
                    data-users-toggle
                    onClick={() => setShowUserList(!showUserList)}
                    className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white transition-colors relative"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a3 3 0 00-3-3h-2a3 3 0 00-3 3v1h8z" />
                    </svg>
                    <span className="ml-1 font-medium">
                      {onlineUsers.length}
                    </span>
                  </button>
                  
                  {joined && (
                    <button
                      onClick={leaveRoom}
                      className="ml-3 bg-red-500 bg-opacity-80 hover:bg-opacity-100 px-4 py-2 rounded-lg text-white font-medium transition-colors"
                    >
                      Leave Room
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Online users dropdown */}
            {showUserList && (
              <div 
                ref={userListRef}
                className="absolute right-4 top-16 z-10 w-64 bg-white bg-opacity-20 backdrop-blur-md rounded-lg shadow-xl border border-white border-opacity-20 p-2 max-h-64 overflow-y-auto"
              >
                <h3 className="text-white font-medium p-3 border-b border-white border-opacity-20">
                  Online Users ({onlineUsers.length})
                </h3>
                {onlineUsers.length === 0 ? (
                  <p className="text-white text-opacity-80 p-3 text-center italic">No other users online</p>
                ) : (
                  <ul>
                    {onlineUsers.map((user) => (
                      <li key={user.userId || user.username}>
                        <button
                          onClick={() => startDirectMessage(user)}
                          className="w-full p-3 flex items-center text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
                        >
                          <span className="mr-3 text-lg">{getAvatar(user.username)}</span>
                          <span className="font-medium">{user.username}</span>
                          {hasUnreadMessages(user.userId || user.username) && (
                            <span className="ml-auto w-3 h-3 bg-red-500 rounded-full"></span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            
            {/* Messages area */}
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              {getCurrentMessages().map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.type === 'system'
                      ? 'justify-center'
                      : msg.username === username
                      ? 'justify-end'
                      : 'justify-start'
                  }`}
                >
                  {msg.type !== 'system' && msg.username !== username && (
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center mr-3 text-lg">
                      {getAvatar(msg.username)}
                    </div>
                  )}
                  
                  <div
                    className={`p-4 rounded-2xl max-w-xs sm:max-w-sm break-words ${
                      msg.type === 'system'
                        ? 'bg-gray-700 bg-opacity-40 text-white text-center italic px-6'
                        : msg.username === username
                        ? 'bg-purple-600 text-white'
                        : 'bg-white bg-opacity-20 backdrop-blur-md text-white'
                    }`}
                  >
                    {msg.type !== 'system' && activeTab === 'room' && (
                      <div className={`font-semibold text-sm ${msg.username === username ? 'text-purple-200' : 'text-white'}`}>
                        {msg.username}
                      </div>
                    )}
                    <div className="mt-1">{msg.text}</div>
                    <div className="text-xs opacity-75 mt-1 text-right">
                      {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  
                  {msg.type !== 'system' && msg.username === username && (
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center ml-3 text-lg">
                      {getAvatar(msg.username)}
                    </div>
                  )}
                </div>
              ))}
              
              {typingUsers.length > 0 && typingUsers.some(user => 
                (activeTab === 'room' && !user.isPrivate) || 
                (activeTab === 'dm' && user.isPrivate && user.userId === selectedUser)
              ) && (
                <div className="flex items-center p-3 rounded-xl bg-white bg-opacity-10 text-white text-sm max-w-xs">
                  <div className="flex space-x-1 mr-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <div>
                    {activeTab === 'room' 
                      ? `${typingUsers.filter(u => !u.isPrivate).map(u => u.username).join(', ')} ${typingUsers.filter(u => !u.isPrivate).length === 1 ? 'is' : 'are'} typing...`
                      : `${onlineUsers.find(u => u.userId === selectedUser)?.username || selectedUser} is typing...`
                    }
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message input area */}
            <form onSubmit={sendMessage} className="p-4 border-t border-white border-opacity-20 flex">
              <input
                type="text"
                value={message}
                onChange={handleTyping}
                className="flex-grow p-3 bg-white bg-opacity-20 backdrop-blur-md rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-white placeholder-white placeholder-opacity-60"
                placeholder={activeTab === 'room' 
                  ? "Type your message to the room..." 
                  : `Type your message to ${onlineUsers.find(u => u.userId === selectedUser)?.username || selectedUser}...`
                }
              />
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-r-lg font-medium transition duration-200"
                disabled={!message.trim()}
              >
                Send
              </button>
            </form>
          </div>
        )}
        
        <div className="bg-white bg-opacity-70 backdrop-blur-md p-3 text-center text-blue-600 text-opacity-100 text-sm">
          © 2025 VideoTube | Real-time Messaging
        </div>
      </div>
    </div>
  );
};

export default ChatPage;