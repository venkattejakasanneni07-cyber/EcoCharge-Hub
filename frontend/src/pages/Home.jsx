import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaLeaf, FaBolt, FaMapMarkerAlt, FaClock, FaChargingStation, 
  FaSearch, FaCalendarAlt, FaRupeeSign, FaCompass, FaArrowRight, FaLocationArrow
} from 'react-icons/fa';
import { db } from '../firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

const Home = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [nearbyStations, setNearbyStations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const q = query(collection(db, 'stations'), limit(3));
        const querySnapshot = await getDocs(q);
        const data = [];
        querySnapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
        setNearbyStations(data);
      } catch (error) {
        console.error('Error fetching stations:', error);
      }
      setLoading(false);
    };
    fetchStations();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/stations?search=${encodeURIComponent(searchTerm)}`);
    } else {
      navigate('/stations');
    }
  };

  return (
    <div className="home-page">
      {/* ============ HERO SECTION ============ */}
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            
            {/* LEFT COLUMN */}
            <div className="hero-left">
              <div className="hero-badge">
                <FaBolt /> EV Charging Made Simple
              </div>
              
              <h1 className="hero-title">
                Find your charger.<br />
                <span className="text-green">Charge without the wait.</span>
              </h1>
              
              <p className="hero-subtitle">
                Find nearby EV chargers, check availability, compare prices and book your slot.
              </p>

              <form onSubmit={handleSearch} className="hero-search">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search city, location or charging station..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" className="search-btn">Search</button>
              </form>

              <div className="hero-highlights">
                <div className="highlight-item">
                  <span>📍</span> Nearby Stations
                </div>
                <div className="highlight-item">
                  <span>⚡</span> Live Availability
                </div>
                <div className="highlight-item">
                  <span>💰</span> Price Comparison
                </div>
                <div className="highlight-item">
                  <span>📅</span> Easy Booking
                </div>
              </div>

              <div className="hero-actions">
                <Link to="/stations" className="btn btn-primary hero-btn">
                  <FaMapMarkerAlt /> Browse Stations
                </Link>
                <button 
                  className="btn btn-outline hero-btn"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        () => navigate('/stations'),
                        () => alert('Location access denied.')
                      );
                    }
                  }}
                >
                  <FaLocationArrow /> Use My Location
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN - Map Mockup */}
            <div className="hero-right">
              <div className="map-mockup">
                <div className="map-header">
                  <div className="map-header-left">
                    <span className="map-dot"></span>
                    <span className="map-title">Nearby Chargers</span>
                  </div>
                  <span className="map-count">{nearbyStations.length || 3} stations</span>
                </div>

                <div className="map-bg">
                  <div className="map-grid"></div>
                  
                  <div className="map-station-card card-1">
                    <div className="card-top">
                      <span className="station-dot available"></span>
                      <span className="station-name">
                        {nearbyStations[0]?.name || 'GreenCharge Hub'}
                      </span>
                    </div>
                    <div className="card-info">
                      <span>⚡ {nearbyStations[0]?.chargers || 4} Chargers</span>
                      <span className="card-price">₹{nearbyStations[0]?.price || 12}/kWh</span>
                    </div>
                  </div>

                  <div className="map-station-card card-2">
                    <div className="card-top">
                      <span className="station-dot available"></span>
                      <span className="station-name">
                        {nearbyStations[1]?.name || 'EcoPower'}
                      </span>
                    </div>
                    <div className="card-info">
                      <span>⚡ {nearbyStations[1]?.chargers || 3} Chargers</span>
                      <span className="card-price">₹{nearbyStations[1]?.price || 15}/kWh</span>
                    </div>
                  </div>

                  <div className="map-station-card card-3">
                    <div className="card-top">
                      <span className="station-dot few"></span>
                      <span className="station-name">
                        {nearbyStations[2]?.name || 'SolarCharge'}
                      </span>
                    </div>
                    <div className="card-info">
                      <span>⚡ {nearbyStations[2]?.chargers || 2} Chargers</span>
                      <span className="card-price">₹{nearbyStations[2]?.price || 10}/kWh</span>
                    </div>
                  </div>

                  <div className="user-pin">
                    <div className="user-pin-pulse"></div>
                    <div className="user-pin-dot"></div>
                  </div>

                  <span className="map-marker marker-1">⚡</span>
                  <span className="map-marker marker-2">⚡</span>
                  <span className="map-marker marker-3">⚡</span>
                  <span className="map-marker marker-4">⚡</span>
                </div>

                <div className="map-footer">
                  <span>📍 Showing stations near you</span>
                  <Link to="/stations" className="map-view-all">
                    View All <FaArrowRight />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ NEARBY STATIONS ============ */}
      <section className="nearby-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>Nearby Charging Stations</h2>
              <p className="section-subtitle">Top rated stations in your area</p>
            </div>
            <Link to="/stations" className="view-all">
              View All <FaArrowRight />
            </Link>
          </div>

          {loading ? (
            <div className="spinner"></div>
          ) : nearbyStations.length === 0 ? (
            <div className="empty-state">
              <p>No stations available yet. Be the first to add one!</p>
            </div>
          ) : (
            <div className="stations-grid">
              {nearbyStations.map((station, index) => (
                <div key={station.id} className="station-card">
                  <div className="station-card-header">
                    <div className="station-icon">⚡</div>
                    <span className={`status-badge ${index === 2 ? 'limited' : 'available'}`}>
                      {index === 2 ? '🟠 Few left' : '🟢 Available'}
                    </span>
                  </div>
                  <h3>{station.name}</h3>
                  <p className="station-address">
                    <FaMapMarkerAlt /> {station.city || station.address}
                  </p>
                  <div className="station-meta">
                    <span className="meta-item">
                      <FaChargingStation /> {station.chargers || 0} Chargers
                    </span>
                    <span className="meta-item">
                      <FaBolt /> {station.power || '60 kW'}
                    </span>
                  </div>
                  <div className="station-footer">
                    <span className="station-price">₹{station.price || '15'}/kWh</span>
                    <Link to={`/stations/${station.id}`} className="btn-details">
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ WHY ECOCHARGEHUB ============ */}
      <section className="why-section">
        <div className="container">
          <h2 className="section-title">Why EcoChargeHub?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><FaMapMarkerAlt /></div>
              <h3>Find Nearby</h3>
              <p>Locate charging stations near you instantly</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><FaBolt /></div>
              <h3>Live Status</h3>
              <p>Check real-time charger availability</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><FaRupeeSign /></div>
              <h3>Compare Prices</h3>
              <p>Find the best rates in your area</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><FaCalendarAlt /></div>
              <h3>Easy Booking</h3>
              <p>Book your charging slot in advance</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><FaLeaf /></div>
              <h3>Green Charging</h3>
              <p>Track your CO₂ savings and impact</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><FaCompass /></div>
              <h3>Navigation</h3>
              <p>Get directions to your chosen station</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
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

      {/* ============ ECO SECTION ============ */}
      <section className="eco-section">
        <div className="container">
          <div className="eco-content">
            <div className="eco-icon">🌱</div>
            <h2>Charge Greener</h2>
            <p>Discover renewable-energy stations and track your environmental impact with every charge.</p>
            <div className="eco-stats">
              <div className="eco-stat">
                <span className="eco-stat-icon">🌱</span>
                <span className="eco-label">Renewable Charging</span>
              </div>
              <div className="eco-stat">
                <span className="eco-stat-icon">🌍</span>
                <span className="eco-label">Carbon Tracking</span>
              </div>
              <div className="eco-stat">
                <span className="eco-stat-icon">🗺️</span>
                <span className="eco-label">Green Navigation</span>
              </div>
            </div>
            <Link to="/sustainability" className="btn btn-primary eco-btn">
              View Your Impact
            </Link>
          </div>
        </div>
      </section>

      <style jsx>{`
        .home-page { overflow-x: hidden; }

        /* HERO */
        .hero {
          background: linear-gradient(135deg, var(--primary-light) 0%, var(--bg) 100%);
          padding: 60px 0 80px;
          position: relative;
          overflow: hidden;
        }
        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }
        .hero-left { z-index: 2; }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--surface);
          color: var(--primary);
          padding: 8px 16px;
          border-radius: 50px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 20px;
          border: 1px solid var(--border);
        }
        .hero-title {
          font-size: 52px;
          line-height: 1.1;
          color: var(--text);
          margin-bottom: 20px;
          font-weight: 800;
          letter-spacing: -0.03em;
        }
        .hero-subtitle {
          font-size: 17px;
          color: var(--text-muted);
          margin-bottom: 32px;
          line-height: 1.6;
          max-width: 500px;
        }

        .hero-search {
          display: flex;
          align-items: center;
          background: var(--surface);
          border-radius: 14px;
          padding: 6px 6px 6px 20px;
          box-shadow: var(--shadow-md);
          margin-bottom: 20px;
          border: 2px solid var(--border);
          transition: all 0.3s;
        }
        .hero-search:focus-within {
          border-color: var(--primary);
          box-shadow: var(--shadow-lg);
        }
        .hero-search .search-icon { color: var(--primary); font-size: 18px; margin-right: 12px; }
        .hero-search input {
          flex: 1; border: none; outline: none;
          font-size: 15px; padding: 12px 0;
          background: transparent; color: var(--text);
          font-family: inherit;
        }
        .hero-search input::placeholder { color: var(--text-subtle); }
        .search-btn {
          background: var(--primary); color: var(--text-on-primary);
          border: none; padding: 14px 28px;
          border-radius: 10px; font-weight: 600;
          font-size: 14px; cursor: pointer;
          transition: all 0.3s; font-family: inherit;
        }
        .search-btn:hover { background: var(--primary-dark); transform: translateY(-1px); }

        .hero-highlights {
          display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 25px;
        }
        .highlight-item {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--surface);
          padding: 8px 14px; border-radius: 50px;
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--border);
          font-size: 13px; font-weight: 600; color: var(--text);
          transition: all 0.3s;
        }
        .highlight-item:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--primary);
        }

        .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .hero-btn {
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        /* Map Mockup */
        .hero-right { z-index: 2; }
        .map-mockup {
          background: var(--surface);
          border-radius: 20px;
          padding: 16px;
          box-shadow: var(--shadow-xl);
          border: 1px solid var(--border);
          transform: rotate(-1deg);
          transition: transform 0.3s;
        }
        .map-mockup:hover { transform: rotate(0deg) translateY(-5px); }
        .map-header {
          display: flex; justify-content: space-between;
          align-items: center; padding: 8px 12px 16px;
        }
        .map-header-left { display: flex; align-items: center; gap: 8px; }
        .map-dot {
          width: 10px; height: 10px;
          background: var(--primary); border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
        .map-title { font-weight: 700; color: var(--text); font-size: 15px; }
        .map-count {
          font-size: 12px; color: var(--text-muted);
          background: var(--primary-light);
          padding: 4px 10px; border-radius: 20px; font-weight: 600;
        }

        .map-bg {
          background: linear-gradient(135deg, var(--primary-light) 0%, var(--surface-active) 100%);
          border-radius: 14px;
          height: 340px;
          position: relative;
          overflow: hidden;
          margin-bottom: 12px;
        }
        .map-grid {
          position: absolute; inset: 0;
          background-image: 
            linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .map-station-card {
          position: absolute;
          background: var(--surface);
          border-radius: 10px;
          padding: 10px 12px;
          box-shadow: var(--shadow-md);
          min-width: 150px; z-index: 5;
          border: 1px solid var(--border);
          animation: floatCard 4s ease-in-out infinite;
        }
        .card-1 { top: 20px; left: 20px; animation-delay: 0s; }
        .card-2 { top: 120px; right: 20px; animation-delay: 1s; }
        .card-3 { bottom: 40px; left: 40px; animation-delay: 2s; }
        @keyframes floatCard {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .card-top { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
        .station-dot { width: 8px; height: 8px; border-radius: 50%; }
        .station-dot.available { background: var(--status-available); }
        .station-dot.few { background: var(--status-limited); }
        .station-name { font-size: 12px; font-weight: 700; color: var(--text); }
        .card-info {
          display: flex; justify-content: space-between;
          align-items: center; font-size: 11px; color: var(--text-muted);
        }
        .card-price { color: var(--primary); font-weight: 700; }

        .user-pin {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%); z-index: 6;
        }
        .user-pin-pulse {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 40px; height: 40px;
          background: rgba(35, 134, 54, 0.3);
          border-radius: 50%;
          animation: ripple 2s infinite;
        }
        @keyframes ripple {
          0% { transform: translate(-50%,-50%) scale(0.5); opacity: 1; }
          100% { transform: translate(-50%,-50%) scale(2); opacity: 0; }
        }
        .user-pin-dot {
          position: relative;
          width: 16px; height: 16px;
          background: var(--primary);
          border: 3px solid var(--surface);
          border-radius: 50%;
          box-shadow: var(--shadow-md);
        }

        .map-marker { position: absolute; font-size: 18px; animation: bounce 2s infinite; }
        .marker-1 { top: 30%; left: 25%; animation-delay: 0s; }
        .marker-2 { top: 60%; left: 70%; animation-delay: 0.5s; }
        .marker-3 { top: 25%; right: 30%; animation-delay: 1s; }
        .marker-4 { bottom: 25%; right: 25%; animation-delay: 1.5s; }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .map-footer {
          display: flex; justify-content: space-between;
          align-items: center; padding: 4px 8px;
          font-size: 12px; color: var(--text-muted);
        }
        .map-view-all {
          color: var(--primary); text-decoration: none; font-weight: 600;
          display: flex; align-items: center; gap: 5px;
          transition: gap 0.3s;
        }
        .map-view-all:hover { gap: 8px; }

        /* Nearby Section */
        .nearby-section { padding: 60px 0; background: var(--bg); }
        .section-header {
          display: flex; justify-content: space-between;
          align-items: flex-end; margin-bottom: 30px;
          flex-wrap: wrap; gap: 15px;
        }
        .section-header h2 { font-size: 28px; color: var(--text); margin-bottom: 5px; }
        .view-all {
          color: var(--primary); text-decoration: none; font-weight: 600;
          display: flex; align-items: center; gap: 8px;
          transition: gap 0.3s;
        }
        .view-all:hover { gap: 12px; }
        .stations-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px;
        }
        .station-card-header {
          display: flex; justify-content: space-between;
          align-items: center; margin-bottom: 15px;
        }
        .station-icon {
          width: 45px; height: 45px;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; color: white;
        }
        .station-address {
          color: var(--text-muted); font-size: 14px;
          margin-bottom: 15px;
          display: flex; align-items: center; gap: 6px;
        }
        .station-meta {
          display: flex; gap: 20px; margin-bottom: 15px;
          padding-bottom: 15px; border-bottom: 1px solid var(--border);
        }
        .meta-item {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; color: var(--text);
        }
        .meta-item svg { color: var(--primary); }
        .station-footer {
          display: flex; justify-content: space-between; align-items: center;
        }
        .station-price {
          font-size: 18px; font-weight: 800;
          color: var(--primary); letter-spacing: -0.02em;
        }
        .btn-details {
          background: var(--primary-light); color: var(--primary);
          padding: 8px 16px; border-radius: 8px;
          text-decoration: none; font-weight: 600; font-size: 14px;
          transition: all 0.3s;
        }
        .btn-details:hover { background: var(--primary); color: var(--text-on-primary); }

        /* Why Section */
        .why-section { padding: 60px 0; background: var(--surface); }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }
        .feature-icon {
          width: 60px; height: 60px;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 15px; font-size: 24px; color: white;
        }

        /* How It Works */
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

        /* ECO Section */
        .eco-section {
          padding: 60px 0;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          color: white;
        }
        .eco-content { text-align: center; max-width: 700px; margin: 0 auto; }
        .eco-icon { font-size: 50px; margin-bottom: 15px; }
        .eco-section h2 { font-size: 32px; margin-bottom: 15px; color: white; }
        .eco-section p { font-size: 16px; opacity: 0.95; margin-bottom: 30px; color: white; }
        .eco-stats {
          display: flex; justify-content: center; gap: 40px;
          margin-bottom: 30px; flex-wrap: wrap;
        }
        .eco-stat {
          display: flex; flex-direction: column;
          align-items: center; gap: 8px; padding: 0 20px;
        }
        .eco-stat-icon { font-size: 36px; }
        .eco-label { font-size: 14px; opacity: 0.95; font-weight: 600; }
        .eco-btn {
          background: white; color: var(--primary-dark);
          padding: 14px 32px; font-size: 15px;
        }
        .eco-btn:hover { background: var(--primary-light); transform: translateY(-2px); }

        /* RESPONSIVE */
        @media (max-width: 992px) {
          .hero-grid { grid-template-columns: 1fr; gap: 40px; }
          .hero-title { font-size: 38px; }
          .map-mockup { transform: rotate(0); }
          .stations-grid { grid-template-columns: repeat(2, 1fr); }
          .features-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .hero { padding: 40px 0 60px; }
          .hero-title { font-size: 30px; }
          .hero-subtitle { font-size: 15px; }
          .hero-search { flex-direction: column; padding: 12px; }
          .hero-search .search-icon { display: none; }
          .hero-search input { width: 100%; padding: 12px 8px; }
          .search-btn { width: 100%; margin-top: 8px; }
          .hero-highlights { gap: 8px; }
          .highlight-item { font-size: 12px; padding: 6px 10px; }
          .hero-actions { flex-direction: column; }
          .hero-btn { width: 100%; justify-content: center; }
          .stations-grid { grid-template-columns: 1fr; }
          .features-grid { grid-template-columns: 1fr; }
          .steps-grid { flex-direction: column; gap: 10px; }
          .step-arrow { transform: rotate(90deg); }
          .section-header { flex-direction: column; align-items: flex-start; }
          .eco-stats { gap: 20px; }
          .map-bg { height: 280px; }
          .map-station-card { min-width: 130px; padding: 8px 10px; }
          .station-name { font-size: 11px; }
        }
        @media (max-width: 480px) {
          .hero-title { font-size: 26px; }
          .hero-badge { font-size: 11px; }
          .eco-stat-icon { font-size: 28px; }
          .eco-label { font-size: 12px; }
          .map-bg { height: 240px; }
        }
      `}</style>
    </div>
  );
};

export default Home;