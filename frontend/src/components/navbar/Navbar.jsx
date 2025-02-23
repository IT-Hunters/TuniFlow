import { useEffect, useState } from "react";
import userImg from "../assets/user.png";
import axios from "axios";
import "./Navbar.css";

const Navbar = () => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await axios.get("http://localhost:3000/users/findMyProfile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUserData(response.data);
      } catch (error) {
        console.error("Erreur lors de la récupération du profil :", error);
      }
    };

    fetchUser();
  }, []);

  return (
    <nav className="navbar">
      <div className="welcome-text">
        {userData ? `Welcome Back, ${userData.fullname}` : "Welcome Back"}
      </div>
      <div className="profile-area">
        <div className="search-bar">
          <input type="text" placeholder="Search Anything..." />
        </div>
        {userData && <div className="username">{userData.fullname}</div>}
        <img src={userData?.picture || userImg} alt="User Profile" />
      </div>
    </nav>
  );
};

export default Navbar;
