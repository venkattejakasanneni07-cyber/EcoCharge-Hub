import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { 
  collection, getDocs, deleteDoc, doc, getDoc, updateDoc
} from 'firebase/firestore';
import { 
  FaUsers, FaChargingStation, FaBolt, FaCalendar, FaWallet, FaLeaf,
  FaTrash, FaChartLine, FaCheckCircle, FaTimesCircle
} from 'react-icons/fa';

import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Doughnut } from 'react-chartjs-2';
import { importAllStations, clearAllStations } from '../utils/importStations';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

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

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

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

  useEffect(() => {
    const fetchData = async () => {
      if (!isAdmin) return;
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = [];
        usersSnapshot.forEach((doc) => usersData.push({ id: doc.id, ...doc.data() }));
        setUsers(usersData);

        const stationsSnapshot = await getDocs(collection(db, 'stations'));
        const stationsData = [];
        stationsSnapshot.forEach((doc) => stationsData.push({ id: doc.id, ...doc.data() }));
        setStations(stationsData);

        const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
        const bookingsData = [];
        bookingsSnapshot.forEach((doc) => bookingsData.push({ id: doc.id, ...doc.data() }));
        setBookings(bookingsData);

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
      } catch (error) {
        console.error('Error fetching data:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [isAdmin]);

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

  const handleVerifyStation = async (id) => {
    try {
      await updateDoc(doc(db, 'stations', id), { verified: true });
      setStations(stations.map(s => s.id === id ? { ...s, verified: true } : s));
    } catch (error) {
      alert("Error verifying station: " + error.message);
    }
  };

  const handleImportStations = async () => {
    if (!window.confirm('Import all Indian stations from JSON? This may take a minute.')) return;
    setImporting(true);
    setImportResult(null);
    try {
      const result = await importAllStations(user.uid);
      setImportResult(result);
      alert(`✅ Import Complete!\n\nImported: ${result.imported}\nSkipped: ${result.skipped}\nFailed: ${result.failed}`);
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      alert(`❌ Import failed: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleClearStations = async () => {
    const deleted = await clearAllStations();
    if (deleted > 0) {
      alert(`✅ Deleted ${deleted} stations`);
      window.location.reload();
    }
  };

  const pieChartData = {
    labels: ['EV Users', 'Hosts', 'Admins'],
    datasets: [{
      data: [
        users.filter(u => u.role === 'user' || !u.role).length || 1, 
        users.filter(u => u.role === 'owner').length || 1, 
        users.filter(u => u.role === 'admin').length || 1
      ],
      backgroundColor: ['#238636', '#f59e0b', '#dc2626'],
      borderWidth: 0,
    }],
  };

  const topStationLabels = stations.length > 0 
    ? stations.slice(0, 5).map(s => s.name.substring(0, 15) + '...') 
    : ['Station A', 'Station B', 'Station C', 'Station D', 'Station E'];
    
  const topStationData = {
    labels: topStationLabels,
    datasets: [{
      label: 'Total Bookings',
      data: [50, 40, 30, 20, 10],
      backgroundColor: '#1565c0',
      borderRadius: 6,
    }],
  };

  const verifiedCount = stations.filter(s => s.verified).length;
  const pendingCount = stations.filter(s => !s.verified).length;
  
  const verifyChartData = {
    labels: ['Verified', 'Pending Approval'],
    datasets: [{
      data: [
        verifiedCount > 0 ? verifiedCount : 1, 
        pendingCount > 0 ? pendingCount : 1
      ],
      backgroundColor: ['#238636', '#f59e0b'],
      borderWidth: 0,
    }],
  };

  if (loading) return <div className="spinner">Loading...</div>;
  if (!isAdmin) return null;

  return (
    <div className="admin-dashboard">
      <div className="container" style={{ padding: '40px 0' }}>
        <h1 className="page-title">Admin Dashboard</h1>

        {/* 6 STATS CARDS - FORCED INTO ONE ROW */}
        <div className="stats-grid">
          <div className="stat-card">
            <FaUsers className="stat-icon" />
            <h3>{stats.users}</h3>
            <p>Users</p>
          </div>
          <div className="stat-card">
            <FaChargingStation className="stat-icon" />
            <h3>{stats.stations}</h3>
            <p>Stations</p>
          </div>
          <div className="stat-card">
            <FaBolt className="stat-icon" />
            <h3>{stats.chargers}</h3>
            <p>Chargers</p>
          </div>
          <div className="stat-card">
            <FaCalendar className="stat-icon" />
            <h3>{stats.bookings}</h3>
            <p>Bookings</p>
          </div>
          <div className="stat-card">
            <FaWallet className="stat-icon" />
            <h3>₹{stats.revenue}</h3>
            <p>Revenue</p>
          </div>
          <div className="stat-card">
            <FaLeaf className="stat-icon" />
            <h3>{stats.co2Saved.toFixed(1)} kg</h3>
            <p>CO₂ Saved</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <FaChartLine /> Analytics & Data
          </button>
          <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <FaUsers /> Users ({users.length})
          </button>
          <button className={`tab-btn ${activeTab === 'stations' ? 'active' : ''}`} onClick={() => setActiveTab('stations')}>
            <FaChargingStation /> Stations ({stations.length})
          </button>
          <button className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
            <FaCalendar /> Bookings ({bookings.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'dashboard' && (
            <div>
              <h2>📊 Platform Analytics</h2>
              
              <div className="charts-grid">
                <div className="chart-card">
                  <h3>User Roles</h3>
                  <div className="chart-wrapper"><Pie data={pieChartData} /></div>
                </div>
                <div className="chart-card">
                  <h3>Top Stations (By Bookings)</h3>
                  <div className="chart-wrapper"><Bar data={topStationData} /></div>
                </div>
                <div className="chart-card">
                  <h3>Station Verification</h3>
                  <div className="chart-wrapper"><Doughnut data={verifyChartData} /></div>
                </div>
              </div>

              <div className="import-section">
                <h3>📥 Data Management</h3>
                <p>Import real Indian charging stations from your JSON data file</p>
                <div className="import-buttons">
                  <button className="btn btn-primary" onClick={handleImportStations} disabled={importing}>
                    {importing ? '⏳ Importing...' : '📥 Import All India Stations'}
                  </button>
                  <button className="btn btn-danger" onClick={handleClearStations} disabled={importing}>
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
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h2>👥 User Management</h2>
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>{u.name || 'N/A'}</td>
                        <td>{u.email}</td>
                        <td><span className={`role-badge ${u.role || 'user'}`}>{u.role || 'user'}</span></td>
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u.id)}><FaTrash /> Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'stations' && (
            <div>
              <h2>🏢 Station Management</h2>
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr><th>Name</th><th>Type</th><th>City</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {stations.map(s => (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td>{s.type === 'home' ? 'Home (P2P)' : 'Commercial'}</td>
                        <td>{s.city}</td>
                        <td>
                          {s.verified ? (
                            <span className="status-badge confirmed"><FaCheckCircle /> Verified</span>
                          ) : (
                            <span className="status-badge pending"><FaTimesCircle /> Pending</span>
                          )}
                        </td>
                        <td className="action-buttons">
                          {!s.verified && (
                            <button className="btn btn-success btn-sm" onClick={() => handleVerifyStation(s.id)}>
                              Verify
                            </button>
                          )}
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteStation(s.id)}><FaTrash /> Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div>
              <h2>📅 Booking Management</h2>
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr><th>Station</th><th>Date</th><th>Time</th><th>Cost</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {bookings.map(b => (
                      <tr key={b.id}>
                        <td>{b.stationName || 'Station'}</td>
                        <td>{b.date}</td>
                        <td>{b.startTime} - {b.endTime}</td>
                        <td>₹{b.estimatedCost}</td>
                        <td><span className={`status-badge ${b.status || 'pending'}`}>{b.status || 'pending'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .admin-dashboard { padding: 20px 0; min-height: 100vh; background: var(--bg); }
        .page-title { text-align: center; font-size: 36px; color: var(--text); margin-bottom: 20px; font-weight: 800; }
        
        /* Forces 6 cards into one single row */
        .stats-grid { 
          display: grid; 
          grid-template-columns: repeat(6, 1fr); 
          gap: 10px; 
          margin-bottom: 30px; 
        }
        
        .stat-card { 
          background: var(--surface); 
          padding: 15px 5px; 
          border-radius: 12px; 
          text-align: center; 
          box-shadow: var(--shadow-sm); 
          border: 1px solid var(--border); 
        }
        .stat-icon { font-size: 22px; color: var(--primary); margin-bottom: 8px; }
        .stat-card h3 { font-size: 18px; color: var(--text); font-weight: 800; }
        .stat-card p { color: var(--text-muted); font-size: 10px; text-transform: uppercase; font-weight: 600; }

        .tab-navigation { display: flex; gap: 10px; margin-bottom: 30px; flex-wrap: wrap; }
        .tab-btn { padding: 12px 24px; border: 2px solid var(--border); border-radius: 10px; background: var(--surface); cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-family: inherit; font-size: 14px; }
        .tab-btn:hover { border-color: var(--primary); color: var(--primary); }
        .tab-btn.active { border-color: var(--primary); background: var(--primary-light); color: var(--primary); }

        .tab-content { background: var(--surface); padding: 25px; border-radius: 16px; box-shadow: var(--shadow-md); border: 1px solid var(--border); }
        .tab-content h2 { color: var(--text); margin-bottom: 20px; }

        .charts-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
        .chart-card { background: var(--bg); padding: 20px; border-radius: 12px; border: 1px solid var(--border); }
        .chart-card h3 { text-align: center; margin-bottom: 15px; color: var(--text); font-size: 16px; }
        .chart-wrapper { height: 250px; display: flex; justify-content: center; position: relative; }

        .import-section { background: var(--primary-light); border: 2px dashed var(--primary); border-radius: 16px; padding: 30px; text-align: center; }
        .import-section h3 { color: var(--text); margin-bottom: 8px; font-size: 20px; font-weight: 700; }
        .import-section p { color: var(--text-muted); margin-bottom: 20px; font-size: 14px; }
        .import-buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .import-buttons .btn { padding: 14px 28px; font-size: 15px; }
        .import-progress { margin-top: 20px; padding: 20px; background: var(--surface); border-radius: 12px; }
        .import-progress p { color: var(--primary); font-weight: 600; margin-bottom: 12px; }
        .progress-bar-animated { height: 8px; background: var(--border); border-radius: 4px; overflow: hidden; position: relative; }
        .progress-bar-animated::after { content: ''; position: absolute; top: 0; left: 0; height: 100%; width: 30%; background: var(--primary); border-radius: 4px; animation: progressSlide 1.5s ease-in-out infinite; }
        @keyframes progressSlide { 0% { left: -30%; } 100% { left: 100%; } }
        .import-result { margin-top: 20px; padding: 20px; background: var(--status-available-bg); border-radius: 12px; color: var(--status-available); text-align: left; }
        .import-result p { color: var(--status-available); margin-bottom: 8px; font-size: 14px; }

        .table-container { overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th { background: var(--bg); padding: 12px; text-align: left; font-weight: 700; border-bottom: 2px solid var(--border); color: var(--text-subtle); font-size: 12px; text-transform: uppercase; }
        .admin-table td { padding: 12px; border-bottom: 1px solid var(--border); color: var(--text-muted); font-size: 14px; }
        
        .role-badge { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .role-badge.user { background: var(--primary-light); color: var(--primary); }
        .role-badge.owner { background: #fef3c7; color: #d97706; }
        .role-badge.admin { background: #fee2e2; color: #dc2626; }

        .status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .status-badge.confirmed { background: var(--status-available-bg); color: var(--status-available); }
        .status-badge.pending { background: var(--status-limited-bg); color: var(--status-limited); }

        .btn-sm { padding: 6px 12px; font-size: 12px; display: flex; align-items: center; gap: 5px; }
        .action-buttons { display: flex; gap: 10px; }

        @media (max-width: 1200px) {
          .stats-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 992px) {
          .charts-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .tab-navigation { flex-direction: column; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;