import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  FaCalendarAlt, FaClock, FaBolt, FaWallet, FaChargingStation,
  FaArrowLeft, FaCheckCircle, FaBan, FaSpinner
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection, addDoc, serverTimestamp, query, where, getDocs,
  getDoc, doc
} from 'firebase/firestore';
import {
  generateTimeSlots, isSlotBlocked, isPastSlot, getTodayString
} from '../utils/slotUtils';

const Booking = () => {
  const { stationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedCharger = searchParams.get('charger');

  // ============ STATE ============
  const [selectedCharger, setSelectedCharger] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedChargerData, setSelectedChargerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [station, setStation] = useState(null);
  const [chargers, setChargers] = useState([]);
  const [existingBookings, setExistingBookings] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const timeSlots = generateTimeSlots(6, 22, 60);

  // ============================================================
  // FETCH STATION + CHARGERS
  // ============================================================
  useEffect(() => {
    const fetchStationData = async () => {
      try {
        // Fetch station
        const stationDoc = await getDoc(doc(db, 'stations', stationId));
        if (stationDoc.exists()) {
          setStation({ id: stationDoc.id, ...stationDoc.data() });
        }

        // Fetch chargers sub-collection
        const chargersSnap = await getDocs(
          collection(db, 'stations', stationId, 'chargers')
        );
        const chargersData = [];
        chargersSnap.forEach((docSnap) => {
          chargersData.push({ id: docSnap.id, ...docSnap.data() });
        });

        let finalChargers = chargersData;

        // If no sub-collection chargers, use defaults
        if (chargersData.length === 0) {
          finalChargers = [
            { id: 'charger1', chargerNumber: '1', type: 'CCS', power: '60 kW', pricePerKwh: '₹15', status: 'available' },
            { id: 'charger2', chargerNumber: '2', type: 'Type 2', power: '22 kW', pricePerKwh: '₹12', status: 'available' },
            { id: 'charger3', chargerNumber: '3', type: 'CHAdeMO', power: '50 kW', pricePerKwh: '₹14', status: 'available' },
          ];
        }

        setChargers(finalChargers);

        // Handle preselected charger from URL (?charger=xxx)
        if (preselectedCharger) {
          const found = finalChargers.find((c) => c.id === preselectedCharger);
          if (found) {
            setSelectedCharger(preselectedCharger);
            setSelectedChargerData(found);
          }
        }
      } catch (err) {
        console.error('Error fetching station:', err);
        setError('Failed to load station data');
      }
    };

    fetchStationData();
  }, [stationId, preselectedCharger]);

  // ============================================================
  // FETCH EXISTING BOOKINGS for selected charger + date
  // ============================================================
  useEffect(() => {
    const fetchBookings = async () => {
      if (!selectedCharger || !selectedDate) {
        setExistingBookings([]);
        return;
      }

      setLoadingSlots(true);
      try {
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('stationId', '==', stationId),
          where('chargerId', '==', selectedCharger),
          where('date', '==', selectedDate)
        );
        const snapshot = await getDocs(bookingsQuery);
        const data = [];
        snapshot.forEach((docSnap) => {
          data.push({ id: docSnap.id, ...docSnap.data() });
        });
        setExistingBookings(data);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setExistingBookings([]);
      }
      setLoadingSlots(false);
    };

    fetchBookings();
  }, [selectedCharger, selectedDate, stationId]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleChargerSelect = (chargerId) => {
    setSelectedCharger(chargerId);
    setSelectedSlot(null);
    const charger = chargers.find((c) => c.id === chargerId);
    setSelectedChargerData(charger);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setError('');
  };

  const calculateCost = () => {
    if (!selectedChargerData) return 0;
    const priceStr = selectedChargerData.pricePerKwh || '15';
    const price = parseFloat(priceStr.replace(/[^\d.]/g, '')) || 15;
    const hours = 1;
    const energyPerHour = 10;
    return price * energyPerHour * hours;
  };

  const handleBooking = async (e) => {
    e.preventDefault();

    if (!user) {
      setError('Please login to book a slot');
      return;
    }
    if (!selectedCharger) {
      setError('Please select a charger');
      return;
    }
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // FINAL CONFLICT CHECK
      const conflictQuery = query(
        collection(db, 'bookings'),
        where('stationId', '==', stationId),
        where('chargerId', '==', selectedCharger),
        where('date', '==', selectedDate)
      );
      const conflictSnap = await getDocs(conflictQuery);

      const latestBookings = [];
      conflictSnap.forEach((docSnap) => latestBookings.push(docSnap.data()));

      if (isSlotBlocked(selectedSlot.start, selectedSlot.end, latestBookings, selectedDate)) {
        setError('❌ This slot was just booked by someone else. Please pick another slot.');
        setLoading(false);
        setExistingBookings(latestBookings);
        return;
      }

      // Create booking document
      const bookingData = {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || 'User',
        stationId: stationId,
        stationName: station?.name || 'Charging Station',
        stationAddress: station?.address || '',
        stationCity: station?.city || '',
        chargerId: selectedCharger,
        chargerType: selectedChargerData?.type || 'CCS',
        chargerPower: selectedChargerData?.power || '',
        date: selectedDate,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
        duration: 1,
        estimatedCost: calculateCost(),
        status: 'confirmed',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'bookings'), bookingData);

      alert('✅ Booking confirmed successfully!');
      navigate('/history');
    } catch (err) {
      console.error('Booking error:', err);
      setError(err.message || 'Failed to create booking');
    }
    setLoading(false);
  };

  // ============================================================
  // LOGIN REQUIRED SCREEN
  // ============================================================
  if (!user) {
    return (
      <div className="booking-page">
        <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
          <div className="login-required">
            <FaBan className="lock-icon" />
            <h2>Login Required</h2>
            <p>You need to login to book a charging slot.</p>
            <Link to="/login" className="btn btn-primary">Login Now</Link>
          </div>
        </div>
        <style jsx>{`
          .booking-page { min-height: 100vh; background: var(--bg); }
          .login-required {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 60px 40px;
            max-width: 500px;
            margin: 0 auto;
            box-shadow: var(--shadow-lg);
          }
          .lock-icon {
            font-size: 60px;
            color: var(--status-unavailable);
            margin-bottom: 20px;
          }
          .login-required h2 {
            color: var(--text);
            margin-bottom: 12px;
            font-weight: 800;
          }
          .login-required p {
            color: var(--text-muted);
            margin-bottom: 24px;
          }
        `}</style>
      </div>
    );
  }

  // ============================================================
  // MAIN BOOKING UI
  // ============================================================
  return (
    <div className="booking-page">
      <div className="container" style={{ padding: '40px 20px' }}>
        <Link to={`/stations/${stationId}`} className="back-link">
          <FaArrowLeft /> Back to Station
        </Link>

        <h1 className="page-title">Book Charging Slot</h1>
        <p className="page-subtitle">
          {station?.name || 'Charging Station'} — {station?.city || ''}
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleBooking} className="booking-form">
          {/* ============ STEP 1: SELECT CHARGER ============ */}
          <div className="form-section">
            <h3 className="section-label">
              <span className="step-badge">1</span> Select Charger
            </h3>
            <div className="charger-grid">
              {chargers.map((charger) => (
                <button
                  type="button"
                  key={charger.id}
                  className={`charger-option ${
                    selectedCharger === charger.id ? 'selected' : ''
                  } ${charger.status !== 'available' ? 'disabled' : ''}`}
                  onClick={() =>
                    charger.status === 'available' && handleChargerSelect(charger.id)
                  }
                  disabled={charger.status !== 'available'}
                >
                  <FaChargingStation className="charger-icon" />
                  <div className="charger-info">
                    <span className="charger-type">{charger.type}</span>
                    <span className="charger-meta">
                      {charger.power} • {charger.pricePerKwh}
                    </span>
                    <span className={`charger-status ${charger.status}`}>
                      {charger.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ============ STEP 2: SELECT DATE ============ */}
          {selectedCharger && (
            <div className="form-section">
              <h3 className="section-label">
                <span className="step-badge">2</span> Select Date
              </h3>
              <input
                type="date"
                value={selectedDate}
                min={getTodayString()}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot(null);
                }}
                className="date-input"
                required
              />
            </div>
          )}

          {/* ============ STEP 3: SELECT TIME SLOT ============ */}
          {selectedCharger && selectedDate && (
            <div className="form-section">
              <h3 className="section-label">
                <span className="step-badge">3</span> Select Time Slot
              </h3>

              {loadingSlots ? (
                <div className="loading-slots">
                  <FaSpinner className="spinning" /> Loading available slots...
                </div>
              ) : (
                <>
                  <div className="slots-legend">
                    <span className="legend-item">
                      <span className="legend-dot available"></span> Available
                    </span>
                    <span className="legend-item">
                      <span className="legend-dot booked"></span> Booked
                    </span>
                    <span className="legend-item">
                      <span className="legend-dot selected"></span> Selected
                    </span>
                    <span className="legend-item">
                      <span className="legend-dot past"></span> Past
                    </span>
                  </div>

                  <div className="slots-grid">
                    {timeSlots.map((slot, index) => {
                      const blocked = isSlotBlocked(
                        slot.start,
                        slot.end,
                        existingBookings,
                        selectedDate
                      );
                      const past = isPastSlot(slot.start, selectedDate);
                      const isSelected =
                        selectedSlot?.start === slot.start &&
                        selectedSlot?.end === slot.end;

                      let statusClass = 'available';
                      if (blocked) statusClass = 'booked';
                      else if (past) statusClass = 'past';
                      else if (isSelected) statusClass = 'selected';

                      return (
                        <button
                          type="button"
                          key={index}
                          className={`slot-btn ${statusClass}`}
                          onClick={() =>
                            !blocked && !past && handleSlotSelect(slot)
                          }
                          disabled={blocked || past}
                        >
                          <span className="slot-label">{slot.label}</span>
                          {blocked && <span className="slot-status">Booked</span>}
                          {past && <span className="slot-status">Past</span>}
                          {isSelected && <FaCheckCircle className="slot-check" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ============ STEP 4: SUMMARY ============ */}
          {selectedSlot && (
            <div className="form-section">
              <h3 className="section-label">
                <span className="step-badge">4</span> Booking Summary
              </h3>
              <div className="summary-card">
                <div className="summary-row">
                  <FaChargingStation className="summary-icon" />
                  <span>
                    Charger: <strong>{selectedChargerData?.type}</strong>
                  </span>
                </div>
                <div className="summary-row">
                  <FaCalendarAlt className="summary-icon" />
                  <span>
                    Date: <strong>{selectedDate}</strong>
                  </span>
                </div>
                <div className="summary-row">
                  <FaClock className="summary-icon" />
                  <span>
                    Time: <strong>{selectedSlot.label}</strong>
                  </span>
                </div>
                <div className="summary-row total">
                  <FaWallet className="summary-icon" />
                  <span>
                    Estimated Cost: <strong>₹{calculateCost()}</strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ============ SUBMIT ============ */}
          {selectedSlot && (
            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'Booking...' : '✅ Confirm Booking'}
            </button>
          )}
        </form>
      </div>

      <style jsx>{`
        .booking-page {
          padding: 20px 0;
          min-height: 100vh;
          background: var(--bg);
        }

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
        .back-link:hover {
          text-decoration: underline;
        }

        .page-title {
          text-align: center;
          font-size: 32px;
          color: var(--text);
          margin-bottom: 8px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .page-subtitle {
          text-align: center;
          color: var(--text-muted);
          margin-bottom: 32px;
          font-size: 15px;
        }

        .booking-form {
          max-width: 720px;
          margin: 0 auto;
          background: var(--surface);
          padding: 32px;
          border-radius: 20px;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-xl);
        }

        .form-section {
          margin-bottom: 28px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--border);
        }
        .form-section:last-of-type {
          border-bottom: none;
        }

        .section-label {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 16px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 16px;
        }
        .step-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: var(--primary);
          color: white;
          border-radius: 50%;
          font-size: 14px;
          font-weight: 700;
        }

        .charger-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 12px;
        }
        .charger-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: var(--bg);
          border: 2px solid var(--border);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          font-family: inherit;
        }
        .charger-option:hover:not(.disabled) {
          border-color: var(--primary);
          transform: translateY(-2px);
        }
        .charger-option.selected {
          border-color: var(--primary);
          background: var(--primary-light);
          box-shadow: 0 0 0 3px rgba(35, 134, 54, 0.15);
        }
        .charger-option.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .charger-icon {
          font-size: 28px;
          color: var(--primary);
          flex-shrink: 0;
        }
        .charger-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex: 1;
        }
        .charger-type {
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
        }
        .charger-meta {
          font-size: 12px;
          color: var(--text-muted);
        }
        .charger-status {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 4px;
          padding: 2px 8px;
          border-radius: 10px;
          width: fit-content;
        }
        .charger-status.available {
          background: var(--status-available-bg);
          color: var(--status-available);
        }
        .charger-status.occupied,
        .charger-status.maintenance {
          background: var(--status-unavailable-bg);
          color: var(--status-unavailable);
        }

        .date-input {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid var(--border);
          border-radius: 12px;
          font-size: 15px;
          background: var(--surface);
          color: var(--text);
          font-family: inherit;
          transition: all 0.2s;
        }
        .date-input:focus {
          border-color: var(--primary);
          outline: none;
          box-shadow: 0 0 0 3px rgba(35, 134, 54, 0.1);
        }

        .slots-legend {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 16px;
          padding: 12px 16px;
          background: var(--bg);
          border-radius: 10px;
          font-size: 12px;
          color: var(--text-muted);
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 4px;
        }
        .legend-dot.available {
          background: var(--status-available-bg);
          border: 1px solid var(--status-available);
        }
        .legend-dot.booked {
          background: var(--status-unavailable-bg);
          border: 1px solid var(--status-unavailable);
        }
        .legend-dot.selected {
          background: var(--primary);
        }
        .legend-dot.past {
          background: var(--bg-hover);
          border: 1px solid var(--border-strong);
        }

        .slots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 10px;
        }
        .slot-btn {
          position: relative;
          padding: 14px 12px;
          border: 2px solid var(--border);
          border-radius: 12px;
          background: var(--surface);
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
          text-align: center;
        }
        .slot-btn.available:hover {
          border-color: var(--primary);
          background: var(--primary-light);
          color: var(--primary);
          transform: translateY(-2px);
        }
        .slot-btn.selected {
          border-color: var(--primary);
          background: var(--primary);
          color: white;
          box-shadow: 0 4px 12px rgba(35, 134, 54, 0.3);
        }
        .slot-btn.booked {
          background: var(--status-unavailable-bg);
          color: var(--status-unavailable);
          border-color: var(--status-unavailable);
          cursor: not-allowed;
          opacity: 0.85;
        }
        .slot-btn.past {
          background: var(--bg-hover);
          color: var(--text-muted);
          cursor: not-allowed;
          opacity: 0.6;
        }
        .slot-label {
          display: block;
        }
        .slot-status {
          display: block;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 4px;
        }
        .slot-check {
          position: absolute;
          top: 6px;
          right: 6px;
          font-size: 12px;
        }

        .loading-slots {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 40px;
          color: var(--text-muted);
          font-size: 14px;
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .summary-card {
          background: var(--primary-light);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 20px;
        }
        .summary-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          color: var(--text);
          font-size: 14px;
        }
        .summary-row + .summary-row {
          border-top: 1px dashed var(--border);
        }
        .summary-row.total {
          font-weight: 700;
          color: var(--primary);
          font-size: 16px;
          margin-top: 6px;
        }
        .summary-icon {
          color: var(--primary);
          font-size: 16px;
          flex-shrink: 0;
        }

        .error-message {
          background: var(--status-unavailable-bg);
          color: var(--status-unavailable);
          padding: 14px 16px;
          border-radius: 10px;
          margin-bottom: 20px;
          border-left: 4px solid var(--status-unavailable);
          font-size: 14px;
          font-weight: 500;
        }

        .btn-full {
          width: 100%;
          padding: 16px;
          font-size: 16px;
          font-weight: 700;
        }

        @media (max-width: 768px) {
          .booking-form {
            padding: 20px;
          }
          .charger-grid {
            grid-template-columns: 1fr;
          }
          .slots-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .page-title {
            font-size: 24px;
          }
          .slots-legend {
            gap: 12px;
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
};

export default Booking;