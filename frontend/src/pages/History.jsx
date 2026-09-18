import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const History = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      try {
        // Fetch charging sessions
        const q = query(
          collection(db, 'chargingSessions'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        setSessions(data);

        // Fetch bookings
        const bq = query(
          collection(db, 'bookings'),
          where('userId', '==', user.uid)
        );
        const bSnapshot = await getDocs(bq);
        const bData = [];
        bSnapshot.forEach((doc) => {
          bData.push({ id: doc.id, ...doc.data() });
        });
        setBookings(bData);
      } catch (error) {
        console.error('Error fetching history:', error);
      }
      setLoading(false);
    };
    fetchHistory();
  }, [user]);

  // Start Charging from History
  const startCharging = async (bookingId, stationId, chargerId) => {
    if (window.confirm('Start charging session now?')) {
      setStarting(bookingId);
      try {
        // Check if session already exists for this booking
        const existingSession = sessions.find(s => s.bookingId === bookingId);
        if (existingSession) {
          alert('⚠️ Charging session already started!');
          setStarting(null);
          return;
        }

        // Create charging session
        const sessionData = {
          userId: user.uid,
          stationId: stationId,
          stationName: 'Charging Station',
          chargerId: chargerId,
          chargerType: 'CCS',
          bookingId: bookingId,
          startTime: serverTimestamp(),
          duration: 0,
          energyConsumed: 0,
          amount: 0,
          co2Saved: 0,
          status: 'active'
        };

        const sessionRef = await addDoc(collection(db, 'chargingSessions'), sessionData);
        
        // Update booking status to 'active'
        await updateDoc(doc(db, 'bookings', bookingId), {
          status: 'active',
          sessionId: sessionRef.id
        });

        alert('✅ Charging session started!');
        window.location.reload();
      } catch (error) {
        alert('❌ Error starting charging: ' + error.message);
      }
      setStarting(null);
    }
  };

  // Check if booking time has arrived
  const canStartCharging = (booking) => {
    if (!booking.date || !booking.startTime) return false;
    try {
      const bookingDateTime = new Date(`${booking.date}T${booking.startTime}`);
      const now = new Date();
      return bookingDateTime <= now;
    } catch {
      return false;
    }
  };

  // Check if session exists for this booking
  const hasActiveSession = (bookingId) => {
    return sessions.some(s => s.bookingId === bookingId && s.status === 'active');
  };

  // Check if session is completed
  const hasCompletedSession = (bookingId) => {
    return sessions.some(s => s.bookingId === bookingId && s.status === 'completed');
  };

  if (loading) return <div className="spinner"></div>;

  const hasData = sessions.length > 0 || bookings.length > 0;

  return (
    <div className="history-page">
      <div className="container" style={{ padding: '40px 0' }}>
        <h1 className="page-title">Charging History</h1>
        
        {!hasData ? (
          <div className="empty-state">
            <p>No charging sessions yet. Book a charger to get started!</p>
          </div>
        ) : (
          <>
            {/* Bookings with Start Charging Button */}
            {bookings.length > 0 && (
              <div className="table-container" style={{ marginTop: '30px' }}>
                <h3>Your Bookings</h3>
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Station</th>
                      <th>Charger</th>
                      <th>Duration</th>
                      <th>Cost</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(booking => {
                      const isActive = hasActiveSession(booking.id);
                      const isCompleted = hasCompletedSession(booking.id);
                      const canStart = canStartCharging(booking);
                      
                      return (
                        <tr key={booking.id}>
                          <td>{booking.date || 'N/A'}</td>
                          <td>Station #{booking.stationId}</td>
                          <td>{booking.chargerId || 'CCS'}</td>
                          <td>{booking.duration || 0}h</td>
                          <td>₹{booking.estimatedCost || 0}</td>
                          <td>
                            <span className={`status-badge ${booking.status?.toLowerCase() || 'pending'}`}>
                              {booking.status || 'Pending'}
                            </span>
                          </td>
                          <td>
                            {booking.status === 'confirmed' && canStart && !isActive && !isCompleted && (
                              <button 
                                className="btn btn-success btn-sm"
                                onClick={() => startCharging(booking.id, booking.stationId, booking.chargerId)}
                                disabled={starting === booking.id}
                              >
                                {starting === booking.id ? 'Starting...' : '▶️ Start Charging'}
                              </button>
                            )}
                            {booking.status === 'confirmed' && !canStart && !isActive && !isCompleted && (
                              <span className="text-muted" style={{ fontSize: '12px' }}>
                                ⏳ Waiting for time
                              </span>
                            )}
                            {isActive && (
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                  const session = sessions.find(s => s.bookingId === booking.id);
                                  if (session) navigate(`/charging/${session.id}`);
                                }}
                              >
                                ⚡ View Session
                              </button>
                            )}
                            {isCompleted && (
                              <span className="text-muted" style={{ fontSize: '12px', color: '#28a745' }}>
                                ✅ Completed
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Completed Sessions */}
            {sessions.length > 0 && (
              <div className="table-container" style={{ marginTop: '30px' }}>
                <h3>Completed Sessions</h3>
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Station</th>
                      <th>Charger</th>
                      <th>Energy</th>
                      <th>Duration</th>
                      <th>Amount</th>
                      <th>CO₂ Saved</th>
                      <th>Start Time</th>
                      <th>End Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(session => (
                      <tr key={session.id}>
                        <td>{session.startTime?.toDate?.()?.toLocaleDateString() || 'N/A'}</td>
                        <td>{session.stationName || 'Station'}</td>
                        <td>{session.chargerType || 'CCS'}</td>
                        <td>{session.energyConsumed || 0} kWh</td>
                        <td>{session.duration || 0} sec</td>
                        <td>₹{session.amount || 0}</td>
                        <td>{session.co2Saved || 0} kg</td>
                        <td>{session.startTime?.toDate?.()?.toLocaleTimeString() || 'N/A'}</td>
                        <td>{session.endTime?.toDate?.()?.toLocaleTimeString() || 'N/A'}</td>
                        <td>
                          <span className={`status-badge ${session.status?.toLowerCase() || 'completed'}`}>
                            {session.status || 'Completed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .history-page { padding: 20px 0; }
        .page-title { text-align: center; font-size: 36px; color: #1a1a2e; margin-bottom: 30px; }
        .empty-state { text-align: center; padding: 60px 20px; background: white; border-radius: 12px; color: #6c757d; font-size: 18px; }
        .table-container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); padding: 20px; }
        .table-container h3 { color: #1a1a2e; margin-bottom: 15px; }
        .history-table { width: 100%; border-collapse: collapse; }
        .history-table th { 
          background: #f8f9fa; 
          padding: 12px; 
          text-align: left; 
          font-weight: 600; 
          color: #1a1a2e; 
          border-bottom: 2px solid #e9ecef; 
          font-size: 13px;
        }
        .history-table td { 
          padding: 12px; 
          border-bottom: 1px solid #e9ecef; 
          color: #333; 
          font-size: 13px;
        }
        .history-table tr:hover { background: #f8f9fa; }
        
        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .status-badge.completed { background: #d4edda; color: #155724; }
        .status-badge.cancelled { background: #f8d7da; color: #721c24; }
        .status-badge.pending { background: #fff3cd; color: #856404; }
        .status-badge.confirmed { background: #d4edda; color: #155724; }
        .status-badge.active { background: #cce5ff; color: #004085; }
        
        .btn-sm { padding: 6px 12px; font-size: 12px; border: none; border-radius: 4px; cursor: pointer; }
        .btn-success { background: #28a745; color: white; }
        .btn-success:hover { background: #218838; }
        .btn-success:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-primary { background: #2e7d32; color: white; }
        .btn-primary:hover { background: #1b5e20; }
        .text-muted { color: #6c757d; }
        
        @media (max-width: 768px) { 
          .history-table { font-size: 12px; } 
          .history-table th, .history-table td { padding: 6px 4px; } 
          .history-table th { font-size: 11px; }
        }
        @media (max-width: 480px) { 
          .history-table { font-size: 10px; } 
          .history-table th, .history-table td { padding: 4px 2px; } 
        }
      `}</style>
    </div>
  );
};

export default History;