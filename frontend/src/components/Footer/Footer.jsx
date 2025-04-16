// Footer/Footer.jsx
import React from 'react';
import styled from 'styled-components';
import { FaFacebook, FaTwitter, FaLinkedin, FaEnvelope } from 'react-icons/fa'; // Social icons

const FooterContainer = styled.footer`
  background: linear-gradient(135deg, #1E3A8A, #1E90FF 100%); /* Matches Navbar */
  padding: 4rem 2rem; /* Spacious padding */
  color: #FFFFFF; /* White text */
  font-family: 'Inter', Arial, sans-serif; /* Consistent font */
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 2rem;
`;

const FooterSection = styled.div`
  flex: 1;
  min-width: 200px;
`;

const FooterTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #FFFFFF;
`;

const FooterLinks = styled.ul`
  list-style: none;
  padding: 0;
`;

const FooterLink = styled.li`
  margin-bottom: 0.75rem;
  a {
    color: #E6F0FA; /* Light blue for links */
    text-decoration: none;
    font-size: 1rem;
    font-weight: 400;
    transition: color 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem; /* Space for icons */
    &:hover {
      color: #FFFFFF; /* Bright white on hover */
    }
  }
`;

const SocialIcons = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-top: 1rem;
`;

const SocialIcon = styled.a`
  color: #FFFFFF;
  font-size: 1.5rem;
  transition: color 0.3s ease, transform 0.2s ease;
  &:hover {
    color: #E6F0FA; /* Light blue hover */
    transform: scale(1.1); /* Subtle zoom */
  }
`;

const Copyright = styled.p`
  text-align: center;
  font-size: 0.9rem;
  color: #E6F0FA;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2); /* Subtle divider */
`;

const Footer = () => {
  return (
    <FooterContainer>
      <FooterContent>
        {/* Company Info */}
        <FooterSection>
          <FooterTitle>TuniFlow</FooterTitle>
          <p>
            Simplifying your financial journey with elegance and efficiency.
          </p>
          <SocialIcons>
            <SocialIcon href="https://facebook.com" target="_blank">
              <FaFacebook />
            </SocialIcon>
            <SocialIcon href="https://twitter.com" target="_blank">
              <FaTwitter />
            </SocialIcon>
            <SocialIcon href="https://linkedin.com" target="_blank">
              <FaLinkedin />
            </SocialIcon>
          </SocialIcons>
        </FooterSection>

        {/* Quick Links */}
        <FooterSection>
          <FooterTitle>Quick Links</FooterTitle>
          <FooterLinks>
            <FooterLink>
              <a href="/">Home</a>
            </FooterLink>
            <FooterLink>
              <a href="/about">About</a>
            </FooterLink>
            <FooterLink>
              <a href="/contact">Contact</a>
            </FooterLink>
            <FooterLink>
              <a href="/services">Services</a>
            </FooterLink>
          </FooterLinks>
        </FooterSection>

        {/* Support */}
        <FooterSection>
          <FooterTitle>Support</FooterTitle>
          <FooterLinks>
            <FooterLink>
              <FaEnvelope /> <a href="mailto:support@tuniflow.com">Email Us</a>
            </FooterLink>
            <FooterLink>
              <a href="/reclamation">Submit a Claim</a>
            </FooterLink>
            <FooterLink>
              <a href="/faq">FAQ</a>
            </FooterLink>
          </FooterLinks>
        </FooterSection>
      </FooterContent>
      <Copyright>
        &copy; {new Date().getFullYear()} TuniFlow. All rights reserved.
      </Copyright>
    </FooterContainer>
  );
};

export default Footer;