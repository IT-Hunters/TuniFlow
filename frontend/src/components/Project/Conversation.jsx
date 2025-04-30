import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import CoolSidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';
import './Conversation.css';

const Conversation = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userFullname, setUserFullname] = useState('');
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  const emojis = ["😊", "😂", "😍", "👍", "😢", "😡", "✨", "🎉"];

  // Initialiser Socket.IO
  useEffect(() => {
    socketRef.current = io('http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    // Gestion des événements de connexion
    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      setSocketStatus('connected');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setSocketStatus('disconnected');
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setSocketStatus('error');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Récupérer le profil utilisateur et le projet
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required. Please log in.');
          setLoading(false);
          return;
        }

        const [userResponse, projectResponse] = await Promise.all([
          axios.get('http://localhost:3000/users/findMyProfile', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:3000/users/findMyProject', {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        if (userResponse.data?._id) {
          localStorage.setItem('userId', userResponse.data._id);
          setUserId(userResponse.data._id);
          setUserFullname(userResponse.data.fullname || 'You');
        } else {
          throw new Error('User ID not found in profile response');
        }

        if (!projectResponse.data?.id) {
          setError('No project assigned to you.');
          setLoading(false);
          return;
        }

        setProjectId(projectResponse.data.id);
      } catch (err) {
        console.error('Error fetching profile/project:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load user data. Please try again.');
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Rejoindre la conversation et récupérer les messages
  useEffect(() => {
    if (!projectId || !userId) return;

    const socket = socketRef.current;
    console.log(`Joining conversation room for project: ${projectId}`);

    const handleNewMessage = (data) => {
      console.log('Received socket message:', data);
      if (data.projectId === projectId.toString()) {
        setMessages(prev => {
          const exists = prev.some(msg => 
            msg._id?.toString() === data.message._id?.toString() ||
            (msg.tempId && msg.tempId === data.message.tempId)
          );
          
          if (!exists) {
            return [...prev, {
              ...data.message,
              sender: data.message.sender || { _id: userId, fullname: 'You' }
            }];
          }
          return prev;
        });
      }
    };

    // Rejoindre la room
    socket.emit('joinProjectConversation', projectId.toString());
    
    // Écouter les nouveaux messages
    socket.on('newProjectMessage', handleNewMessage);

    // Récupérer les messages initiaux
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:5000/project-conversations/${projectId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Normalisation des messages reçus
        const normalizedMessages = response.data.messages?.map(msg => ({
          ...msg,
          sender: msg.sender || { _id: msg.senderId, fullname: 'Unknown' }
        })) || [];
        
        setMessages(normalizedMessages);
      } catch (err) {
        console.error('Error fetching messages:', err);
        let errorMessage;
        if (err.response?.status === 404) {
          errorMessage = 'No conversation found for this project.';
        } else if (err.response?.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
          navigate('/login');
        } else {
          errorMessage = err.response?.data?.message || 'Failed to load messages.';
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    return () => {
      socket.off('newProjectMessage', handleNewMessage);
      socket.emit('leaveProjectConversation', projectId.toString());
    };
  }, [projectId, userId, navigate]);

  // Faire défiler vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token || !projectId || !userId || !newMessage.trim()) {
      setError('Please fill all required fields.');
      return;
    }

    const tempId = Date.now().toString();
    const tempMessage = {
      tempId,
      content: newMessage,
      sender: { 
        _id: userId, 
        fullname: userFullname,
        email: ''
      },
      timestamp: new Date().toISOString(),
      isSending: true
    };

    // Optimistic update
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setShowEmojiPicker(false);

    try {
      const response = await axios.post(
        `http://localhost:5000/project-conversations/${projectId}/messages`,
        { content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Replace temp message with server response
      setMessages(prev => prev.map(msg => 
        msg.tempId === tempId ? {
          ...response.data.newMessage,
          sender: response.data.newMessage.sender || {
            _id: userId,
            fullname: userFullname,
            email: ''
          }
        } : msg
      ));
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.message || 'Failed to send message.');
      
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.tempId !== tempId));
    }
  };

  const handleEmojiClick = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="container">
      <CoolSidebar />
      <div className="main">
        <Navbar />
        <div className="content">
          <h1>Project Conversation</h1>

          <div className={`socket-status socket-${socketStatus}`}>
            Status: {socketStatus === 'connected' ? 'Online' : 'Offline'}
          </div>

          {loading ? (
            <div className="alert alert-loading">Loading conversation...</div>
          ) : error ? (
            <div className="alert alert-error">{error}</div>
          ) : (
            <div className="conversation-container">
              <div className="messages-box">
                {messages.map((message, index) => {
                  const isCurrentUser = message.sender?._id === userId;
                  return (
                    <div 
                      key={message._id || message.tempId || index} 
                      className={`message-item ${isCurrentUser ? 'self' : 'other'} ${message.isSending ? 'sending' : ''}`}
                    >
                      <div className="message-content-container">
                        {!isCurrentUser && (
                          <div className="message-sender-name">
                            {message.sender?.fullname || 'Unknown'}
                          </div>
                        )}
                        <div className="message-content">
                          {message.content}
                        </div>
                        <div className="message-meta">
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {message.isSending && (
                            <span className="message-status">Sending...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="message-form">
                <div className="input-area">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="message-input"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="emoji-button"
                    onClick={() => setShowEmojiPicker(prev => !prev)}
                    disabled={loading}
                  >
                    😊
                  </button>

                  {showEmojiPicker && (
                    <div className="emoji-picker">
                      {emojis.map((emoji, index) => (
                        <span
                          key={index}
                          className="emoji"
                          onClick={() => handleEmojiClick(emoji)}
                        >
                          {emoji}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={!newMessage.trim() || loading}
                >
                  {loading ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Conversation;