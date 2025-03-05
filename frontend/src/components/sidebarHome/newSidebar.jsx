"use client";

import { useState, useEffect } from "react";
import { FaHome, FaTachometerAlt, FaUsers, FaBell, FaCog, FaQuestionCircle, FaBars, FaChevronLeft, FaSignOutAlt, FaComments,FaFileInvoice } from "react-icons/fa";
import "./SidebarHome.css";
import { findMyProfile,logout } from "../../services/UserService";
import { useNavigate } from "react-router-dom"; // Ajout de useNavigate
const navItems = [
  { title: "Home", icon: FaHome, href: "/user" },
  { title: "Assets", icon: FaTachometerAlt, href: "/Assets" },
  { title: "Compatability", icon: FaUsers, href: "#", badge: 5 },
  { title: "Finance", icon: FaBell, href: "#", badge: 3 },
  { title: "Objective", icon: FaCog, href: "#" },
  { title: "Chat", icon: FaComments, href: "/chat" },
  { title: "Help", icon: FaQuestionCircle, href: "#" },
  { title: "Invoice", icon: FaFileInvoice, href: "/invoice" } 
];

const CoolSidebar = () => {
  const [userData, setUserData] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("Dashboard");
  const navigate = useNavigate(); // Hook pour navigation

  const handleLogout = () => {
    const response = logout();
    if (response) {
      document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      navigate("/"); 
    }
    else console.error("Couldn't logout :", error);
  };

  const handleNavigation = (item) => {
    setActiveItem(item.title);
    const token = localStorage.getItem("token");

    if (item.title === "Chat") {
      if (token) {
        navigate("/chat"); // Redirige vers /chat si token présent
      } else {
        navigate("/"); // Redirige vers /login si pas de token
      }
    } else {
      navigate(item.href); // Redirige vers les autres routes
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await findMyProfile();
        setUserData(response);
      } catch (error) {
        console.error("Erreur lors de la récupération du profil :", error);
      }
    };
    fetchUser();
  }, []);
  console.log(localStorage.getItem("token"));
  return (
    <div className={`sidebar-home ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-home-content">
        <div className="sidebar-home-header">
          <h1 className={collapsed ? "hidden" : ""}>TuniFlow</h1>
          <button className="toggle-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <FaBars /> : <FaChevronLeft />}
          </button>
        </div>
        <div className="user-profile">
          <div className="avatar">JD</div>
          <div className={`user-info ${collapsed ? "hidden" : ""}`}>
            <span className="user-name">{userData?.fullname} {userData?.lastname}</span>
            <span className="user-role">{userData?.userType}</span>
          </div>
        </div>
        <nav className="sidebar-home-nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.title}>
                <a
                  href={item.href}
                  className={activeItem === item.title ? "active" : ""}
                  onClick={(e) => {
                    e.preventDefault(); // Empêche le comportement par défaut du lien
                    handleNavigation(item); // Utilise la fonction personnalisée
                  }}
                >
                  <item.icon />
                  <span className={collapsed ? "hidden" : ""}>{item.title}</span>
                  {item.badge && <span className="badge">{item.badge}</span>}
                </a>
              </li>
            ))}
          </ul>
          <div className="sidebar-home-footer">
            <a href="#" className="logout-btn" onClick={handleLogout}>
              <FaSignOutAlt />
              <span className={collapsed ? "hidden" : ""}>Logout</span>
            </a>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default CoolSidebar;