import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FaWallet, FaCheckCircle, FaBan
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection, addDoc, serverTimestamp, query, where, getDocs, getDoc, doc
} from 'firebase/firestore';
import { generateTimeSlots, getTodayString } from '../utils/slotUtils';

const Booking = () => {
  const { stationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedCharger, setSelectedCharger] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedChargerData, setSelectedChargerData] = useState(null);
  const [error, setError] = useState('');

  const [station, setStation] = useState(null);
  const [chargers, setChargers] = useState([]);
  const [existingBookings, setExistingBookings] = useState([]);
  
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Timer to update "Past" status automatically
  const [currentTime, setCurrentTime] = useState(new Date());

  const timeSlots = generateTimeSlots(6, 22, 60); 

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchStationData = async () => {
      try {
        const stationDoc = await getDoc(doc(db, 'stations', stationId));
        if (stationDoc.exists()) setStation({ id: stationDoc.id, ...stationDoc.data() });

        const chargersSnap = await getDocs(collection(db, 'stations', stationId, 'chargers'));
        const chargersData = [];
        chargersSnap.forEach((docSnap) => chargersData.push({ id: docSnap.id, ...docSnap.data() }));

        if (chargersData.length === 0) {
          chargersData.push(
            { id: 'charger1', chargerNumber: '1', type: 'CCS', power: '60 kW', pricePerKwh: '₹15', status: 'available' },
            { id: 'charger2', chargerNumber: '2', type: 'Type 2', power: '22 kW', pricePerKwh: '₹12', status: 'available' }
          );
        }
        setChargers(chargersData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStationData();
  }, [stationId]);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!selectedCharger || !selectedDate) return;
      try {
        const q = query(
          collection(db, 'bookings'),
          where('stationId', '==', stationId),
          where('chargerId', '==', selectedCharger),
          where('date', '==', selectedDate)
        );
        const snapshot = await getDocs(q);
        const data = [];
        snapshot.forEach((docSnap) => {
          if(docSnap.data().status !== 'cancelled') data.push({ id: docSnap.id, ...docSnap.data() });
        });
        setExistingBookings(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBookings();
  }, [selectedCharger, selectedDate, stationId]);

  const toMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const isBlockBooked = (slotStart, slotEnd) => {
    const reqStart = toMinutes(slotStart);
    const reqEnd = toMinutes(slotEnd);
    return existingBookings.some((booking) => {
      const bookStart = toMinutes(booking.startTime);
      const bookEnd = toMinutes(booking.endTime);
      return (reqStart < bookEnd && reqEnd > bookStart);
    });
  };

  const isSlotPast = (slotStart) => {
    const today = getTodayString();
    if (selectedDate > today) return false; 
    if (selectedDate < today) return true;

    const currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    return toMinutes(slotStart) < currentMins;
  };

  const calculateHours = () => {
    if (!startTime || !endTime) return 0;
    const startMins = toMinutes(startTime);
    const endMins = toMinutes(endTime);
    if (endMins <= startMins) return 0;
    return (endMins - startMins) / 60;
  };

  const calculateCost = () => {
    if (!selectedChargerData) return 0;
    let basePrice = station?.pricePerKwh || 15;
    if (selectedChargerData.pricePerKwh) {
      const parsed = parseFloat(String(selectedChargerData.pricePerKwh).replace(/[^\d.]/g, ''));
      if (!isNaN(parsed)) basePrice = parsed;
    }
    return Math.round(basePrice * 10 * calculateHours());
  };

  // 🔥 RAZORPAY PAYMENT HANDLER
  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) return setError('Please login to book.');
    if (calculateHours() <= 0) return setError('End time must be after start time.');
    if (isSlotPast(startTime)) return setError('❌ You cannot book a time in the past.');
    if (isBlockBooked(startTime, endTime)) return setError('❌ This time range is already booked.');

    setError('');
    setIsProcessingPayment(true);

    try {
      // 1. Load Razorpay Script Dynamically
      const scriptLoaded = await new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Check your internet connection or disable ad-blockers.');
      }

      // 2. Create Order on Backend
      // NOTE: Change to http://localhost:5000 if testing locally
      const response = await fetch('http://localhost:5000/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: calculateCost() }),
      });
      
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to create order');

      // 3. Open Razorpay Checkout Popup
      const options = {
        key: 'rzp_test_TtCSBKsXjrWEX5', // 🔥 REPLACE WITH YOUR ACTUAL RAZORPAY KEY ID
        amount: data.order.amount,
        currency: "INR",
        name: "EcoChargeHub",
        description: `Charging at ${station?.name}`,
        order_id: data.order.id,
        handler: async function (response) {
          try {
            // 4. Verify Payment on Backend
            const verifyRes = await fetch('http://localhost:5000/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              // 5. Save Booking to Firestore
              await addDoc(collection(db, 'bookings'), {
                userId: user.uid,
                userEmail: user.email,
                userName: user.displayName || 'User',
                stationId: stationId,
                stationName: station?.name || 'Station',
                chargerId: selectedCharger,
                chargerType: selectedChargerData?.type || 'CCS',
                date: selectedDate,
                startTime: startTime,
                endTime: endTime,
                duration: Number(calculateHours().toFixed(2)),
                estimatedCost: calculateCost(),
                paymentId: response.razorpay_payment_id,
                status: 'confirmed',
                createdAt: serverTimestamp(),
              });
              setPaymentSuccess(true);
            } else {
              setError('Payment verification failed. Please contact support.');
            }
          } catch (err) {
            setError('Verification error: ' + err.message);
          }
        },
        prefill: {
          name: user.displayName || 'User',
          email: user.email,
        },
        theme: { color: "#238636" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (!user) return <div className="container" style={{ padding: '40px', textAlign: 'center' }}><h2>Please login first.</h2></div>;
  if (paymentSuccess) return <div className="container" style={{ padding: '40px', textAlign: 'center' }}><FaCheckCircle size={50} color="var(--primary)" /><h2>Payment Confirmed!</h2></div>;

  return (
    <div className="booking-page" style={{ padding: '40px 20px', background: 'var(--bg)', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--text)' }}>Book Charging Slot</h1>
        
        {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '15px', marginBottom: '20px', borderRadius: '8px', borderLeft: '4px solid #dc2626' }}>{error}</div>}

        <form onSubmit={handleBooking} style={{ background: 'var(--surface)', padding: '30px', borderRadius: '15px', border: '1px solid var(--border)' }}>
          
          {/* CHARGER */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '15px', color: 'var(--text)' }}>1. Select Charger</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {chargers.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => { setSelectedCharger(c.id); setSelectedChargerData(c); }}
                  style={{ padding: '15px', border: selectedCharger === c.id ? '2px solid var(--primary)' : '2px solid var(--border)', background: selectedCharger === c.id ? 'var(--primary-light)' : 'transparent', borderRadius: '10px', flex: '1', minWidth: '150px', cursor: 'pointer' }}
                >
                  <div style={{ fontWeight: 'bold', color: 'var(--text)' }}>{c.type}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.power} • {c.pricePerKwh || `₹${station?.pricePerKwh}`}/kWh</div>
                </button>
              ))}
            </div>
          </div>

          {/* DATE */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '15px', color: 'var(--text)' }}>2. Select Date</h3>
            <input 
              type="date" 
              value={selectedDate} 
              min={getTodayString()}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '16px' }}
            />
          </div>

          {/* TIME SLOT GRID */}
          {selectedCharger && selectedDate && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ marginBottom: '15px', color: 'var(--text)' }}>3. Check Availability & Select Start Time</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
                {timeSlots.map((slot, index) => {
                  const blocked = isBlockBooked(slot.start, slot.end);
                  const past = isSlotPast(slot.start);
                  const isSelected = startTime === slot.start;

                  let bg = 'var(--surface)';
                  let border = '1px solid var(--border)';
                  let color = 'var(--text)';

                  if (isSelected) {
                    bg = 'var(--primary)';
                    color = 'white';
                    border = '2px solid var(--primary)';
                  } else if (blocked) {
                    bg = 'var(--status-unavailable-bg)';
                    color = 'var(--status-unavailable)';
                  } else if (past) {
                    bg = 'var(--bg-hover)';
                    color = 'var(--text-muted)';
                  }

                  return (
                    <button
                      type="button"
                      key={index}
                      disabled={blocked || past}
                      onClick={() => {
                        setStartTime(slot.start);
                        const [h] = slot.start.split(':').map(Number);
                        setEndTime(`${(h + 1).toString().padStart(2, '0')}:00`);
                      }}
                      style={{ padding: '12px 10px', borderRadius: '8px', background: bg, color: color, border: border, opacity: (blocked || past) ? 0.6 : 1, cursor: (blocked || past) ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                    >
                      {slot.label}
                      {blocked && <span style={{ display: 'block', fontSize: '10px', marginTop: '4px' }}>Booked</span>}
                      {past && <span style={{ display: 'block', fontSize: '10px', marginTop: '4px' }}>Past</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* EXACT TIME PICKERS */}
          {startTime && (
            <div style={{ marginBottom: '30px', padding: '20px', background: 'var(--bg)', borderRadius: '10px', border: '1px dashed var(--primary)' }}>
              <h3 style={{ marginBottom: '15px', color: 'var(--text)' }}>4. Choose Exact Time</h3>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-muted)', fontSize: '14px' }}>Start Time</label>
                  <input 
                    type="time" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '16px' }}
                  />
                </div>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-muted)', fontSize: '14px' }}>End Time</label>
                  <input 
                    type="time" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '16px' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* SUMMARY */}
          {startTime && endTime && calculateHours() > 0 && (
            <div style={{ background: 'var(--primary-light)', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '10px', color: 'var(--text)' }}>Booking Summary</h4>
              <p style={{ color: 'var(--text)' }}>Time: <strong>{startTime} to {endTime}</strong></p>
              <p style={{ color: 'var(--text)' }}>Duration: <strong>{calculateHours().toFixed(2)} Hours</strong></p>
              <p style={{ color: 'var(--primary)', fontSize: '24px', fontWeight: 'bold', marginTop: '10px' }}>Total: ₹{calculateCost()}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isProcessingPayment || !startTime || !endTime || calculateHours() <= 0}
            style={{ width: '100%', padding: '16px', background: 'var(--primary)', color: 'white', fontWeight: 'bold', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '18px', opacity: (!startTime || !endTime || calculateHours() <= 0 || isProcessingPayment) ? 0.5 : 1 }}
          >
            {isProcessingPayment ? 'Processing...' : `Pay ₹${calculateCost()} & Confirm`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Booking;