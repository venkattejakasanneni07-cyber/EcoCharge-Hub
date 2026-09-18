import React from 'react';
import { Link } from 'react-router-dom';
import { FaLeaf, FaTwitter, FaLinkedin, FaGithub, FaEnvelope } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <FaLeaf className="footer-logo-icon" />
            <h3>EcoChargeHub</h3>
            <p>Charge Smarter. Drive Greener.</p>
            <div className="footer-social">
              <a href="#"><FaTwitter /></a>
              <a href="#"><FaLinkedin /></a>
              <a href="#"><FaGithub /></a>
              <a href="#"><FaEnvelope /></a>
            </div>
          </div>

          <div className="footer-links">
            <h4>Quick Links</h4>
            <Link to="/">Home</Link>
            <Link to="/stations">Stations</Link>
            <Link to="/about">About</Link>
          </div>

          <div className="footer-links">
            <h4>For Users</h4>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </div>

          <div className="footer-contact">
            <h4>Contact</h4>
            <p>📧 support@ecochargehub.com</p>
            <p>📞 +91 98765 43210</p>
            <p>📍 Vijayawada, India</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 EcoChargeHub. All rights reserved.</p>
          <p>Made with ❤️ for a sustainable future</p>
        </div>
      </div>

      <style jsx>{`
        .footer {
          background: #1a1a2e;
          color: white;
          padding: 50px 0 20px;
          margin-top: 50px;
        }
        .footer-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 40px;
          padding-bottom: 30px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .footer-brand h3 {
          color: #4caf50;
          margin: 10px 0;
        }
        .footer-logo-icon {
          font-size: 30px;
          color: #4caf50;
        }
        .footer-social {
          display: flex;
          gap: 15px;
          margin-top: 15px;
        }
        .footer-social a {
          color: white;
          font-size: 20px;
          transition: color 0.3s;
        }
        .footer-social a:hover {
          color: #4caf50;
        }
        .footer-links h4 {
          color: #4caf50;
          margin-bottom: 15px;
        }
        .footer-links a {
          display: block;
          color: #ccc;
          text-decoration: none;
          margin-bottom: 10px;
          transition: color 0.3s;
        }
        .footer-links a:hover {
          color: #4caf50;
        }
        .footer-contact p {
          color: #ccc;
          margin-bottom: 10px;
        }
        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 20px;
          color: #888;
          font-size: 14px;
        }
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
          }
          .footer-bottom {
            flex-direction: column;
            gap: 10px;
            text-align: center;
          }
        }
        @media (max-width: 480px) {
          .footer-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;