import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaLeaf, FaBolt, FaUsers, FaGlobe, FaMapMarkerAlt, 
  FaRupeeSign, FaCalendarAlt, FaCompass, FaArrowRight 
} from 'react-icons/fa';

const About = () => {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="container">
          <h1 className="page-title">About EcoChargeHub</h1>
          <p className="page-subtitle">
            Making EV charging accessible, convenient, and sustainable for everyone.
          </p>
        </div>
      </section>

      <section className="mission-section">
        <div className="container">
          <div className="mission-grid">
            <div className="mission-card">
              <div className="mission-icon">🎯</div>
              <h2>Our Mission</h2>
              <p>
                EcoChargeHub is dedicated to making electric vehicle charging 
                accessible, convenient, and sustainable for everyone. We believe 
                in a future where clean transportation is the norm, and finding 
                a charger is never a hassle.
              </p>
            </div>
            <div className="mission-card">
              <div className="mission-icon">🌍</div>
              <h2>Our Vision</h2>
              <p>
                To create a seamless ecosystem that connects EV drivers with 
                charging stations, promoting sustainable transportation and 
                reducing carbon emissions across India. We envision a world 
                where every journey is a green journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="values-section">
        <div className="container">
          <h2 className="section-title">Our Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon"><FaLeaf /></div>
              <h3>Sustainability</h3>
              <p>We're committed to reducing carbon emissions through EV adoption.</p>
            </div>
            <div className="value-card">
              <div className="value-icon"><FaBolt /></div>
              <h3>Innovation</h3>
              <p>Modern technology for seamless charging station discovery and booking.</p>
            </div>
            <div className="value-card">
              <div className="value-icon"><FaUsers /></div>
              <h3>Community</h3>
              <p>Building a community of EV enthusiasts and sustainable drivers.</p>
            </div>
            <div className="value-card">
              <div className="value-icon"><FaGlobe /></div>
              <h3>Global Impact</h3>
              <p>Contributing to a cleaner planet for future generations.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="offer-section">
        <div className="container">
          <h2 className="section-title">What We Offer</h2>
          <p className="section-subtitle">Features designed to make EV charging simple</p>
          <div className="offer-grid">
            <div className="offer-card">
              <span className="offer-icon">📍</span>
              <h3>Station Discovery</h3>
              <p>Find charging stations near you with our interactive map and search.</p>
            </div>
            <div className="offer-card">
              <span className="offer-icon">⚡</span>
              <h3>Live Availability</h3>
              <p>Check real-time charger status before you head out.</p>
            </div>
            <div className="offer-card">
              <span className="offer-icon">💰</span>
              <h3>Price Comparison</h3>
              <p>Compare rates across stations to find the best value.</p>
            </div>
            <div className="offer-card">
              <span className="offer-icon">📅</span>
              <h3>Easy Booking</h3>
              <p>Reserve your charging slot in advance and skip the wait.</p>
            </div>
            <div className="offer-card">
              <span className="offer-icon">🌱</span>
              <h3>Renewable Charging</h3>
              <p>Support stations powered by clean, renewable energy.</p>
            </div>
            <div className="offer-card">
              <span className="offer-icon">🗺️</span>
              <h3>Navigation</h3>
              <p>Get directions to your chosen station with one click.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="how-section">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-grid">
            <div className="step">
              <div className="step-number">01</div>
              <h3>FIND</h3>
              <p>Search for charging stations near you</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">02</div>
              <h3>COMPARE</h3>
              <p>Check prices, availability and ratings</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">03</div>
              <h3>BOOK</h3>
              <p>Reserve your charging slot instantly</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">04</div>
              <h3>CHARGE</h3>
              <p>Arrive and start charging your EV</p>
            </div>
          </div>
        </div>
      </section>

      <section className="sustainability-section">
        <div className="container">
          <div className="sustainability-content">
            <div className="sustainability-text">
              <div className="sustainability-icon">🌱</div>
              <h2>Driving a Greener Future</h2>
              <p>
                Every charge on EcoChargeHub contributes to a cleaner environment. 
                By choosing electric vehicles and supporting renewable-energy 
                charging stations, you're part of a movement that's reducing 
                carbon emissions and building a sustainable future.
              </p>
              <p className="sustainability-note">
                Track your personal environmental impact in your sustainability dashboard.
              </p>
            </div>
            <div className="sustainability-features">
              <div className="sustain-feature">
                <span className="sustain-feature-icon">🌍</span>
                <span>Carbon Tracking</span>
              </div>
              <div className="sustain-feature">
                <span className="sustain-feature-icon">🔋</span>
                <span>Renewable Energy</span>
              </div>
              <div className="sustain-feature">
                <span className="sustain-feature-icon">📊</span>
                <span>Impact Dashboard</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Start Charging?</h2>
            <p>Join EcoChargeHub and find your nearest charging station today.</p>
            <div className="cta-buttons">
              <Link to="/stations" className="btn btn-primary cta-btn">
                <FaMapMarkerAlt /> Find a Station
              </Link>
              <Link to="/register" className="btn btn-outline cta-btn">
                Sign Up Free <FaArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .about-page { overflow-x: hidden; }

        .about-hero {
          background: linear-gradient(135deg, var(--primary-light) 0%, var(--bg) 100%);
          padding: 60px 0;
          text-align: center;
        }
        .page-title {
          font-size: 42px; color: var(--text); margin-bottom: 15px; font-weight: 800;
        }
        .page-subtitle {
          font-size: 17px; color: var(--text-muted);
          max-width: 600px; margin: 0 auto;
        }

        .mission-section { padding: 60px 0; background: var(--surface); }
        .mission-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; }
        .mission-card {
          background: var(--bg);
          padding: 35px 30px;
          border-radius: 16px;
          border: 1px solid var(--border);
          transition: all 0.3s;
        }
        .mission-card:hover {
          background: var(--primary-light);
          transform: translateY(-5px);
          border-color: var(--border-strong);
        }
        .mission-icon { font-size: 48px; margin-bottom: 15px; }
        .mission-card h2 { color: var(--primary); font-size: 24px; margin-bottom: 15px; }
        .mission-card p { color: var(--text-muted); line-height: 1.8; font-size: 15px; }

        .values-section { padding: 60px 0; background: var(--bg); }
        .values-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 25px; }
        .value-icon {
          width: 65px; height: 65px;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 15px; font-size: 26px; color: white;
        }

        .offer-section { padding: 60px 0; background: var(--surface); }
        .offer-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; }
        .offer-icon { font-size: 42px; display: block; margin-bottom: 15px; }

        .how-section { padding: 60px 0; background: var(--bg); }
        .steps-grid {
          display: flex; justify-content: center; align-items: center;
          gap: 20px; flex-wrap: wrap;
        }
        .step { text-align: center; flex: 1; min-width: 150px; max-width: 200px; }
        .step-number {
          font-size: 32px; font-weight: 800;
          color: var(--primary); opacity: 0.3; margin-bottom: 5px;
        }
        .step h3 {
          color: var(--text); font-size: 14px; margin-bottom: 8px;
          font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
        }
        .step p { color: var(--text-muted); font-size: 13px; }
        .step-arrow { font-size: 24px; color: var(--primary); opacity: 0.4; }

        .sustainability-section {
          padding: 60px 0;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          color: white;
        }
        .sustainability-content {
          display: grid; grid-template-columns: 1.5fr 1fr;
          gap: 50px; align-items: center;
        }
        .sustainability-icon { font-size: 48px; margin-bottom: 15px; }
        .sustainability-text h2 { font-size: 30px; margin-bottom: 20px; color: white; }
        .sustainability-text p {
          font-size: 16px; line-height: 1.7; opacity: 0.95;
          margin-bottom: 15px; color: white;
        }
        .sustainability-note { font-size: 14px; opacity: 0.8; font-style: italic; }
        .sustainability-features { display: flex; flex-direction: column; gap: 15px; }
        .sustain-feature {
          display: flex; align-items: center; gap: 15px;
          background: rgba(255,255,255,0.15);
          padding: 18px 24px; border-radius: 12px;
          font-size: 15px; font-weight: 600;
          backdrop-filter: blur(10px);
        }
        .sustain-feature-icon { font-size: 24px; }

        .cta-section { padding: 60px 0; background: var(--surface); }
        .cta-content { text-align: center; max-width: 600px; margin: 0 auto; }
        .cta-content h2 { font-size: 32px; color: var(--text); margin-bottom: 15px; }
        .cta-content p { color: var(--text-muted); margin-bottom: 30px; font-size: 16px; }
        .cta-buttons { display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; }
        .cta-btn {
          padding: 14px 32px; font-size: 15px;
          display: inline-flex; align-items: center; gap: 8px;
        }

        @media (max-width: 992px) {
          .values-grid { grid-template-columns: repeat(2, 1fr); }
          .offer-grid { grid-template-columns: repeat(2, 1fr); }
          .sustainability-content { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .page-title { font-size: 30px; }
          .page-subtitle { font-size: 15px; }
          .mission-grid { grid-template-columns: 1fr; }
          .values-grid { grid-template-columns: 1fr; }
          .offer-grid { grid-template-columns: 1fr; }
          .steps-grid { flex-direction: column; gap: 10px; }
          .step-arrow { transform: rotate(90deg); }
          .sustainability-text h2 { font-size: 24px; }
          .cta-content h2 { font-size: 24px; }
          .cta-buttons { flex-direction: column; }
          .cta-btn { width: 100%; justify-content: center; }
        }
        @media (max-width: 480px) {
          .page-title { font-size: 24px; }
          .mission-card { padding: 25px 20px; }
          .value-icon { width: 55px; height: 55px; font-size: 22px; }
        }
      `}</style>
    </div>
  );
};

export default About;