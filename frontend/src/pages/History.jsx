import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection, query, where, getDocs, doc, updateDoc
} from 'firebase/firestore';
import {
  FaCalendarAlt, FaMapMarkerAlt, FaBolt, FaCheckCircle, FaTimes
} from 'react-icons/fa';

const History = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'bookings'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        // Sort by date (newest first)
        data.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.startTime || '00:00'}`);
          const dateB = new Date(`${b.date}T${b.startTime || '00:00'}`);
          return dateB - dateA;
        });
        setBookings(data);
      } catch (error) {
        console.error('Error fetching history:', error);
      }
      setLoading(false);
    };
    fetchHistory();
  }, [user]);

  // ============ CANCEL BOOKING ============
  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    setCancelling(bookingId);
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'cancelled',
      });
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: 'cancelled' } : b
        )
      );
      alert('✅ Booking cancelled successfully');
    } catch (error) {
      console.error('Cancel error:', error);
      alert('❌ Failed to cancel booking: ' + error.message);
    }
    setCancelling(null);
  };

  // ============ STATUS BADGE ============
  const getStatusClass = (status) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return 'confirmed';
      case 'cancelled':
        return 'cancelled';
      case 'pending':
        return 'pending';
      default:
        return 'pending';
    }
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="history-page">
      <div className="container" style={{ padding: '40px 20px' }}>
        <h1 className="page-title">My Bookings</h1>

        {bookings.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '60px', marginBottom: '16px', opacity: 0.5 }}>
              📅
            </div>
            <h3>No bookings yet</h3>
            <p>Book a charging slot to get started!</p>
            <a href="/stations" className="btn btn-primary">
              Browse Stations
            </a>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map((booking) => (
              <div key={booking.id} className="booking-card">
                <div className="booking-icon">
                  <FaBolt />
                </div>

                <div className="booking-details">
                  <div className="booking-header">
                    <div>
                      <h3>{booking.stationName || 'Charging Station'}</h3>
                      <p className="booking-id">Booking #{booking.id.substring(0, 8)}</p>
                    </div>
                    <span className={`status-badge ${getStatusClass(booking.status)}`}>
                      {booking.status || 'confirmed'}
                    </span>
                  </div>

                  <div className="booking-meta">
                    <span className="meta-item">
                      <FaCalendarAlt />
                      {booking.date}
                    </span>
                    <span className="meta-item">
                      🕐 {booking.startTime} - {booking.endTime || '--'}
                    </span>
                    <span className="meta-item">
                      ⚡ {booking.chargerType || 'CCS'}
                    </span>
                    <span className="meta-item">
                      💰 ₹{booking.estimatedCost || 0}
                    </span>
                  </div>

                  {booking.status !== 'cancelled' && (
                    <button
                      className="btn btn-danger btn-cancel"
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancelling === booking.id}
                    >
                      <FaTimes /> {cancelling === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .history-page {
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

        .empty-state {
          text-align: center;
          padding: 80px 20px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          color: var(--text-muted);
        }
        .empty-state h3 {
          color: var(--text);
          margin-bottom: 8px;
        }
        .empty-state p {
          margin-bottom: 20px;
        }

        .bookings-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 800px;
          margin: 0 auto;
        }

        .booking-card {
          display: flex;
          gap: 20px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
          box-shadow: var(--shadow-md);
          transition: all 0.3s;
        }
        .booking-card:hover {
          box-shadow: var(--shadow-lg);
          border-color: var(--border-strong);
        }

        .booking-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          color: white;
          flex-shrink: 0;
        }

        .booking-details {
          flex: 1;
          min-width: 0;
        }

        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .booking-header h3 {
          color: var(--text);
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 2px;
        }
        .booking-id {
          color: var(--text-subtle);
          font-size: 12px;
          font-family: monospace;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .status-badge.confirmed {
          background: var(--status-available-bg);
          color: var(--status-available);
        }
        .status-badge.pending {
          background: var(--status-limited-bg);
          color: var(--status-limited);
        }
        .status-badge.cancelled {
          background: var(--status-unavailable-bg);
          color: var(--status-unavailable);
        }

        .booking-meta {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 12px;
          padding: 12px 0;
          border-top: 1px solid var(--border);
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-muted);
        }
        .meta-item svg {
          color: var(--primary);
        }

        .btn-cancel {
          padding: 8px 16px;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        @media (max-width: 768px) {
          .booking-card {
            flex-direction: column;
            padding: 16px;
          }
          .booking-icon {
            width: 50px;
            height: 50px;
            font-size: 22px;
          }
          .booking-header {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default History;