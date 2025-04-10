"use client";

import { useState, useEffect } from "react";
import {
  FaHome,
  FaTachometerAlt,
  FaBell,
  FaCog,
  FaQuestionCircle,
  FaBars,
  FaChevronLeft,
  FaSignOutAlt,
  FaComments,
  FaFileInvoice,
  FaPlus,
  FaProjectDiagram,
  FaUserFriends,
  FaWallet,
} from "react-icons/fa";
import "./SidebarHome.css";
import { findMyProfile, logout } from "../../services/UserService";
import { useNavigate } from "react-router-dom";

const CoolSidebar = () => {
  const [userData, setUserData] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Base navigation items avec ajout de "Wallet"
  const baseNavItems = [
    { title: "Home", icon: FaHome, href: "/user" },
    { title: "Assets", icon: FaTachometerAlt, href: "/Assets" },
    { title: "Finance", icon: FaBell, href: "#", badge: 3 },
    { title: "Objective", icon: FaCog, href: "/ObjectiveManagement" },
    { title: "Chat", icon: FaComments, href: "/chat" },
    { title: "Wallet", icon: FaWallet, href: "/Transaction" }, // Ajout de Wallet
    { title: "Help", icon: FaQuestionCircle, href: "#" },
    { title: "Invoice", icon: FaFileInvoice, href: userData?.userType === "BusinessOwner" ? "/owner-invoices" : "/invoice" },
    { title: "Add Project", icon: FaPlus, href: "/AddProject" },
    { title: "My Project", icon: FaProjectDiagram, href: "/MyProject" },
    { title: "Manager List", icon: FaUserFriends, href: "/ManagerList" },
    { title: "ProjectView", icon: FaUserFriends, href: "/ProjectView" },
    { title: "OwnerProjectsView", icon: FaUserFriends, href: "/OwnerProjectsView" },
  ];

  // Filter nav items based on user role
  const navItems = baseNavItems.filter((item) => {
    if (item.title === "Add Project" || item.title === "Manager List" || item.title === "OwnerProjectsView") {
      return userData?.userType === "BusinessOwner";
    }
    if (item.title === "My Project" || (item.title === "Invoice" && userData?.userType === "BusinessManager")) {
      return userData?.userType === "BusinessManager";
    }
    if (item.title === "ProjectView") {
      return userData?.userType !== "BusinessOwner";
    }
    return true;
  });

  const handleLogout = () => {
    try {
      const response = logout();
      if (response) {
        document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        navigate("/");
      } else {
        setError("Failed to logout. Please try again.");
      }
    } catch (error) {
      console.error("Couldn't logout:", error);
      setError("An error occurred during logout. Please try again.");
    }
  };

  const handleNavigation = (item) => {
    setActiveItem(item.title);
    const token = localStorage.getItem("token");

    if (item.title === "Chat") {
      if (token) {
        navigate("/chat");
      } else {
        navigate("/");
      }
    } else {
      navigate(item.href);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await findMyProfile();
        if (response) {
          setUserData(response);
        } else {
          setError("Failed to load user profile. Please try again.");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du profil :", error);
        setError("An error occurred while fetching your profile. Please try again.");
      }
    };
    fetchUser();
  }, []);

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
            <span className="user-name">
              {userData?.fullname} {userData?.lastname}
            </span>
            <span className="user-role">{userData?.userType}</span>
          </div>
        </div>
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        <nav className="sidebar-home-nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.title}>
                <a
                  href={item.href}
                  className={activeItem === item.title ? "active" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation(item);
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