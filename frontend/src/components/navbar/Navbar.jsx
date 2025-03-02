"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { User, LogOut, Settings, UserPlus, Bell } from "lucide-react"; // Ajout de Bell pour les notifications
import "./Navbar.css";

const Navbar = () => {
  const [userData, setUserData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false); // État pour le menu des notifications
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const notificationRef = useRef(null);

  // Mock data pour les notifications (à remplacer par des données dynamiques plus tard)
  const mockNotifications = [
    { id: 1, message: "Nouveau message de Elyess" },
    { id: 2, message: "Demande d’autorisation en attente" },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await axios.get("http://localhost:5000/users/findMyProfile", { // Port corrigé à 5000
          headers: { Authorization: `Bearer ${token}` },
        });

        setUserData(response.data);
      } catch (error) {
        console.error("Erreur lors de la récupération du profil :", error);
      }
    };

    fetchUser();
  }, []);

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
    <nav className="navbar">
      <div className="welcome-text">{userData ? `Welcome Back, ${userData.fullname}` : "Welcome Back"}</div>
      <div className="profile-area">
        {/* Icône de notification */}
        <div
          className="notification-menu"
          ref={notificationRef}
          onClick={() => setNotificationOpen(!notificationOpen)}
        >
          <Bell size={24} className="notification-icon" />
          {mockNotifications.length > 0 && (
            <span className="notification-badge">{mockNotifications.length}</span>
          )}
          {notificationOpen && (
            <div className={`dropdown-menu notification-dropdown ${notificationOpen ? "active" : ""}`}>
              <h3>Notifications</h3>
              {mockNotifications.length > 0 ? (
                mockNotifications.map((notif) => (
                  <p key={notif.id}>{notif.message}</p>
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