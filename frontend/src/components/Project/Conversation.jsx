import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
//import axios from 'axios';
import axios from '@/axios'
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
  const [soundEnabled, setSoundEnabled] = useState(localStorage.getItem('soundEnabled') !== 'false');
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const audioRef = useRef(new Audio('/notification-22-270130.mp3'));
  const navigate = useNavigate();

  const emojis = ['😊', '😂', '😍', '👍', '😢', '😡', '✨', '🎉'];

  // Initialiser Socket.IO
  useEffect(() => {
    socketRef.current = io('', {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connecté');
      setSocketStatus('connected');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket déconnecté');
      setSocketStatus('disconnected');
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Erreur de connexion Socket:', err);
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
          setError('Authentification requise. Veuillez vous connecter.');
          setLoading(false);
          return;
        }

        const [userResponse, projectResponse] = await Promise.all([
          axios.get('/users/findMyProfile', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('/users/findMyProject', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (userResponse.data?._id) {
          localStorage.setItem('userId', userResponse.data._id);
          setUserId(userResponse.data._id);
          setUserFullname(userResponse.data.fullname || 'Vous');
        } else {
          throw new Error('ID utilisateur non trouvé dans la réponse');
        }

        if (!projectResponse.data?.id) {
          setError('Aucun projet assigné.');
          setLoading(false);
          return;
        }

        setProjectId(projectResponse.data.id);
      } catch (err) {
        console.error('Erreur lors de la récupération du profil/projet:', err);
        setError(err.response?.data?.message || err.message || 'Échec du chargement des données utilisateur.');
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Rejoindre la conversation et récupérer les messages
  useEffect(() => {
    if (!projectId || !userId) return;

    const socket = socketRef.current;
    console.log(`Rejoindre la salle de conversation pour le projet: ${projectId}`);

    const handleNewMessage = (data) => {
      console.log('Message reçu via socket:', data);
      console.log('Tous les messages actuels:', messages.map((msg) => msg._id || msg.tempId));
      if (data.projectId === projectId.toString()) {
        setMessages((prev) => {
          const exists = prev.some(
            (msg) =>
              msg._id?.toString() === data.message._id?.toString() ||
              (msg.tempId && msg.tempId === data.message.tempId)
          );

          if (!exists) {
            if (data.message.sender?._id !== userId && soundEnabled) {
              audioRef.current.play().catch((err) => {
                console.error('Erreur lors de la lecture du son:', err);
              });
            }

            return [
              ...prev,
              {
                ...data.message,
                sender: data.message.sender || { _id: userId, fullname: 'Vous' }
              }
            ];
          }
          return prev;
        });
      }
    };

    socket.emit('joinProjectConversation', projectId.toString());
    socket.on('newProjectMessage', handleNewMessage);

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `/project-conversations/${projectId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const normalizedMessages = response.data.messages?.map((msg) => ({
          ...msg,
          sender: msg.sender || { _id: msg.senderId, fullname: 'Inconnu' }
        })) || [];

        setMessages(normalizedMessages);
      } catch (err) {
        console.error('Erreur lors de la récupération des messages:', err);
        let errorMessage;
        if (err.response?.status === 404) {
          errorMessage = 'Aucune conversation trouvée pour ce projet.';
        } else if (err.response?.status === 401) {
          errorMessage = 'Échec de l’authentification. Veuillez vous reconnecter.';
          navigate('/login');
        } else {
          errorMessage = err.response?.data?.message || 'Échec du chargement des messages.';
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
  }, [projectId, userId, navigate, soundEnabled]);

  // Faire défiler vers le bas pour les nouveaux messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Envoyer un message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token || !projectId || !userId || !newMessage.trim()) {
      setError('Veuillez remplir tous les champs requis.');
      return;
    }

    const tempId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
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

    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage('');
    setShowEmojiPicker(false);

    try {
      const response = await axios.post(
        `/project-conversations/${projectId}/messages`,
        { content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId
            ? {
                ...response.data.newMessage,
                sender: response.data.newMessage.sender || {
                  _id: userId,
                  fullname: userFullname,
                  email: ''
                }
              }
            : msg
        )
      );
    } catch (err) {
      console.error('Erreur lors de l’envoi du message:', err);
      setError(err.response?.data?.message || 'Échec de l’envoi du message.');
      setMessages((prev) => prev.filter((msg) => msg.tempId !== tempId));
    }
  };

  // Gérer le clic sur un emoji
  const handleEmojiClick = (emoji) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Activer/désactiver le son
  const toggleSound = () => {
    setSoundEnabled((prev) => {
      localStorage.setItem('soundEnabled', !prev);
      if (!prev) {
        audioRef.current.play().catch((err) => {
          console.error('Erreur lors du test de lecture du son:', err);
        });
      }
      return !prev;
    });
  };

  return (
    <div className="container">
      <CoolSidebar />
      <div className="main">
        <Navbar />
        <div className="content">
          <h1>Conversation du Projet</h1>

          <div className={`socket-status socket-${socketStatus}`}>
            Statut: {socketStatus === 'connected' ? 'En ligne' : 'Hors ligne'}
          </div>

          <button
            onClick={toggleSound}
            className="btn btn-secondary"
            style={{ marginBottom: '10px' }}
          >
            {soundEnabled ? 'Désactiver le son' : 'Activer le son'}
          </button>

          {loading ? (
            <div className="alert alert-loading">Chargement de la conversation...</div>
          ) : error ? (
            <div className="alert alert-error">{error}</div>
          ) : (
            <div className="conversation-container">
              <div className="messages-box" role="log" aria-live="polite">
                {messages.map((message) => {
                  const isCurrentUser = message.sender?._id === userId;
                  return (
                    <div
                      key={message._id || message.tempId}
                      className={`message-item ${isCurrentUser ? 'self' : 'other'} ${
                        message.isSending ? 'sending' : ''
                      }`}
                    >
                      <div className="message-content-container">
                        {!isCurrentUser && (
                          <div className="message-sender-name">
                            {message.sender?.fullname || 'Inconnu'}
                          </div>
                        )}
                        <div className="message-content">{message.content}</div>
                        <div className="message-meta">
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {message.isSending && (
                            <span className="message-status">
                              <span className="spinner"></span> Envoi...
                            </span>
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
                    placeholder="Tapez votre message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="message-input"
                    disabled={loading}
                    aria-label="Champ de saisie du message"
                  />
                  <button
                    type="button"
                    className={`emoji-button ${showEmojiPicker ? 'active' : ''}`}
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    disabled={loading}
                    aria-label="Ouvrir le sélecteur d'emojis"
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
                          role="button"
                          aria-label={`Ajouter l'emoji ${emoji}`}
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
                  aria-label="Envoyer le message"
                >
                  {loading ? 'Envoi...' : 'Envoyer'}
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