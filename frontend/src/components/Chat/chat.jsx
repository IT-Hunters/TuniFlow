import React, { useState, useEffect, useRef } from "react";
import CoolSidebar from "../sidebarHome/newSidebar";
import Navbar from "../navbarHome/NavbarHome";
import { FaPaperPlane, FaSmile, FaPaperclip, FaEllipsisH } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import ChatService from "../../services/ChatService"; // Ajustez le chemin
import axios from "axios";
import "./chat.css";

const Chat = () => {
    const [socket, setSocket] = useState(null);
    const [chatId, setChatId] = useState("");
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState("");
    const [senderId, setSenderId] = useState("");
    const [notifications, setNotifications] = useState([]);
    const [typingUser, setTypingUser] = useState(null);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const ADMIN_ID = "67bee9c72a104f8241d58e7d";

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Aucun token trouvé. Veuillez vous connecter.");
            window.location.href = "/login";
            return;
        }

        try {
            const decodedToken = jwtDecode(token);
            setSenderId(decodedToken.userId);
            setSocket(ChatService.initializeSocket());
            initializeChat(token, decodedToken.userId);
            ChatService.emitUserOnline(decodedToken.userId);
        } catch (error) {
            setError("Erreur lors du décodage du token : " + error.message);
            window.location.href = "/login";
        }

        return () => ChatService.disconnect();
    }, []);

    useEffect(() => {
        if (!socket || !chatId) return;

        ChatService.joinChat(chatId);

        const handleNewMessage = (message) => {
            console.log("Chat.jsx - Nouveau message reçu:", message);
            if (message.chatId === chatId) {
                setMessages((prev) => [...prev, message]);
                scrollToBottomIfNeeded();
            }
        };

        const handleNewNotification = (notification) => {
            if (notification.recipientId === senderId) {
                setNotifications((prev) => [...prev, notification]);
            }
        };

        const handleTyping = (data) => {
            if (data.chatId === chatId && data.senderId !== senderId) {
                setTypingUser("Admin");
            }
        };

        const handleStopTyping = (data) => {
            if (data.chatId === chatId && data.senderId !== senderId) {
                setTypingUser(null);
            }
        };

        ChatService.on("newMessage", handleNewMessage);
        ChatService.on("newNotification", handleNewNotification);
        ChatService.on("userTyping", handleTyping);
        ChatService.on("userStoppedTyping", handleStopTyping);

        return () => {
            ChatService.off("newMessage", handleNewMessage);
            ChatService.off("newNotification", handleNewNotification);
            ChatService.off("userTyping", handleTyping);
            ChatService.off("userStoppedTyping", handleStopTyping);
        };
    }, [socket, chatId, senderId]);

    const initializeChat = async (token, userId) => {
        try {
            const chats = await ChatService.getUserChats();
            const existingChat = chats.find(chat =>
                chat.participants.some(p => p._id.toString() === userId) &&
                chat.participants.some(p => p._id.toString() === ADMIN_ID)
            );

            if (existingChat) {
                setChatId(existingChat._id);
                ChatService.joinChat(existingChat._id);
                const history = await ChatService.getChatHistory(existingChat._id);
                setMessages(history);
                scrollToBottom();
            } else {
                setError("Aucun chat avec l'Admin pour le moment. Vous pouvez commencer à écrire.");
            }
        } catch (error) {
            setError(`Erreur lors de l'initialisation du chat : ${error.message}`);
            console.error("Erreur dans initializeChat:", error);
        }
    };

    const sendMessage = async () => {
        if (!messageInput || !senderId) {
            setError("Veuillez écrire un message.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            if (!chatId) {
                const response = await axios.post(
                    "http://localhost:5000/chat/message",
                    { content: messageInput },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const newChatId = response.data.chatId;
                setChatId(newChatId);
                ChatService.joinChat(newChatId);
            } else {
                ChatService.sendMessage(chatId, messageInput, senderId);
            }
            setMessageInput("");
            setError(null);
        } catch (error) {
            setError("Erreur lors de l'envoi du message : " + error.message);
            console.error("Erreur dans sendMessage:", error);
        }
    };

    const handleTyping = (e) => {
        setMessageInput(e.target.value);
        if (chatId && senderId) {
            ChatService.emitTyping(chatId, senderId, e.target.value.length > 0);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const scrollToBottomIfNeeded = () => {
        const container = messagesContainerRef.current;
        if (container) {
            const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
            if (isAtBottom) {
                scrollToBottom();
            }
        }
    };

    if (error && error !== "Aucun chat avec l'Admin pour le moment. Vous pouvez commencer à écrire.") {
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
                        <h2>Chat avec l'Admin</h2>
                        <FaEllipsisH className="more-options" />
                    </div>
                    <div className="chat-messages" ref={messagesContainerRef}>
                        {messages.length === 0 && error && (
                            <p style={{ color: "gray", textAlign: "center" }}>{error}</p>
                        )}
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`message ${msg.sender === senderId ? "sent" : "received"}`}
                            >
                                <div className="message-content">
                                    <p>{msg.content}</p>
                                    <span className="message-time">
                                        {new Date(msg.timestamp).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {typingUser && (
                            <div className="typing-indicator">
                                <p>{typingUser} est en train d'écrire...</p>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
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
                </div>
            </div>
        </div>
    );
};

export default Chat;