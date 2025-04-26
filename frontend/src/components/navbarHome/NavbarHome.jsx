import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaBell } from "react-icons/fa";
import ChatService from "../../services/ChatService"; 
import LanguageSelector from "../Language/LanguageSelector"; 
import "./NavbarHome.css";

const Navbar = ({ notifications: externalNotifications }) => {
  const [userData, setUserData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(externalNotifications || []);
  const navigate = useNavigate();
  const notificationRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await axios.get('http://localhost:5000/project/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Notifications fetched in NavbarHome:', response.data);
      if (response.data.notifications && Array.isArray(response.data.notifications)) {
        setNotifications(response.data.notifications);
      } else {
        console.warn('Aucune notification trouvée dans la réponse:', response.data);
        setNotifications([]);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des notifications:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const userResponse = await axios.get("http://localhost:3000/users/findMyProfile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData(userResponse.data);
      } catch (error) {
        console.error("Erreur lors de la récupération :", error);
      }
    };

    fetchUser();
    ChatService.initializeSocket();

    const handleNewNotification = (notification) => {
      console.log("New notification in NavbarHome:", notification);
      if (notification.userId === userData?._id || notification.userId?._id === userData?._id) {
        setNotifications((prev) => [...prev, notification]);
      }
    };

    const handleNotificationUpdated = (updatedNotification) => {
      console.log("Notification updated in NavbarHome:", updatedNotification);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === updatedNotification._id ? updatedNotification : notif
        )
      );
    };

    ChatService.on("newNotification", handleNewNotification);
    ChatService.on("notificationUpdated", handleNotificationUpdated);

    if (userData?._id) {
      ChatService.emitUserOnline(userData._id);
    }

    return () => {
      ChatService.off("newNotification", handleNewNotification);
      ChatService.off("notificationUpdated", handleNotificationUpdated);
    };
  }, [userData?._id]);

  useEffect(() => {
    if (externalNotifications) {
      setNotifications(externalNotifications);
    }
  }, [externalNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationClick = () => {
    setNotificationMenuOpen(!notificationMenuOpen);
    fetchNotifications();
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate('/login');
        return;
      }
      await axios.put(
        `http://localhost:5000/project/notifications/${notificationId}/mark-as-read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('Notification marked as read');
  
      // Mise à jour optimiste : supprimer la notification localement
      setNotifications((prev) => prev.filter((notif) => notif._id !== notificationId));
  
      // Synchroniser avec le serveur
      await fetchNotifications();
  
    } catch (err) {
      console.error('Erreur lors du marquage comme lu:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };
  

  const unreadNotificationsCount = notifications.filter((notif) => !notif.isRead).length;

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:3000/users/logout",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      localStorage.removeItem("token");
      setUserData(null);
      setNotifications([]);
      navigate("/");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      localStorage.removeItem("token");
      navigate("/");
    }
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
        <LanguageSelector />
        <div
          className="notification-menu"
          ref={notificationRef}
          onClick={handleNotificationClick}
        >
          <FaBell className="notification-icon" />
          {unreadNotificationsCount > 0 && (
            <span className="notification-badge">{unreadNotificationsCount}</span>
          )}
          <div className={`notification-dropdown ${notificationMenuOpen ? "active" : ""}`}>
            <h3>Notifications</h3>
            {notifications.filter((notif) => !notif.isRead).length > 0 ? (
              notifications
                .filter((notif) => !notif.isRead)
                .map((notif, index) => (
                  <div key={index} className="notification-item">
                    <p>
                      {notif.message} - {new Date(notif.createdAt).toLocaleTimeString()}
                    </p>
                    <button
                      className="mark-as-read-btn"
                      onClick={() => handleMarkAsRead(notif._id)}
                    >
                      Marquer comme lu
                    </button>
                  </div>
                ))
            ) : (
              <p>Aucune notification non lue</p>
            )}
          </div>
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
