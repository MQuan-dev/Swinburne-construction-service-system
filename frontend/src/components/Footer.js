import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="App-footer">
    <div className="footer-content">
      <div className="footer-section">
        <h3>About Us</h3>
        <p>ConstructPro connects you with top contractors and service providers for all your home care needs.</p>
      </div>
      <div className="footer-section">
        <h3>Quick Links</h3>
        <ul>
          <li><Link to="/services">Services</Link></li>
          <li><Link to="/about">About Us</Link></li>
          <li><Link to="/contact">Contact</Link></li>
          <li><Link to="/terms">Terms of Service</Link></li>
        </ul>
      </div>
      <div className="footer-section">
        <h3>Contact Us</h3>
        <p>1234 Main St, City, State 12345</p>
        <p>Phone: (123) 456-7890</p>
        <p>Email: info@constructpro.com</p>
      </div>
      <div className="footer-section">
        <h3>Follow Us</h3>
        <div className="social-links">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </div>
      </div>
    </div>
    <div className="footer-bottom">
      <p>&copy; 2025 ConstructPro. All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;