import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBolt, FaMapMarkerAlt, FaHistory, FaLeaf, FaWallet, FaPlug, FaChartLine } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ sessions: 0, spent: 0, energy: 0, co2: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const sessionQ = query(collection(db, 'chargingSessions'), where('userId', '==', user.uid));
        const sessionSnapshot = await getDocs(sessionQ);
        let totalSessions = 0, totalSpent = 0, totalEnergy = 0, totalCo2 = 0;
        sessionSnapshot.forEach((doc) => {
          const data = doc.data();
          totalSessions++;
          totalSpent += data.amount || 0;
          totalEnergy += data.energyConsumed || 0;
          totalCo2 += data.co2Saved || 0;
        });

        const bookingQ = query(collection(db, 'bookings'), where('userId', '==', user.uid));
        const bookingSnapshot = await getDocs(bookingQ);
        let totalBookings = 0;
        bookingSnapshot.forEach(() => totalBookings++);

        setStats({
          sessions: totalSessions + totalBookings,
          spent: totalSpent,
          energy: totalEnergy,
          co2: totalCo2
        });
      } catch (error) { console.error('Error fetching stats:', error); }
      setLoading(false);
    };
    fetchStats();
  }, [user]);

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="dashboard-page">
      <div className="container" style={{ padding: '40px 0' }}>
        <h1 className="page-title">Welcome back, {user?.displayName || 'User'}!</h1>
        
        <div className="stats-grid">
          <div className="stat-card"><FaPlug className="stat-icon" /><h3>{stats.sessions}</h3><p>Charging Sessions</p></div>
          <div className="stat-card"><FaWallet className="stat-icon" /><h3>₹{stats.spent}</h3><p>Total Spent</p></div>
          <div className="stat-card"><FaBolt className="stat-icon" /><h3>{stats.energy} kWh</h3><p>Energy Consumed</p></div>
          <div className="stat-card"><FaLeaf className="stat-icon" /><h3>{stats.co2.toFixed(1)} kg</h3><p>CO₂ Saved</p></div>
        </div>

        <div className="dashboard-actions">
          <Link to="/stations" className="action-card"><FaMapMarkerAlt className="action-icon" /><h3>Find Station</h3><p>Search nearby charging stations</p></Link>
          <Link to="/stations" className="action-card"><FaBolt className="action-icon" /><h3>Book Charger</h3><p>Book a charging slot</p></Link>
          <Link to="/history" className="action-card"><FaHistory className="action-icon" /><h3>Charging History</h3><p>View your past sessions</p></Link>
          <Link to="/sustainability" className="action-card"><FaChartLine className="action-icon" /><h3>My Impact</h3><p>Track your sustainability</p></Link>
        </div>
      </div>

      <style jsx>{`
        .dashboard-page { padding: 20px 0; }
        .page-title { text-align: center; font-size: 32px; color: #1a1a2e; margin-bottom: 30px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
        .stat-card { background: white; padding: 25px; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .stat-icon { font-size: 32px; color: #2e7d32; margin-bottom: 10px; }
        .stat-card h3 { font-size: 24px; color: #1a1a2e; }
        .stat-card p { color: #6c757d; }
        .dashboard-actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .action-card { background: white; padding: 30px; border-radius: 12px; text-align: center; text-decoration: none; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: all 0.3s ease; }
        .action-card:hover { transform: translateY(-5px); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
        .action-icon { font-size: 36px; color: #2e7d32; margin-bottom: 12px; }
        .action-card h3 { color: #1a1a2e; margin-bottom: 8px; }
        .action-card p { color: #6c757d; font-size: 14px; }
        @media (max-width: 768px) { 
          .stats-grid { grid-template-columns: repeat(2, 1fr); } 
          .dashboard-actions { grid-template-columns: repeat(2, 1fr); } 
        }
        @media (max-width: 480px) { 
          .stats-grid { grid-template-columns: 1fr; } 
          .dashboard-actions { grid-template-columns: 1fr; } 
        }
      `}</style>
    </div>
  );
};

export default Dashboard;