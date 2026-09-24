import React, { useState, useEffect } from 'react';
import { FaLeaf, FaBolt, FaCar, FaTree } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const Sustainability = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    co2Saved: 0,
    energyConsumed: 0,
    distance: 0,
    trees: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'bookings'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);

        let totalEnergy = 0;
        let totalCo2 = 0;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Only count confirmed / completed bookings
          if (data.status === 'confirmed' || data.status === 'completed') {
            // Estimate 10 kWh per booking (same as Dashboard)
            totalEnergy += 10;
          }
        });

        // CO₂ saved = energy × 0.28 kg/kWh
        totalCo2 = totalEnergy * 0.28;

        setStats({
          co2Saved: totalCo2,
          energyConsumed: totalEnergy,
          distance: totalEnergy * 4.5,
          trees: totalCo2 / 21
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
    <div className="sustainability-page">
      <div className="container" style={{ padding: '40px 20px' }}>
        <h1 className="page-title">Sustainability Dashboard</h1>

        <div className="sustainability-grid">
          <div className="sustainability-card">
            <FaLeaf className="sustain-icon" />
            <div className="sustain-number">{stats.co2Saved.toFixed(1)}</div>
            <div className="sustain-unit">kg CO₂</div>
            <p>Total CO₂ Saved</p>
          </div>

          <div className="sustainability-card">
            <FaBolt className="sustain-icon" />
            <div className="sustain-number">{stats.energyConsumed.toFixed(0)}</div>
            <div className="sustain-unit">kWh</div>
            <p>Energy Consumed</p>
          </div>

          <div className="sustainability-card">
            <FaCar className="sustain-icon" />
            <div className="sustain-number">{stats.distance.toFixed(0)}</div>
            <div className="sustain-unit">km</div>
            <p>Estimated Distance</p>
          </div>

          <div className="sustainability-card">
            <FaTree className="sustain-icon" />
            <div className="sustain-number">{stats.trees.toFixed(1)}</div>
            <div className="sustain-unit">trees</div>
            <p>Tree Equivalent</p>
          </div>
        </div>

        <div className="sustainability-info">
          <h3>Your Environmental Impact</h3>
          <p>
            By choosing electric vehicles and using EcoChargeHub, you've helped
            save {stats.co2Saved.toFixed(1)} kg of CO₂ emissions. This is equivalent
            to planting {stats.trees.toFixed(1)} trees!
          </p>
          <p className="disclaimer">
            * These are estimated calculations based on average petrol vehicle emissions.
          </p>
        </div>
      </div>

      <style>{`
        .sustainability-page { padding: 20px 0; min-height: 100vh; background: var(--bg); }
        .sustainability-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 40px;
        }
        .sustain-icon { font-size: 32px; color: var(--primary); margin-bottom: 10px; }
        .sustain-number {
          font-size: 36px;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.04em;
        }
        .sustain-unit { color: var(--text-muted); font-size: 14px; }
        .sustainability-card p { margin-top: 10px; color: var(--text-muted); }
        .sustainability-info h3 { color: var(--text); margin-bottom: 15px; }
        .sustainability-info p { color: var(--text-muted); line-height: 1.8; }
        .disclaimer {
          font-size: 14px;
          color: var(--text-subtle) !important;
          margin-top: 10px;
          font-style: italic;
        }
        @media (max-width: 768px) {
          .sustainability-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .sustainability-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default Sustainability;