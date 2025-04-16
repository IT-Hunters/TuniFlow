// Navbarr/navbarr.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FaUserCircle, FaHome, FaInfoCircle, FaEnvelope, FaCog, FaExclamationTriangle } from 'react-icons/fa'; // Added icons
import styled from 'styled-components';
import logo from '../assets/logoooo.png'; // Logo image

const NavbarContainer = styled.nav`
  background: linear-gradient(135deg, #1E3A8A, #1E90FF 100%); /* Elegant blue gradient */
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); /* Slightly stronger shadow for depth */
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const Logo = styled.img`
  height: 60px;
  transition: transform 0.3s ease;
  &:hover {
    transform: scale(1.05); /* Subtle zoom */
  }
`;

const Title = styled.h1`
  color: #FFFFFF; /* White for contrast */
  font-size: 1.75rem;
  font-weight: 700;
  font-family: 'Inter', Arial, sans-serif;
`;

const NavLinks = styled.ul`
  list-style: none;
  display: flex;
  align-items: center;
  gap: 2rem;
`;

const NavLink = styled.li`
  color: #FFFFFF; /* White text */
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem; /* Space between icon and text */
  transition: color 0.3s ease, transform 0.2s ease;
  &:hover {
    color: #E6F0FA; /* Light blue hover */
    transform: translateY(-1px);
  }
`;

const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownContent = styled.div`
  display: none;
  position: absolute;
  background-color: #FFFFFF; /* White dropdown for contrast */
  min-width: 180px;
  z-index: 10;
  border-radius: 8px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  padding: 0.5rem 0;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.2s ease, transform 0.2s ease;
  &.visible {
    display: block;
    opacity: 1;
    transform: translateY(0);
  }
  ${NavLink} {
    color: #2D3748; /* Dark slate for dropdown items */
    padding: 0.5rem 1rem;
    &:hover {
      background: #E6F0FA; /* Light blue hover */
      color: #13B5EA;
    }
  }
`;

const DropdownToggle = styled(NavLink)`
  &:hover {
    color: #E6F0FA;
  }
`;

const Dropdown = ({ label, items, icon }) => {
  return (
    <DropdownContainer
      onMouseEnter={(e) => {
        const dropdownContent = e.currentTarget.querySelector('.dropdown-content');
        if (dropdownContent) dropdownContent.classList.add('visible');
      }}
      onMouseLeave={(e) => {
        const dropdownContent = e.currentTarget.querySelector('.dropdown-content');
        if (dropdownContent) dropdownContent.classList.remove('visible');
      }}
    >
      <DropdownToggle>
        {icon}
        {label}
      </DropdownToggle>
      <DropdownContent className="dropdown-content">
        {items.map((item, index) => (
          <NavLink key={index}>{item}</NavLink>
        ))}
      </DropdownContent>
    </DropdownContainer>
  );
};

const LoginIcon = styled(FaUserCircle)`
  font-size: 2rem;
  color: #FFFFFF; /* White icon */
  cursor: pointer;
  transition: color 0.3s ease, transform 0.2s ease;
  &:hover {
    color: #E6F0FA; /* Light blue hover */
    transform: scale(1.1);
  }
`;

const Navbar = () => {
  return (
    <NavbarContainer>
      <LogoContainer>
        <Link to="/">
          <Logo src={logo} alt="TuniFlow Logo" />
        </Link>
        <Title>TuniFlow</Title>
      </LogoContainer>
      <NavLinks>
        <Link to="/">
          <NavLink>
            <FaHome /> Home
          </NavLink>
        </Link>
        <NavLink>
          <FaInfoCircle /> About
        </NavLink>
        <NavLink>
          <FaEnvelope /> Contact
        </NavLink>
        <Dropdown
          label="Services"
          items={['Accounting', 'Invoicing', 'Reports']}
          icon={<FaCog />}
        />
        <Dropdown
          label="Reclamation"
          items={['Submit a Claim', 'Track Status']}
          icon={<FaExclamationTriangle />}
        />
      </NavLinks>
      <Link to="/login">
        <LoginIcon />
      </Link>
    </NavbarContainer>
  );
};

export default Navbar;