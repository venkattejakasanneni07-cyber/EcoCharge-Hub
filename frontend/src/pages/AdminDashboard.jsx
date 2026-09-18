import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { 
  collection, getDocs, deleteDoc, doc, getDoc
} from 'firebase/firestore';
import { 
  FaUsers, FaChargingStation, FaBolt, FaCalendar, FaWallet, FaLeaf,
  FaTrash, FaChartLine
} from 'react-icons/fa';
import AnalyticsCharts from '../components/AnalyticsCharts';
import { importAllStations, clearAllStations } from '../utils/importStations';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    users: 0, stations: 0, chargers: 0, bookings: 0, revenue: 0, co2Saved: 0
  });
  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [chartData, setChartData] = useState({
    bookings: [],
    revenue: [],
    users: [],
    energy: [],
    labels: [],
    stationTypes: { labels: [], values: [] },
    statusData: { labels: [], values: [] }
  });

  // Import states
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        window.location.href = '/login';
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role === 'admin') {
            setIsAdmin(true);
          } else {
            alert('❌ You are not authorized to access this page.');
            window.location.href = '/dashboard';
            return;
          }
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
      }
      setLoading(false);
    };
    checkAdmin();
  }, [user]);

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      if (!isAdmin) return;
      try {
        // Fetch users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = [];
        usersSnapshot.forEach((doc) => {
          usersData.push({ id: doc.id, ...doc.data() });
        });
        setUsers(usersData);

        // Fetch stations
        const stationsSnapshot = await getDocs(collection(db, 'stations'));
        const stationsData = [];
        stationsSnapshot.forEach((doc) => {
          stationsData.push({ id: doc.id, ...doc.data() });
        });
        setStations(stationsData);

        // Fetch bookings
        const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
        const bookingsData = [];
        bookingsSnapshot.forEach((doc) => {
          bookingsData.push({ id: doc.id, ...doc.data() });
        });
        setBookings(bookingsData);

        // Calculate stats
        const totalChargers = stationsData.reduce((acc, s) => acc + (s.chargers || 0), 0);
        const totalRevenue = bookingsData.reduce((acc, b) => acc + (b.estimatedCost || 0), 0);
        const totalCo2 = bookingsData.length * 4.5;

        setStats({
          users: usersData.length,
          stations: stationsData.length,
          chargers: totalChargers,
          bookings: bookingsData.length,
          revenue: totalRevenue,
          co2Saved: totalCo2
        });

        // Prepare chart data
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const weeklyBookings = days.map(() => Math.floor(Math.random() * 20) + 5);
        const weeklyRevenue = weeklyBookings.map(b => b * 120);
        const userGrowth = [10, 25, 45, 70, 100, 130, 160];
        const weeklyEnergy = weeklyBookings.map(b => b * 15);

        setChartData({
          bookings: weeklyBookings,
          revenue: weeklyRevenue,
          users: userGrowth,
          energy: weeklyEnergy,
          labels: days,
          stationTypes: {
            labels: ['CCS', 'CHAdeMO', 'Type 2', 'Tesla'],
            values: [45, 25, 20, 10]
          },
          statusData: {
            labels: ['Available', 'Occupied', 'Maintenance'],
            values: [60, 25, 15]
          }
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [isAdmin]);

  // Delete user
  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', id));
        setUsers(users.filter(u => u.id !== id));
        alert('✅ User deleted successfully!');
      } catch (error) {
        alert('❌ Error deleting user: ' + error.message);
      }
    }
  };

  // Delete station
  const handleDeleteStation = async (id) => {
    if (window.confirm('Are you sure you want to delete this station?')) {
      try {
        await deleteDoc(doc(db, 'stations', id));
        setStations(stations.filter(s => s.id !== id));
        alert('✅ Station deleted successfully!');
      } catch (error) {
        alert('❌ Error deleting station: ' + error.message);
      }
    }
  };

  // Import stations
  const handleImportStations = async () => {
    if (!window.confirm('Import all Indian stations from JSON? This may take a minute.')) return;

    setImporting(true);
    setImportResult(null);

    try {
      const result = await importAllStations(user.uid);
      setImportResult(result);
      alert(`✅ Import Complete!\n\nImported: ${result.imported}\nSkipped: ${result.skipped}\nFailed: ${result.failed}`);

      // Refresh after 2 seconds
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      alert(`❌ Import failed: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  // Clear all stations
  const handleClearStations = async () => {
    const deleted = await clearAllStations();
    if (deleted > 0) {
      alert(`✅ Deleted ${deleted} stations`);
      window.location.reload();
    }
  };

  if (loading) return <div className="spinner">Loading...</div>;
  if (!isAdmin) return null;

  return (
    <div className="admin-dashboard">
      <div className="container" style={{ padding: '40px 0' }}>
        <h1 className="page-title">Admin Dashboard</h1>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <FaUsers className="stat-icon" />
            <h3>{stats.users}</h3>
            <p>Total Users</p>
          </div>
          <div className="stat-card">
            <FaChargingStation className="stat-icon" />
            <h3>{stats.stations}</h3>
            <p>Total Stations</p>
          </div>
          <div className="stat-card">
            <FaBolt className="stat-icon" />
            <h3>{stats.chargers}</h3>
            <p>Total Chargers</p>
          </div>
          <div className="stat-card">
            <FaCalendar className="stat-icon" />
            <h3>{stats.bookings}</h3>
            <p>Total Bookings</p>
          </div>
          <div className="stat-card">
            <FaWallet className="stat-icon" />
            <h3>₹{stats.revenue}</h3>
            <p>Total Revenue</p>
          </div>
          <div className="stat-card">
            <FaLeaf className="stat-icon" />
            <h3>{stats.co2Saved.toFixed(1)} kg</h3>
            <p>CO₂ Saved</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <FaChartLine /> Dashboard
          </button>
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FaUsers /> Users ({users.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'stations' ? 'active' : ''}`}
            onClick={() => setActiveTab('stations')}
          >
            <FaChargingStation /> Stations ({stations.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <FaCalendar /> Bookings ({bookings.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'dashboard' && (
            <div>
              <h2>📊 Analytics Dashboard</h2>
              <p>View all analytics and insights here.</p>

              {/* Import Section */}
              <div className="import-section">
                <h3>📥 Data Management</h3>
                <p>Import real Indian charging stations from your JSON data file</p>

                <div className="import-buttons">
                  <button 
                    className="btn btn-primary"
                    onClick={handleImportStations}
                    disabled={importing}
                  >
                    {importing ? '⏳ Importing...' : '📥 Import All India Stations'}
                  </button>

                  <button 
                    className="btn btn-danger"
                    onClick={handleClearStations}
                    disabled={importing}
                  >
                    🗑️ Clear All Stations
                  </button>
                </div>

                {importing && (
                  <div className="import-progress">
                    <p>⏳ Importing stations... Check browser console (F12) for progress</p>
                    <div className="progress-bar-animated"></div>
                  </div>
                )}

                {importResult && (
                  <div className="import-result">
                    <p>✅ <strong>Import Complete!</strong></p>
                    <p>Imported: <strong>{importResult.imported}</strong></p>
                    <p>Skipped: <strong>{importResult.skipped}</strong></p>
                    <p>Failed: <strong>{importResult.failed}</strong></p>
                  </div>
                )}
              </div>

              <AnalyticsCharts data={chartData} />
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h2>👥 User Management</h2>
              {users.length === 0 ? (
                <p>No users found.</p>
              ) : (
                <div className="table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Vehicle</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td>{u.name}</td>
                          <td>{u.email}</td>
                          <td>
                            <span className={`role-badge ${u.role || 'user'}`}>
                              {u.role || 'user'}
                            </span>
                          </td>
                          <td>{u.vehicleModel || 'N/A'}</td>
                          <td>
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteUser(u.id)}
                            >
                              <FaTrash /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stations' && (
            <div>
              <h2>🏢 Station Management</h2>
              {stations.length === 0 ? (
                <p>No stations found.</p>
              ) : (
                <div className="table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Address</th>
                        <th>City</th>
                        <th>Chargers</th>
                        <th>Source</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stations.map(s => (
                        <tr key={s.id}>
                          <td>{s.name}</td>
                          <td>{s.address}</td>
                          <td>{s.city}</td>
                          <td>{s.chargers || 0}</td>
                          <td>
                            <span className="source-badge">
                              {s.source || 'Manual'}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteStation(s.id)}
                            >
                              <FaTrash /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bookings' && (
            <div>
              <h2>📅 Booking Management</h2>
              {bookings.length === 0 ? (
                <p>No bookings found.</p>
              ) : (
                <div className="table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Station</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Duration</th>
                        <th>Cost</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map(b => (
                        <tr key={b.id}>
                          <td>Station #{b.stationId}</td>
                          <td>{b.date}</td>
                          <td>{b.startTime}</td>
                          <td>{b.duration}h</td>
                          <td>₹{b.estimatedCost}</td>
                          <td>
                            <span className={`status-badge ${b.status || 'pending'}`}>
                              {b.status || 'pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .admin-dashboard { padding: 20px 0; }
        .page-title { text-align: center; font-size: 36px; color: var(--text); margin-bottom: 30px; }
        
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
        .stat-card { background: var(--surface); padding: 25px; border-radius: 16px; text-align: center; box-shadow: var(--shadow-md); border: 1px solid var(--border); transition: all 0.3s; }
        .stat-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--border-strong); }
        .stat-icon { font-size: 32px; color: var(--primary); margin-bottom: 10px; }
        .stat-card h3 { font-size: 24px; color: var(--text); font-weight: 800; letter-spacing: -0.03em; }
        .stat-card p { color: var(--text-muted); font-size: 13px; text-transform: uppercase; letter-spacing: 0.03em; font-weight: 600; }

        .tab-navigation { display: flex; gap: 10px; margin-bottom: 30px; flex-wrap: wrap; }
        .tab-btn { padding: 12px 24px; border: 2px solid var(--border); border-radius: 10px; background: var(--surface); cursor: pointer; font-weight: 600; transition: all 0.3s; display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-family: inherit; font-size: 14px; }
        .tab-btn:hover { border-color: var(--primary); color: var(--primary); }
        .tab-btn.active { border-color: var(--primary); background: var(--primary-light); color: var(--primary); }

        .tab-content { background: var(--surface); padding: 25px; border-radius: 16px; box-shadow: var(--shadow-md); border: 1px solid var(--border); }
        .tab-content h2 { color: var(--text); margin-bottom: 20px; }

        /* Import Section */
        .import-section {
          background: var(--primary-light);
          border: 2px dashed var(--primary);
          border-radius: 16px;
          padding: 30px;
          margin: 30px 0;
          text-align: center;
        }
        .import-section h3 {
          color: var(--text);
          margin-bottom: 8px;
          font-size: 20px;
          font-weight: 700;
        }
        .import-section p {
          color: var(--text-muted);
          margin-bottom: 20px;
          font-size: 14px;
        }
        .import-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .import-buttons .btn {
          padding: 14px 28px;
          font-size: 15px;
        }
        .import-progress {
          margin-top: 20px;
          padding: 20px;
          background: var(--surface);
          border-radius: 12px;
        }
        .import-progress p {
          color: var(--primary);
          font-weight: 600;
          margin-bottom: 12px;
        }
        .progress-bar-animated {
          height: 8px;
          background: var(--border);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }
        .progress-bar-animated::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 30%;
          background: var(--primary);
          border-radius: 4px;
          animation: progressSlide 1.5s ease-in-out infinite;
        }
        @keyframes progressSlide {
          0% { left: -30%; }
          100% { left: 100%; }
        }
        .import-result {
          margin-top: 20px;
          padding: 20px;
          background: var(--status-available-bg);
          border-radius: 12px;
          color: var(--status-available);
          text-align: left;
        }
        .import-result p {
          color: var(--status-available);
          margin-bottom: 8px;
          font-size: 14px;
        }
        .import-result strong {
          font-size: 18px;
        }

        /* Table */
        .table-container { overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th { background: var(--bg); padding: 12px; text-align: left; font-weight: 700; border-bottom: 2px solid var(--border); color: var(--text-subtle); font-size: 12px; letter-spacing: 0.03em; text-transform: uppercase; }
        .admin-table td { padding: 12px; border-bottom: 1px solid var(--border); color: var(--text-muted); font-size: 14px; }
        .admin-table tr:hover { background: var(--surface-hover); }

        .role-badge { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
        .role-badge.user { background: var(--primary-light); color: var(--primary); }
        .role-badge.owner { background: var(--status-available-bg); color: var(--status-available); }
        .role-badge.admin { background: var(--status-limited-bg); color: var(--status-limited); }

        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
        .status-badge.active, .status-badge.completed, .status-badge.confirmed { background: var(--status-available-bg); color: var(--status-available); }
        .status-badge.pending { background: var(--status-limited-bg); color: var(--status-limited); }
        .status-badge.cancelled, .status-badge.unavailable { background: var(--status-unavailable-bg); color: var(--status-unavailable); }

        .source-badge {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          background: var(--bg);
          color: var(--text-muted);
          border: 1px solid var(--border);
        }

        .btn-sm { padding: 6px 12px; font-size: 12px; display: flex; align-items: center; gap: 5px; }

        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .tab-navigation { flex-direction: column; }
          .admin-table { font-size: 14px; }
          .import-buttons { flex-direction: column; }
          .import-buttons .btn { width: 100%; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr; }
          .page-title { font-size: 28px; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;