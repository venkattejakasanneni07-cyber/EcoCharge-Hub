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
          collection(db, 'chargingSessions'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        let totalCo2 = 0;
        let totalEnergy = 0;
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          totalCo2 += data.co2Saved || 0;
          totalEnergy += data.energyConsumed || 0;
        });
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
      <div className="container" style={{ padding: '40px 0' }}>
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

      <style jsx>{`
        .sustainability-page { padding: 20px 0; }
        .page-title { text-align: center; font-size: 36px; color: #1a1a2e; margin-bottom: 40px; }
        .sustainability-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
        .sustainability-card { background: white; padding: 30px; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .sustain-icon { font-size: 32px; color: #2e7d32; margin-bottom: 10px; }
        .sustain-number { font-size: 36px; font-weight: 700; color: #1a1a2e; }
        .sustain-unit { color: #6c757d; font-size: 14px; }
        .sustainability-card p { margin-top: 10px; color: #6c757d; }
        .sustainability-info { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .sustainability-info h3 { color: #1a1a2e; margin-bottom: 15px; }
        .sustainability-info p { color: #333; line-height: 1.8; }
        .disclaimer { font-size: 14px; color: #6c757d !important; margin-top: 10px; font-style: italic; }
        @media (max-width: 768px) { .sustainability-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .sustainability-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};

export default Sustainability;