import React, { useState, useEffect, useRef } from "react";
import CoolSidebar from "../sidebar/Sidebar";
import Navbar from "../navbar/Navbar";
import { FaPaperPlane, FaSmile, FaPaperclip, FaEllipsisH, FaUser, FaSearch } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import ChatService from "../../services/ChatService"; // Ajustez le chemin
import axios from "axios";
import "./chatAdmin.css";

const ChatAdmin = () => {
    const [socket, setSocket] = useState(null);
    const [chatId, setChatId] = useState("");
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState("");
    const [senderId, setSenderId] = useState("");
    const [businessOwners, setBusinessOwners] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [typingUser, setTypingUser] = useState(null);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [unreadMessages, setUnreadMessages] = useState({});
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const ADMIN_ID = "67bee9c72a104f8241d58e7d";

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            window.location.href = "/login";
            return;
        }

        try {
            const decodedToken = jwtDecode(token);
            setSenderId(decodedToken.userId);
            if (decodedToken.userId !== ADMIN_ID) {
                setError("Vous n'êtes pas autorisé à accéder à cette page.");
                return;
            }
            setSocket(ChatService.initializeSocket());
            loadChats(token);
            ChatService.emitUserOnline(decodedToken.userId);
        } catch (error) {
            setError("Erreur lors du décodage du token");
            window.location.href = "/login";
        }

        return () => ChatService.disconnect();
    }, []);

    useEffect(() => {
        if (!socket || !chatId) return;

        ChatService.joinChat(chatId);

        const handleNewChat = (data) => {
            if (data.participants.includes(ADMIN_ID)) {
                console.log("Nouveau chat détecté pour l'Admin:", data);
                loadChats(localStorage.getItem("token"));
            }
        };

        const handleNewMessage = (message) => {
            console.log("ChatAdmin.jsx - Nouveau message reçu:", message);
            if (message.chatId === chatId) {
                setMessages((prev) => [...prev, message]);
                scrollToBottomIfNeeded();
            }
            if (message.sender !== senderId && (!selectedUser || message.sender !== selectedUser._id)) {
                setUnreadMessages((prev) => ({
                    ...prev,
                    [message.sender]: (prev[message.sender] || 0) + 1,
                }));
            }
        };

        const handleNewNotification = (notification) => {
            if (notification.recipientId === senderId) {
                setNotifications((prev) => [...prev, notification]);
            }
        };

        const handleTyping = (data) => {
            if (data.chatId === chatId && data.senderId !== senderId) {
                const typingUser = businessOwners.find(owner => owner._id === data.senderId);
                setTypingUser(typingUser?.fullname || "Utilisateur");
            }
        };

        const handleStopTyping = (data) => {
            if (data.chatId === chatId && data.senderId !== senderId) {
                setTypingUser(null);
            }
        };

        ChatService.on("newChat", handleNewChat);
        ChatService.on("newMessage", handleNewMessage);
        ChatService.on("newNotification", handleNewNotification);
        ChatService.on("userTyping", handleTyping);
        ChatService.on("userStoppedTyping", handleStopTyping);

        return () => {
            ChatService.off("newChat", handleNewChat);
            ChatService.off("newMessage", handleNewMessage);
            ChatService.off("newNotification", handleNewNotification);
            ChatService.off("userTyping", handleTyping);
            ChatService.off("userStoppedTyping", handleStopTyping);
        };
    }, [socket, chatId, senderId, businessOwners, selectedUser]);

    const loadChats = async (token) => {
        try {
            const chats = await ChatService.getUserChats();
            const adminChats = chats.filter(chat =>
                chat.participants.some(p => p._id.toString() === ADMIN_ID)
            );

            const businessOwnerIds = adminChats.map(chat =>
                chat.participants.find(p => p._id.toString() !== ADMIN_ID)._id.toString()
            );

            const response = await axios.get("http://localhost:5000/users/getAllBusinessOwners", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const allBusinessOwners = response.data;
            const relevantBusinessOwners = allBusinessOwners.filter(owner =>
                businessOwnerIds.includes(owner._id.toString())
            );

            const updatedOwners = relevantBusinessOwners.map(owner => {
                const chat = adminChats.find(c =>
                    c.participants.some(p => p._id.toString() === owner._id)
                );
                return { ...owner, chatId: chat._id, hasChat: true };
            });

            setBusinessOwners(updatedOwners);

            const unread = {};
            adminChats.forEach(chat => {
                const businessOwnerId = chat.participants.find(id => id.toString() !== ADMIN_ID);
                unread[businessOwnerId] = chat.messages.filter(
                    msg => msg.sender.toString() !== ADMIN_ID && !msg.read
                ).length;
            });
            setUnreadMessages(unread);
        } catch (error) {
            setError("Erreur lors du chargement des chats : " + error.message);
            console.error("Erreur dans loadChats:", error);
        }
    };

    const selectUser = async (user) => {
        setSelectedUser(user);
        setError(null);

        if (user.chatId) {
            setChatId(user.chatId);
            ChatService.joinChat(user.chatId);
            const history = await ChatService.getChatHistory(user.chatId);
            setMessages(history);
            setUnreadMessages((prev) => ({ ...prev, [user._id]: 0 }));
            scrollToBottom();
        } else {
            setMessages([]);
            setChatId("");
            setError("Aucune conversation existante avec cet utilisateur.");
        }
    };

    const sendMessage = () => {
        if (!messageInput || !chatId || !senderId) {
            setError("Veuillez sélectionner un utilisateur et écrire un message");
            return;
        }

        ChatService.sendMessage(chatId, messageInput, senderId);
        setMessageInput("");
    };

    const handleTyping = (e) => {
        setMessageInput(e.target.value);
        ChatService.emitTyping(chatId, senderId, e.target.value.length > 0);
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

    const filteredUsers = businessOwners.filter((user) =>
        user.fullname?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <div className="chat-sidebar">
                        <div className="chat-sidebar-header">
                            <h3>Conversations</h3>
                            <div className="search-container">
                                <FaSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="chat-users">
                            {filteredUsers.map((user) => (
                                <div
                                    key={user._id}
                                    className={`chat-user ${selectedUser?._id === user._id ? "active" : ""}`}
                                    onClick={() => selectUser(user)}
                                >
                                    <div className="chat-user-avatar">
                                        {user.picture ? (
                                            <img src={user.picture} alt={user.fullname} />
                                        ) : (
                                            <FaUser />
                                        )}
                                    </div>
                                    <div className="chat-user-info">
                                        <h4>{user.fullname || "Utilisateur inconnu"}</h4>
                                        <p>{user.email}</p>
                                    </div>
                                    {unreadMessages[user._id] > 0 && (
                                        <div className="unread-badge">{unreadMessages[user._id]}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="chat-content">
                        {selectedUser ? (
                            <>
                                <div className="chat-header">
                                    <div className="chat-header-user">
                                        <div className="chat-user-avatar">
                                            {selectedUser.picture ? (
                                                <img src={selectedUser.picture} alt={selectedUser.fullname} />
                                            ) : (
                                                <FaUser />
                                            )}
                                        </div>
                                        <div className="chat-user-info">
                                            <h3>{selectedUser.fullname || "Utilisateur inconnu"}</h3>
                                            <p>{selectedUser.email}</p>
                                        </div>
                                    </div>
                                    <FaEllipsisH className="more-options" />
                                </div>
                                <div className="chat-messages" ref={messagesContainerRef}>
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
                            </>
                        ) : (
                            <div className="no-chat-selected">
                                <p>Sélectionnez un utilisateur pour commencer à discuter.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatAdmin;