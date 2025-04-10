import React, { useState, useEffect, useRef } from "react";
import CoolSidebar from "../sidebar/Sidebar";
import Navbar from "../navbar/Navbar";
import { FaPaperPlane, FaSmile, FaPaperclip, FaEllipsisH, FaUser, FaSearch, FaArrowLeft } from "react-icons/fa";
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
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true); // État pour gérer la visibilité de la sidebar
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const fileInputRef = useRef(null);
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

        // Masquer la sidebar uniquement si on est sur mobile (≤ 768px)
        if (window.innerWidth <= 768) {
            setIsSidebarVisible(false);
        }

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

    const showSidebar = () => {
        setIsSidebarVisible(true); // Afficher la sidebar
        setSelectedUser(null); // Désélectionner l’utilisateur pour revenir à la liste
        setMessages([]); // Vider les messages
        setChatId(""); // Réinitialiser le chatId
    };

    const sendMessage = () => {
        if (!messageInput || !chatId || !senderId) {
            setError("Veuillez sélectionner un utilisateur et écrire un message");
            return;
        }

        ChatService.sendMessage(chatId, messageInput, senderId);
        setMessageInput("");
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file || !chatId) {
            setError("Veuillez sélectionner un fichier et un chat");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("chatId", chatId);
        formData.append("senderId", senderId);

        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                "http://localhost:5000/chat/upload",
                formData,
                { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
            );
            console.log("Réponse de l'upload :", response.data);
            scrollToBottom();
        } catch (error) {
            setError("Erreur lors de l'upload du fichier : " + error.message);
            console.error("Erreur dans handleFileUpload:", error);
        }
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

    const emojis = ["😊", "😂", "😍", "👍", "😢", "😡", "✨", "🎉"];
    const addEmoji = (emoji) => {
        setMessageInput((prev) => prev + emoji);
        setShowEmojiPicker(false);
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
                    <div className={`chat-sidebar ${isSidebarVisible ? "visible" : "hidden"}`}>
                        <div className="chat-sidebar-header">
                            <h3>Conversations</h3>
                            <div className="search-container">
                                <FaSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="research..."
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
                                        <FaArrowLeft
                                            className="back-arrow"
                                            onClick={showSidebar}
                                        />
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
                                                {msg.fileUrl && (
                                                    <div className="file-content">
                                                        {msg.fileUrl.match(/\.(png|jpg|jpeg|jfif)$/i) ? (
                                                            <img
                                                                src={`http://localhost:5000${msg.fileUrl}`}
                                                                alt="Fichier envoyé"
                                                                style={{ maxWidth: "200px", maxHeight: "200px" }}
                                                                onError={(e) => (e.target.style.display = "none")}
                                                            />
                                                        ) : msg.fileUrl.match(/\.pdf$/i) ? (
                                                            <a
                                                                href={`http://localhost:5000${msg.fileUrl}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="file-link"
                                                            >
                                                                Voir le PDF
                                                            </a>
                                                        ) : (
                                                            <a
                                                                href={`http://localhost:5000${msg.fileUrl}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="file-link"
                                                            >
                                                                Télécharger le fichier
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                                <span className="message-time">
                                                    {msg.timestamp && !isNaN(new Date(msg.timestamp).getTime())
                                                        ? new Date(msg.timestamp).toLocaleTimeString([], {
                                                              hour: "2-digit",
                                                              minute: "2-digit",
                                                          })
                                                        : "Heure indisponible"}
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
                                    <FaPaperclip
                                        className="input-icon"
                                        onClick={() => fileInputRef.current?.click()}
                                    />
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: "none" }}
                                        accept="image/png,image/jpeg,image/jpg,image/jfif,application/pdf"
                                        onChange={handleFileUpload}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Please write a message"
                                        value={messageInput}
                                        onChange={handleTyping}
                                        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                                    />
                                    <FaSmile
                                        className="input-icon"
                                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                                    />
                                    {showEmojiPicker && (
                                        <div className="emoji-picker">
                                            {emojis.map((emoji, index) => (
                                                <span
                                                    key={index}
                                                    className="emoji"
                                                    onClick={() => addEmoji(emoji)}
                                                >
                                                    {emoji}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <button onClick={sendMessage}>
                                        <FaPaperPlane />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="no-chat-selected">
                                
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatAdmin;