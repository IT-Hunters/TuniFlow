

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { User, LogOut, Settings, UserPlus, Bell } from "lucide-react";
import "./Navbar.css";

const Navbar = ({ notifications: externalNotifications }) => {
  const [userData, setUserData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState(externalNotifications || []);
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const notificationRef = useRef(null);

  // Initialisation avec Socket.IO pour notifications dynamiques
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await axios.get("http://localhost:5000/users/findMyProfile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData(response.data);
      } catch (error) {
        console.error("Erreur lors de la récupération du profil :", error);
      }
    };

    fetchUser();

    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io("http://localhost:5000", {
      auth: { token },
    });

    socket.on("connect", () => {
      console.log("Socket.IO connected for Admin Navbar:", socket.id);
    });

    socket.on("newNotification", (notification) => {
      console.log("New notification received in Admin Navbar:", notification);
      if (notification.recipientId === userData?._id) {
        setNotifications((prev) => [...prev, notification]);
      }
    });

    socket.on("newMessage", (message) => {
      console.log("New message received in Navbar:", message);
      setNotifications((prev) => [
        ...prev,
        { message: `Nouveau message de ${message.sender}`, recipientId: userData?._id, timestamp: new Date() },
      ]);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket.IO connection error in Admin Navbar:", err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [userData?._id]);

  // Synchronisation avec les notifications externes
  useEffect(() => {
    if (externalNotifications) {
      setNotifications(externalNotifications);
    }
  }, [externalNotifications]);

  // Gestion des clics extérieurs pour fermer les menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUserData(null);
    setNotifications([]);
    navigate("/");
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <nav className="navbar_admin">
      <div className="welcome-text">{userData ? `Welcome Back, ${userData.fullname}` : "Welcome Back"}</div>
      <div className="profile-area">
        {/* Icône de notification */}
        <div
          className="notification-menu"
          ref={notificationRef}
          onClick={() => setNotificationOpen(!notificationOpen)}
        >
          <Bell size={24} className="notification-icon" />
          {notifications.length > 0 && (
            <span className="notification-badge">{notifications.length}</span>
          )}
          {notificationOpen && (
            <div className={`dropdown-menu notification-dropdown ${notificationOpen ? "active" : ""}`}>
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
          )}
        </div>
        {/* Menu profil */}
        <div className="profile-menu" ref={menuRef} onClick={() => setMenuOpen(!menuOpen)}>
          <div className="profile-initials">
            {userData ? getInitials(userData.fullname) : "?"}
            {userData ? getInitials(userData.lastname) : "?"}
          </div>
          {menuOpen && (
            <div className={`dropdown-menu ${menuOpen ? "active" : ""}`}>
              <div className="profile-info">
                <div className="profile-initials profile-initials-lg">
                  {userData ? getInitials(userData.fullname) : "?"}
                  {userData ? getInitials(userData.lastname) : "?"}
                </div>
                <div>
                  <p className="user-name">{userData?.fullname}</p>
                  <p className="user-email">{userData?.email}</p>
                </div>
              </div>
              <hr />
              <button onClick={() => navigate("/profile")} className="menu-item">
                <User size={18} style={{ marginRight: "10px" }} />
                Profile and Visibility
              </button>
              <button className="menu-item">
                <UserPlus size={18} style={{ marginRight: "10px" }} />
                Switch Account
              </button>
              <button className="menu-item">
                <Settings size={18} style={{ marginRight: "10px" }} />
                Manage Account
              </button>
              <hr />
              <button onClick={handleLogout} className="menu-item logout">
                <LogOut size={18} style={{ marginRight: "10px" }} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;