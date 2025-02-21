// src/components/Navbar.js
import user from '../assets/user.png';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="welcome-text">Welcome Back, Dhia Borji</div>
      <div className="profile-area">
        <div className="search-bar">
          <input type="text" placeholder="Search Anything..." />
        </div>
        <div className="username">Dhia Borji</div>
        <img src={user} alt="User Profile" />
      </div>
    </nav>
  );
};

export default Navbar;
