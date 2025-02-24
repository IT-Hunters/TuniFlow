import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import userImg from "../assets/user.png";
import "./Navbar.css";

const Navbar = () => {
  const [userData, setUserData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await axios.get("http://localhost:3000/users/findMyProfile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUserData(response.data);
      } catch (error) {
        console.error("Erreur lors de la récupération du profil :", error);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUserData(null);
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="welcome-text">
        {userData ? `Welcome Back, ${userData.fullname}` : "Welcome Back"}
      </div>
      <div className="profile-area">
        <div className="search-bar">
          <input type="text" placeholder="Search Anything..." />
        </div>
        <div className="profile-menu" onClick={() => setMenuOpen(!menuOpen)}>
          <img src={userData?.picture || userImg} alt="User Profile" className="profile-img" />
          <div className={`dropdown-menu ${menuOpen ? "active" : ""}`}>
            <div className="profile-info">
              <img src={userData?.picture || userImg} alt="User" className="dropdown-img" />
              <div>
                <p className="user-name">{userData?.fullname}</p>
                <p className="user-email">{userData?.email}</p>
              </div>
            </div>
            <hr />
            <button onClick={() => navigate("/profile")} className="menu-item">Profil et visibilité</button>
            <button className="menu-item">Changer de compte</button>
            <button className="menu-item">Gérer le compte</button>
            <hr />
            <button onClick={handleLogout} className="menu-item logout">Déconnexion</button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
