import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaBell } from "react-icons/fa";
import ChatService from "../../services/ChatService"; // Ajustez le chemin
import LanguageSelector from "../Language/LanguageSelector"; 
import "./NavbarHome.css";

const Navbar = ({ notifications: externalNotifications }) => {
  const [userData, setUserData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(externalNotifications || []);
  const navigate = useNavigate();
  const notificationRef = useRef(null);

  // Fonction pour charger les notifications
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
        // Filtrer pour ne garder que les notifications non lues
        const unreadNotifications = response.data.notifications.filter((notif) => !notif.isRead);
        setNotifications(unreadNotifications);
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

  // Charger les notifications au montage du composant
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Charger les données utilisateur et gérer Socket.IO
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

    // Initialiser le socket via ChatService
    ChatService.initializeSocket();

    // Écouter les notifications
    const handleNewNotification = (notification) => {
      console.log("New notification in NavbarHome:", notification);
      if (notification.userId === userData?._id || notification.userId?._id === userData?._id) {
        // Ajouter la nouvelle notification uniquement si elle est non lue
        if (!notification.isRead) {
          setNotifications((prev) => [...prev, notification]);
        }
      }
    };

    // Écouter les mises à jour des notifications (par exemple, marquage comme lu)
    const handleNotificationUpdated = (updatedNotification) => {
      console.log("Notification updated in NavbarHome:", updatedNotification);
      // Si la notification est marquée comme lue, la supprimer de la liste
      if (updatedNotification.isRead) {
        setNotifications((prev) => prev.filter((notif) => notif._id !== updatedNotification._id));
      } else {
        // Si elle est mise à jour mais toujours non lue, la mettre à jour
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === updatedNotification._id ? updatedNotification : notif
          )
        );
      }
    };

    ChatService.on("newNotification", handleNewNotification);
    ChatService.on("notificationUpdated", handleNotificationUpdated);

    // Émettre userOnline
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
      // Filtrer pour ne garder que les notifications non lues
      const unreadNotifications = externalNotifications.filter((notif) => !notif.isRead);
      setNotifications(unreadNotifications);
    }
  }, [externalNotifications]);

  // Gestion des clics extérieurs pour fermer le menu des notifications
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

  // Gérer le clic sur l'icône de notification
  const handleNotificationClick = () => {
    setNotificationMenuOpen(!notificationMenuOpen);
    fetchNotifications();
  };

  // Gérer le marquage d'une notification comme lue
  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await axios.put(
        `http://localhost:5000/project/notifications/${notificationId}/mark-as-read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('Notification marked as read:', response.data);
      // Supprimer la notification de l'état local
      setNotifications((prev) => prev.filter((notif) => notif._id !== notificationId));
    } catch (err) {
      console.error('Erreur lors du marquage comme lu:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  // Compter les notifications non lues pour le badge
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
            {notifications.length > 0 ? (
              notifications.map((notif, index) => (
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