// src/components/Sidebar.js
import './Sidebar.css';
import { Link, useNavigate } from "react-router-dom"; // Garde useNavigate pour la redirection
import { logout } from "../../services/UserService";
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
    const handleLogout = () => {
      const response = logout();
      if (response) {
        document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        navigate("/"); 
      }
      else console.error("Couldn't logout :", error);
    };

  return (
    <nav className="sidebar">
      <div className="brand">TUNIFLOW</div>
      <ul>
        <li><a href="/dashboard">Dashboard</a></li>
        <li><Link to="/adminusers">Business Owners</Link></li>
      
        <li>
          <a href="#0" onClick={(e) => { e.preventDefault(); handleChatClick(); }}>
            Chat {/* Texte seul, sans icône */}
          </a>
        </li>
        <li><a href="#0" onClick={handleLogout} >Log Out</a></li>
      </ul>
    </nav>
  );
};

export default Sidebar;