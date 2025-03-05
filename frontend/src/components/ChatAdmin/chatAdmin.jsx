import React, { useState, useEffect } from "react";
import CoolSidebar from "../sidebar/Sidebar";
import Navbar from "../navbar/Navbar";
import { FaPaperPlane, FaSmile, FaPaperclip, FaEllipsisH } from "react-icons/fa";
import io from "socket.io-client";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "./chatAdmin.css";


const Chat = () => {
  const [socket, setSocket] = useState(null);
  const [chatId, setChatId] = useState("");
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [senderId, setSenderId] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [error, setError] = useState(null);

  // Initialisation avec JWT et Socket.IO
  useEffect(() => {
    console.log("Chat component mounted");
    const token = localStorage.getItem("token");
    console.log("Token from localStorage:", token);

    if (!token) {
      console.log("No token found, redirecting to login");
      window.location.href = "/login";
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      console.log("Decoded token:", decodedToken);
      setSenderId(decodedToken.userId);
    } catch (error) {
      console.error("Error decoding token:", error.message);
      setError("Erreur lors du décodage du token");
      window.location.href = "/login";
      return;
    }

    const socketInstance = io("http://localhost:5000", {
      auth: { token },
    });
    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log("Socket.IO connected:", socketInstance.id);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("Socket.IO connection error:", err.message);
      setError(`Erreur de connexion Socket.IO: ${err.message}`);
    });

    return () => {
      console.log("Cleaning up Socket.IO");
      socketInstance.disconnect();
    };
  }, []);

  // Gestion des événements Socket.IO
  useEffect(() => {
    if (!socket) return;

    console.log("Setting up Socket.IO listeners");

    socket.on("newMessage", (message) => {
      console.log("New message received:", message);
      setMessages((prev) => {
        const updatedMessages = [...prev, message];
        console.log("Updated messages:", updatedMessages); // Vérifiez ici
        return updatedMessages;
      });
      setTypingUser(null);
    });

    socket.on("newNotification", (notification) => {
      console.log("New notification received:", notification);
      if (notification.recipientId === senderId) {
        setNotifications((prev) => [...prev, notification]);
      }
    });

    socket.on("userTyping", (data) => {
      console.log("Typing event received:", data);
      if (data.recipientId === senderId) setTypingUser(data.senderName);
    });

    socket.on("userStoppedTyping", (data) => {
      console.log("Stop typing event received:", data);
      if (data.senderId !== senderId) setTypingUser(null);
    });

    socket.on("error", (data) => {
      console.error("Socket.IO error:", data.message);
      setError(`Erreur Socket.IO: ${data.message}`);
    });

    return () => {
      socket.off("newMessage");
      socket.off("newNotification");
      socket.off("userTyping");
      socket.off("userStoppedTyping");
      socket.off("error");
    };
  }, [socket, senderId]);

  // Rejoindre un chat
  const joinChat = () => {
    if (!chatId || !recipientId) {
      setError("Veuillez entrer un Chat ID et un ID de destinataire");
      return;
    }
    console.log("Joining chat with chatId:", chatId);
    socket.emit("joinChat", chatId);
  };

  // Envoyer un message
  const sendMessage = () => {
    if (messageInput && chatId && senderId) {
      const messageData = { chatId, content: messageInput, senderId };
      console.log("Sending message:", messageData);
      socket.emit("sendMessage", messageData);
      socket.emit("stopTyping", { chatId, senderId });
      // Ajouter le message localement immédiatement pour l’affichage instantané
      setMessages((prev) => [
        ...prev,
        { sender: senderId, content: messageInput, timestamp: new Date() }
      ]);
      setMessageInput("");
    } else {
      console.log("Cannot send message, missing data:", { messageInput, chatId, senderId });
      setError("Veuillez entrer un Chat ID, un message et être connecté");
    }
  };

  // Gérer le typage
  const handleTyping = (e) => {
    setMessageInput(e.target.value);
    if (chatId && senderId) {
      if (e.target.value.length > 0) {
        console.log("Emitting typing:", { chatId, senderId });
        socket.emit("typing", { chatId, senderId });
      } else {
        console.log("Emitting stopTyping:", { chatId, senderId });
        socket.emit("stopTyping", { chatId, senderId });
      }
    }
  };

  if (error) {
    return (
      <div className="chat-page">
        <CoolSidebar />
        <div className="chat-main">
          <Navbar notifications={notifications} />
          <div className="chat-container">
            <p style={{ color: "red" }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <CoolSidebar />
      <div className="chat-main">
        <Navbar notifications={notifications} />
        <div className="chat-container">
          <div className="chat-header">
            <h2>Chat</h2>
            <FaEllipsisH className="more-options" />
          </div>
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.sender === senderId ? "sent" : "received"}`}
              >
                <p>{msg.content}</p>
                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
            {typingUser && (
              <p className="typing-indicator">{typingUser} est en train d'écrire...</p>
            )}
          </div>
          <div className="chat-input">
            <FaPaperclip className="input-icon" />
            <input
              type="text"
              placeholder="Écrire un message..."
              value={messageInput}
              onChange={handleTyping}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
            <FaSmile className="input-icon" />
            <button onClick={sendMessage}>
              <FaPaperPlane />
            </button>
          </div>
          {!chatId && (
            <div className="chat-start">
              <input
                type="text"
                placeholder="Chat ID"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
              />
              <input
                type="text"
                placeholder="ID du destinataire (ex. Admin)"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
              />
              <button onClick={joinChat}>Rejoindre le chat</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;