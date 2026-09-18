import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaClock, FaBolt, FaWallet } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const Booking = () => {
  const { stationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedCharger, setSelectedCharger] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const chargers = [
    { id: 'charger1', type: 'CCS', power: '150kW', price: '₹12/kWh', available: true },
    { id: 'charger2', type: 'CHAdeMO', power: '100kW', price: '₹14/kWh', available: true },
    { id: 'charger3', type: 'Type 2', power: '50kW', price: '₹10/kWh', available: false }
  ];

  const handleBooking = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const selectedChargerData = chargers.find(c => c.id === selectedCharger);
      
      // Create Booking
      const bookingData = {
        userId: user.uid,
        stationId: stationId,
        chargerId: selectedCharger,
        date: date,
        startTime: startTime,
        duration: duration,
        estimatedCost: calculateCost(),
        status: 'confirmed',
        createdAt: serverTimestamp()
      };

      const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);
      
      // Create Charging Session
      const sessionData = {
        userId: user.uid,
        stationId: stationId,
        stationName: 'GreenCharge Hub',
        chargerId: selectedCharger,
        chargerType: selectedChargerData?.type || 'CCS',
        bookingId: bookingRef.id,
        startTime: serverTimestamp(),
        duration: duration * 60,
        energyConsumed: 0,
        amount: 0,
        co2Saved: 0,
        status: 'active'
      };

      await addDoc(collection(db, 'chargingSessions'), sessionData);

      alert('✅ Booking confirmed successfully! Charging session started.');
      navigate('/dashboard');
    } catch (error) {
      setError(error.message || 'Failed to create booking');
    }
    setLoading(false);
  };

  const calculateCost = () => {
    const charger = chargers.find(c => c.id === selectedCharger);
    if (!charger) return 0;
    const price = parseInt(charger.price.replace('₹', '').replace('/kWh', ''));
    return price * duration * 10;
  };

  return (
    <div className="booking-page">
      <div className="container" style={{ padding: '40px 0' }}>
        <h1 className="page-title">Book Charging Slot</h1>
        <p className="booking-subtitle">Station #{stationId}</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleBooking} className="booking-form">
          <div className="form-group">
            <label>Select Charger</label>
            <select 
              value={selectedCharger} 
              onChange={(e) => setSelectedCharger(e.target.value)}
              required
            >
              <option value="">Choose a charger...</option>
              {chargers.map(charger => (
                <option key={charger.id} value={charger.id} disabled={!charger.available}>
                  {charger.type} - {charger.power} - {charger.price} 
                  {charger.available ? ' ✅ Available' : ' ❌ Unavailable'}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Duration (hours)</label>
              <select value={duration} onChange={(e) => setDuration(parseInt(e.target.value))}>
                <option value={1}>1 hour</option>
                <option value={2}>2 hours</option>
                <option value={3}>3 hours</option>
                <option value={4}>4 hours</option>
              </select>
            </div>
          </div>

          <div className="booking-summary">
            <h3>Booking Summary</h3>
            <div className="summary-item">
              <FaBolt className="summary-icon" />
              <span>Charger: {selectedCharger ? chargers.find(c => c.id === selectedCharger)?.type : 'Not selected'}</span>
            </div>
            <div className="summary-item">
              <FaCalendarAlt className="summary-icon" />
              <span>Date: {date || 'Not selected'}</span>
            </div>
            <div className="summary-item">
              <FaClock className="summary-icon" />
              <span>Time: {startTime || 'Not selected'} ({duration}h)</span>
            </div>
            <div className="summary-item total">
              <FaWallet className="summary-icon" />
              <span>Estimated Cost: ₹{calculateCost()}</span>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Booking...' : 'Confirm Booking'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .booking-page { padding: 20px 0; }
        .page-title { text-align: center; font-size: 36px; color: #1a1a2e; margin-bottom: 8px; }
        .booking-subtitle { text-align: center; color: #6c757d; margin-bottom: 30px; }
        .error-message { background: #f8d7da; color: #721c24; padding: 12px; border-radius: 8px; margin-bottom: 20px; }
        .booking-form { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; font-weight: 600; margin-bottom: 8px; color: #1a1a2e; }
        .form-group input, .form-group select { width: 100%; padding: 12px; border: 1px solid #dee2e6; border-radius: 8px; font-size: 16px; }
        .form-group input:focus, .form-group select:focus { border-color: #2e7d32; outline: none; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .booking-summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .booking-summary h3 { margin-bottom: 15px; color: #1a1a2e; }
        .summary-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
        .summary-item:last-child { border-bottom: none; }
        .summary-icon { color: #2e7d32; }
        .total { font-weight: 700; font-size: 18px; color: #2e7d32; }
        .btn-full { width: 100%; padding: 14px; font-size: 18px; }
        .btn-full:disabled { opacity: 0.6; cursor: not-allowed; }
        @media (max-width: 768px) { .form-row { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};

export default Booking;