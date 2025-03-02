// src/components/Sidebar.js
import './Sidebar.css';
import { Link, useNavigate } from "react-router-dom"; // Garde useNavigate pour la redirection

const Sidebar = () => {
  const navigate = useNavigate();

  const handleChatClick = () => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/chatAdmin"); // Redirige vers /chat si token présent
    } else {
      navigate("/login"); // Redirige vers /login si pas de token
    }
  };

  return (
    <nav className="sidebar">
      <div className="brand">TUNIFLOW</div>
      <ul>
        <li><a href="#0">Dashboard</a></li>
        <li><Link to="/adminusers">Business Owners</Link></li>
        <li><a href="#0">Store</a></li>
        <li><a href="#0">Orders</a></li>
        <li><a href="#0">Customers</a></li>
        <li><a href="#0">Reports</a></li>
        <li><a href="#0">Settings</a></li>
        <li>
          <a href="#0" onClick={(e) => { e.preventDefault(); handleChatClick(); }}>
            Chat {/* Texte seul, sans icône */}
          </a>
        </li>
        <li><a href="#0">Help & Center</a></li>
        <li><a href="#0">Log Out</a></li>
      </ul>
    </nav>
  );
};

export default Sidebar;