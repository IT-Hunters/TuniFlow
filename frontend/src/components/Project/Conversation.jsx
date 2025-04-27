import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import CoolSidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';
import './Conversation.css'; // Ton CSS

const Conversation = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  const emojis = ["😊", "😂", "😍", "👍", "😢", "😡", "✨", "🎉"]; // 🌟 Liste simple des emojis

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required. Please log in.');
          setLoading(false);
          return;
        }
        
        const userResponse = await axios.get('http://localhost:3000/users/findMyProfile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (userResponse.data?._id) {
          localStorage.setItem('userId', userResponse.data._id);
          setUserId(userResponse.data._id);
        }

        const projectResponse = await axios.get('http://localhost:3000/users/findMyProject', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!projectResponse.data?.id) {
          setError('No project assigned to you.');
          setLoading(false);
          return;
        }

        setProjectId(projectResponse.data.id);
        setLoading(false);
      } catch (err) {
        setError('Failed to load data. Please try again.');
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (!projectId) return;

    if (!socketRef.current) {
      socketRef.current = io('http://localhost:5000', { withCredentials: true });
    }

    const socket = socketRef.current;
    socket.emit('joinProjectConversation', projectId);

    socket.on('newProjectMessage', (data) => {
      setMessages(prev => [...prev, data.message]);
    });

    return () => {
      socket.off('newProjectMessage');
    };
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !projectId || !socketRef.current) return;

    socketRef.current.emit('newProjectMessage', {
      projectId,
      senderId: userId,
      content: newMessage
    });

    setNewMessage('');
    setShowEmojiPicker(false); // fermer picker après envoi (optionnel)
  };

  const handleEmojiClick = (emoji) => {
    setNewMessage((prev) => prev + emoji);
  };

  return (
    <div className="container">
      <CoolSidebar />
      <div className="main">
        <Navbar />
        <div className="content">
          <h1>Project Conversation</h1>

          {loading ? (
            <div className="alert alert-loading">Loading conversation...</div>
          ) : error ? (
            <div className="alert alert-error">{error}</div>
          ) : (
            <div className="conversation-container">
              <div className="messages-box">
                {messages.map((message, index) => (
                  <div key={index} className="message-item">
                    <div className="message-content">{message.content}</div>
                    <div className="message-meta">
                      {message.senderName || 'User'} - {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
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
                  />
                  <button
                    type="button"
                    className="emoji-button"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
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
                <button type="submit" className="btn btn-primary" disabled={!newMessage.trim()}>
                  Send
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
