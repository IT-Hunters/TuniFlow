import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import userImg from "../assets/user.png";
import { FaWallet, FaBell } from "react-icons/fa";
import "./NavbarHome.css";

const Navbar = () => {
  const [userData, setUserData] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Mock data pour les notifications (pour l'exemple)
  const mockNotifications = [
    { id: 1, message: "Nouveau message de Elyess" },
    { id: 2, message: "Autorisation en attente" },
  ];

  useEffect(() => {
    const fetchUserAndWallet = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        // Récupérer les données de l'utilisateur
        const userResponse = await axios.get("http://localhost:5000/users/findMyProfile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData(userResponse.data);

        // Récupérer le wallet de l'utilisateur
        const walletResponse = await axios.get(`http://localhost:5000/wallet/user/${userResponse.data._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWalletData(walletResponse.data);
      } catch (error) {
        console.error("Erreur lors de la récupération :", error);
        if (error.response?.status === 404) setWalletData(null); // Aucun wallet trouvé
      }
    };

    fetchUserAndWallet();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUserData(null);
    setWalletData(null);
    navigate("/");
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
        {/* Icône de notifications */}
        <div
          className="notification-menu"
          onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
        >
          <FaBell className="notification-icon" />
          {mockNotifications.length > 0 && (
            <span className="notification-badge">{mockNotifications.length}</span>
          )}
          <div className={`notification-dropdown ${notificationMenuOpen ? "active" : ""}`}>
            <h3>Notifications</h3>
            {mockNotifications.length > 0 ? (
              mockNotifications.map((notif) => <p key={notif.id}>{notif.message}</p>)
            ) : (
              <p>Aucune notification</p>
            )}
          </div>
        </div>
        {/* Icône de portefeuille */}
        <div className="wallet-menu" onClick={() => setWalletMenuOpen(!walletMenuOpen)}>
          <FaWallet className="wallet-icon" />
          <div className={`wallet-dropdown ${walletMenuOpen ? "active" : ""}`}>
            {walletData ? (
              <div className="wallet-info">
                <h3>Portefeuille</h3>
                <p><strong>Solde:</strong> {walletData.balance} {walletData.currency}</p>
                <p><strong>Type:</strong> {walletData.type}</p>
                <button className="wallet-action" onClick={() => navigate(`/wallet/${walletData._id}`)}>
                  Détails
                </button>
              </div>
            ) : (
              <div className="wallet-info">
                <p>Aucun portefeuille trouvé</p>
                <button className="wallet-action" onClick={() => navigate("/wallet/create")}>
                  Créer un portefeuille
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Menu profil */}
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