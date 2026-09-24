import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBolt, FaMapMarkerAlt, FaHistory, FaLeaf, FaWallet, FaPlug, FaChartLine } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ bookings: 0, spent: 0, energy: 0, co2: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        // Fetch user's bookings
        const bookingQ = query(
          collection(db, 'bookings'),
          where('userId', '==', user.uid)
        );
        const bookingSnapshot = await getDocs(bookingQ);

        let totalBookings = 0;
        let totalSpent = 0;

        bookingSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status !== 'cancelled') {
            totalBookings++;
            totalSpent += data.estimatedCost || 0;
          }
        });

        // Estimate energy: ~10 kWh per hour (1 hour bookings)
        const totalEnergy = totalBookings * 10;
        // Estimate CO2 saved: ~0.28 kg per kWh
        const totalCo2 = totalEnergy * 0.28;

        setStats({
          bookings: totalBookings,
          spent: totalSpent,
          energy: totalEnergy,
          co2: totalCo2,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
      setLoading(false);
    };
    fetchStats();
  }, [user]);

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="dashboard-page">
      <div className="container" style={{ padding: '40px 20px' }}>
        <h1 className="page-title">
          Welcome back, {user?.displayName || 'User'}!
        </h1>

        <div className="stats-grid">
          <div className="stat-card">
            <FaPlug className="stat-icon" />
            <h3>{stats.bookings}</h3>
            <p>Total Bookings</p>
          </div>
          <div className="stat-card">
            <FaWallet className="stat-icon" />
            <h3>₹{stats.spent}</h3>
            <p>Total Spent</p>
          </div>
          <div className="stat-card">
            <FaBolt className="stat-icon" />
            <h3>{stats.energy} kWh</h3>
            <p>Energy Consumed</p>
          </div>
          <div className="stat-card">
            <FaLeaf className="stat-icon" />
            <h3>{stats.co2.toFixed(1)} kg</h3>
            <p>CO₂ Saved</p>
          </div>
        </div>

        <div className="dashboard-actions">
          <Link to="/stations" className="action-card">
            <FaMapMarkerAlt className="action-icon" />
            <h3>Find Station</h3>
            <p>Search nearby charging stations</p>
          </Link>
          <Link to="/stations" className="action-card">
            <FaBolt className="action-icon" />
            <h3>Book Charger</h3>
            <p>Book a charging slot</p>
          </Link>
          <Link to="/history" className="action-card">
            <FaHistory className="action-icon" />
            <h3>Booking History</h3>
            <p>View your past bookings</p>
          </Link>
          <Link to="/sustainability" className="action-card">
            <FaChartLine className="action-icon" />
            <h3>My Impact</h3>
            <p>Track your sustainability</p>
          </Link>
        </div>
      </div>

      <style jsx>{`
        .dashboard-page {
          padding: 20px 0;
          min-height: 100vh;
          background: var(--bg);
        }
        .page-title {
          text-align: center;
          font-size: 32px;
          color: var(--text);
          margin-bottom: 30px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 40px;
        }
        .stat-card {
          background: var(--surface);
          padding: 28px 24px;
          border-radius: 16px;
          text-align: center;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-md);
          transition: all 0.3s;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
          border-color: var(--border-strong);
        }
        .stat-icon {
          font-size: 32px;
          color: var(--primary);
          margin-bottom: 12px;
        }
        .stat-card h3 {
          font-size: 26px;
          color: var(--text);
          font-weight: 800;
          letter-spacing: -0.03em;
          margin-bottom: 4px;
        }
        .stat-card p {
          color: var(--text-muted);
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          font-weight: 600;
        }
        .dashboard-actions {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .action-card {
          background: var(--surface);
          padding: 32px 24px;
          border-radius: 16px;
          text-align: center;
          text-decoration: none;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-md);
          transition: all 0.3s;
        }
        .action-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-lg);
          border-color: var(--primary);
        }
        .action-icon {
          font-size: 36px;
          color: var(--primary);
          margin-bottom: 12px;
        }
        .action-card h3 {
          color: var(--text);
          margin-bottom: 8px;
          font-size: 16px;
          font-weight: 700;
        }
        .action-card p {
          color: var(--text-muted);
          font-size: 13px;
        }
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .dashboard-actions {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .dashboard-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;