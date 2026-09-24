import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaBolt, FaClock, FaStar, FaArrowLeft, FaPlug } from 'react-icons/fa';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import Reviews from '../components/Reviews';

const StationDetails = () => {
  const { id } = useParams();
  const [station, setStation] = useState(null);
  const [chargers, setChargers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStationData = async () => {
      try {
        // Fetch station
        const stationDoc = await getDoc(doc(db, 'stations', id));
        if (stationDoc.exists()) {
          setStation({ id: stationDoc.id, ...stationDoc.data() });
        }

        // Fetch chargers
        const chargersSnapshot = await getDocs(collection(db, 'stations', id, 'chargers'));
        const chargersData = [];
        chargersSnapshot.forEach((doc) => {
          chargersData.push({ id: doc.id, ...doc.data() });
        });

        // If no sub-collection chargers, use defaults
        if (chargersData.length === 0) {
          setChargers([
            { id: 'charger1', chargerNumber: '1', type: 'CCS', power: '60 kW', pricePerKwh: '₹15', status: 'available' },
            { id: 'charger2', chargerNumber: '2', type: 'Type 2', power: '22 kW', pricePerKwh: '₹12', status: 'available' },
            { id: 'charger3', chargerNumber: '3', type: 'CHAdeMO', power: '50 kW', pricePerKwh: '₹14', status: 'available' },
          ]);
        } else {
          setChargers(chargersData);
        }
      } catch (error) {
        console.error('Error fetching station:', error);
      }
      setLoading(false);
    };
    fetchStationData();
  }, [id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#238636';
      case 'occupied': return '#dc2626';
      case 'maintenance': return '#f59e0b';
      default: return '#6c757d';
    }
  };

  if (loading) return <div className="spinner"></div>;
  if (!station) return <div className="container" style={{ padding: '40px' }}>Station not found</div>;

  return (
    <div className="station-details-page">
      <div className="container" style={{ padding: '40px 20px' }}>
        <Link to="/stations" className="back-link">
          <FaArrowLeft /> Back to Stations
        </Link>

        <div className="station-header">
          <h1>{station.name}</h1>
          <div className="rating">
            <FaStar className="star-icon" />
            <span>{station.averageRating || station.rating || 4.5}</span>
            <span className="review-count">
              ({station.totalReviews || 0} reviews)
            </span>
          </div>
        </div>

        <div className="station-info">
          <div className="info-item">
            <FaMapMarkerAlt className="info-icon" />
            <span>{station.address}, {station.city}</span>
          </div>
          <div className="info-item">
            <FaClock className="info-icon" />
            <span>Open: {station.openingHours || '24/7'}</span>
          </div>
        </div>

        <div className="chargers-section">
          <h2>Available Chargers</h2>
          {chargers.length === 0 ? (
            <div className="empty-state">
              <p>No chargers available at this station yet.</p>
            </div>
          ) : (
            <div className="chargers-grid">
              {chargers.map(charger => (
                <div key={charger.id} className="charger-card">
                  <div className="charger-header">
                    <h3>{charger.type}</h3>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(charger.status) }}
                    >
                      {charger.status}
                    </span>
                  </div>
                  <div className="charger-details">
                    <p><FaPlug /> Charger #{charger.chargerNumber || charger.id}</p>
                    <p><strong>Power:</strong> {charger.power}</p>
                    <p><strong>Price:</strong> {charger.pricePerKwh}</p>
                  </div>
                  {charger.status === 'available' ? (
                    <Link
                      to={`/booking/${station.id}?charger=${charger.id}`}
                      className="btn btn-primary"
                    >
                      Book Now
                    </Link>
                  ) : (
                    <button
                      className="btn btn-secondary"
                      disabled
                      style={{ width: '100%', padding: '10px' }}
                    >
                      Not Available
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <Reviews stationId={station.id} stationName={station.name} />
      </div>

      <style jsx>{`
        .station-details-page { padding: 20px 0; min-height: 100vh; background: var(--bg); }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--primary);
          text-decoration: none;
          margin-bottom: 20px;
          font-weight: 600;
          font-size: 14px;
        }
        .back-link:hover { text-decoration: underline; }
        .station-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .station-header h1 { font-size: 32px; color: var(--text); font-weight: 800; letter-spacing: -0.02em; }
        .rating { display: flex; align-items: center; gap: 5px; color: #f59e0b; font-size: 18px; }
        .star-icon { color: #f59e0b; }
        .review-count { color: var(--text-muted); font-size: 14px; }
        .station-info {
          display: flex;
          gap: 30px;
          background: var(--surface);
          padding: 20px;
          border-radius: 16px;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-md);
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        .info-item { display: flex; align-items: center; gap: 10px; color: var(--text); }
        .info-icon { color: var(--primary); }
        .empty-state {
          text-align: center;
          padding: 40px;
          background: var(--surface);
          border-radius: 12px;
          color: var(--text-muted);
        }
        .chargers-section h2 {
          margin-bottom: 20px;
          color: var(--text);
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        .chargers-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }
        .charger-card {
          background: var(--surface);
          padding: 20px;
          border-radius: 16px;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-md);
          transition: all 0.3s;
        }
        .charger-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
          border-color: var(--border-strong);
        }
        .charger-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .charger-header h3 { color: var(--text); font-size: 18px; font-weight: 700; }
        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          color: white;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .charger-details p {
          margin: 5px 0;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }
        .charger-details strong { color: var(--text); }
        .charger-card .btn {
          width: 100%;
          margin-top: 12px;
          text-align: center;
        }
        .charger-card .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: var(--text-subtle);
          border: none;
        }

        @media (max-width: 992px) {
          .chargers-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .station-header { flex-direction: column; align-items: flex-start; }
          .station-info { flex-direction: column; gap: 10px; }
          .chargers-grid { grid-template-columns: 1fr; }
          .station-header h1 { font-size: 24px; }
        }
      `}</style>
    </div>
  );
};

export default StationDetails;