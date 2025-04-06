// src/components/navbarHome/NavbarHome.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaWallet, FaBell } from "react-icons/fa";
import ChatService from "../../services/ChatService"; // Ajustez le chemin
import LanguageSelector from "../Language/LanguageSelector"; 
import "./NavbarHome.css";

const Navbar = ({ notifications: externalNotifications }) => {
  const [userData, setUserData] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(externalNotifications || []);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndWallet = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const userResponse = await axios.get("http://localhost:5000/users/findMyProfile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData(userResponse.data);

        const walletResponse = await axios.get(
          `http://localhost:5000/wallet/user/${userResponse.data._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setWalletData(walletResponse.data);
      } catch (error) {
        console.error("Erreur lors de la récupération :", error);
        if (error.response?.status === 404) setWalletData(null);
      }
    };

    fetchUserAndWallet();

    // Initialiser le socket via ChatService
    ChatService.initializeSocket();

    // Écouter les notifications
    const handleNewNotification = (notification) => {
      console.log("New notification in NavbarHome:", notification);
      if (notification.recipientId === userData?._id) {
        setNotifications((prev) => [...prev, notification]);
      }
    };

    ChatService.on("newNotification", handleNewNotification);

    // Émettre userOnline
    if (userData?._id) {
      ChatService.emitUserOnline(userData._id);
    }

    return () => {
      ChatService.off("newNotification", handleNewNotification);
    };
  }, [userData?._id]);

  useEffect(() => {
    if (externalNotifications) {
      setNotifications(externalNotifications);
    }
  }, [externalNotifications]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/users/logout",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      localStorage.removeItem("token");
      setUserData(null);
      setWalletData(null);
      setNotifications([]);
      navigate("/");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      localStorage.removeItem("token");
      navigate("/");
    }
  };

  const handleWalletClick = () => {
    navigate("/Transaction");
  };

  return (
    <nav className="navbar-home">
      <div className="welcome-text">
        {userData ? `Welcome Back, ${userData.fullname}` : "Welcome Back"}
      </div>
      <div className="profile-area">
        <div className="search-bar">
          <input type="text" placeholder="Search Anything..." />
        </div>
        <LanguageSelector /> {/* Ajouter le sélecteur de langue ici */}
        <div
          className="notification-menu"
          onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
        >
          <FaBell className="notification-icon" />
          {notifications.length > 0 && (
            <span className="notification-badge">{notifications.length}</span>
          )}
          <div className={`notification-dropdown ${notificationMenuOpen ? "active" : ""}`}>
            <h3>Notifications</h3>
            {notifications.length > 0 ? (
              notifications.map((notif, index) => (
                <p key={index}>
                  {notif.message} - {new Date(notif.timestamp).toLocaleTimeString()}
                </p>
              ))
            ) : (
              <p>Aucune notification</p>
            )}
          </div>
        </div>
        <div className="wallet-menu" onClick={handleWalletClick}>
          <FaWallet className="wallet-icon" />
        </div>
        <div className="profile-menu" onClick={() => setMenuOpen(!menuOpen)}>
          <img
            src={userData?.picture || "/default-avatar.png"}
            alt="User Profile"
            className="profile-img"
          />
          <div className={`dropdown-menu ${menuOpen ? "active" : ""}`}>
            <div className="profile-info">
              <img
                src={userData?.picture || "/default-avatar.png"}
                alt="User"
                className="dropdown-img"
              />
              <div>
                <p className="user-name">{userData?.fullname}</p>
                <p className="user-email">{userData?.email}</p>
              </div>
            </div>
            <hr />
            <button onClick={() => navigate("/profile")} className="menu-item">
              Profil et visibilité
            </button>
            <button className="menu-item">Changer de compte</button>
            <button className="menu-item">Gérer le compte</button>
            <hr />
            <button onClick={handleLogout} className="menu-item logout">
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;