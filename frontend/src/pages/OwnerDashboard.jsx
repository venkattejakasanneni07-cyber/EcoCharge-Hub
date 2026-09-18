import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { FaPlus, FaEdit, FaTrash, FaChargingStation, FaBolt, FaCalendar, FaWallet, FaPlug } from 'react-icons/fa';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [showChargerModal, setShowChargerModal] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    latitude: '',
    longitude: '',
    openingHours: ''
  });
  const [chargerData, setChargerData] = useState({
    chargerNumber: '',
    type: '',
    power: '',
    pricePerKwh: '',
    status: 'available'
  });

  // Check if user is owner
  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        window.location.href = '/login';
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role === 'owner') {
            setIsOwner(true);
          } else {
            alert('You are not authorized to access this page.');
            window.location.href = '/dashboard';
          }
        }
      } catch (error) {
        console.error('Error checking role:', error);
      }
      setLoading(false);
    };
    checkRole();
  }, [user]);

  // Fetch owner's stations
  useEffect(() => {
    const fetchStations = async () => {
      if (!user || !isOwner) return;
      try {
        const q = query(
          collection(db, 'stations'),
          where('ownerId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        setStations(data);
      } catch (error) {
        console.error('Error fetching stations:', error);
      }
      setLoading(false);
    };
    fetchStations();
  }, [user, isOwner]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleChargerChange = (e) => {
    setChargerData({ ...chargerData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStation) {
        await updateDoc(doc(db, 'stations', editingStation.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        alert('✅ Station updated successfully!');
      } else {
        await addDoc(collection(db, 'stations'), {
          ...formData,
          ownerId: user.uid,
          status: 'active',
          chargers: 0,
          createdAt: serverTimestamp()
        });
        alert('✅ Station added successfully!');
      }
      setShowModal(false);
      setEditingStation(null);
      setFormData({
        name: '',
        address: '',
        city: '',
        latitude: '',
        longitude: '',
        openingHours: ''
      });
      window.location.reload();
    } catch (error) {
      alert('❌ Error saving station: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
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

  const handleEdit = (station) => {
    setEditingStation(station);
    setFormData({
      name: station.name || '',
      address: station.address || '',
      city: station.city || '',
      latitude: station.latitude || '',
      longitude: station.longitude || '',
      openingHours: station.openingHours || ''
    });
    setShowModal(true);
  };

  const handleAddCharger = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'stations', selectedStation.id, 'chargers'), {
        ...chargerData,
        createdAt: serverTimestamp()
      });
      
      const stationRef = doc(db, 'stations', selectedStation.id);
      await updateDoc(stationRef, {
        chargers: (selectedStation.chargers || 0) + 1
      });
      
      alert('✅ Charger added successfully!');
      setShowChargerModal(false);
      setChargerData({
        chargerNumber: '',
        type: '',
        power: '',
        pricePerKwh: '',
        status: 'available'
      });
      window.location.reload();
    } catch (error) {
      alert('❌ Error adding charger: ' + error.message);
    }
  };

  if (loading) return <div className="spinner"></div>;
  if (!isOwner) return null;

  return (
    <div className="owner-dashboard">
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="dashboard-header">
          <h1 className="page-title">Owner Dashboard</h1>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FaPlus /> Add Station
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <FaChargingStation className="stat-icon" />
            <h3>{stations.length}</h3>
            <p>Total Stations</p>
          </div>
          <div className="stat-card">
            <FaBolt className="stat-icon" />
            <h3>{stations.reduce((acc, s) => acc + (s.chargers || 0), 0)}</h3>
            <p>Total Chargers</p>
          </div>
          <div className="stat-card">
            <FaCalendar className="stat-icon" />
            <h3>0</h3>
            <p>Today's Bookings</p>
          </div>
          <div className="stat-card">
            <FaWallet className="stat-icon" />
            <h3>₹0</h3>
            <p>Revenue</p>
          </div>
        </div>

        <div className="stations-list">
          <h2>Your Stations</h2>
          {stations.length === 0 ? (
            <div className="empty-state">
              <p>You haven't added any stations yet.</p>
              <p>Click "Add Station" to get started!</p>
            </div>
          ) : (
            <div className="stations-grid">
              {stations.map(station => (
                <div key={station.id} className="station-card">
                  <div className="station-header">
                    <h3>{station.name}</h3>
                    <span className="status-badge active">Active</span>
                  </div>
                  <p className="station-address">{station.address}, {station.city}</p>
                  <p className="station-chargers"><FaPlug /> {station.chargers || 0} Chargers</p>
                  <div className="station-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => {
                      setSelectedStation(station);
                      setShowChargerModal(true);
                    }}>
                      <FaPlus /> Add Charger
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(station)}>
                      <FaEdit /> Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(station.id)}>
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingStation ? 'Edit Station' : 'Add New Station'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Station Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Latitude</label>
                  <input
                    type="text"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="e.g., 16.5062"
                  />
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <input
                    type="text"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="e.g., 80.6480"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Opening Hours</label>
                <input
                  type="text"
                  name="openingHours"
                  placeholder="e.g., 6:00 AM - 10:00 PM"
                  value={formData.openingHours}
                  onChange={handleChange}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingStation ? 'Update' : 'Add'} Station
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showChargerModal && (
        <div className="modal-overlay" onClick={() => setShowChargerModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Charger to {selectedStation?.name}</h2>
            <form onSubmit={handleAddCharger}>
              <div className="form-group">
                <label>Charger Number</label>
                <input
                  type="text"
                  name="chargerNumber"
                  value={chargerData.chargerNumber}
                  onChange={handleChargerChange}
                  placeholder="e.g., 1, 2, 3"
                  required
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select name="type" value={chargerData.type} onChange={handleChargerChange} required>
                  <option value="">Select Type</option>
                  <option value="CCS">CCS</option>
                  <option value="CHAdeMO">CHAdeMO</option>
                  <option value="Type 2">Type 2</option>
                  <option value="Tesla Supercharger">Tesla Supercharger</option>
                </select>
              </div>
              <div className="form-group">
                <label>Power (kW)</label>
                <input
                  type="text"
                  name="power"
                  value={chargerData.power}
                  onChange={handleChargerChange}
                  placeholder="e.g., 50kW, 150kW"
                  required
                />
              </div>
              <div className="form-group">
                <label>Price per kWh</label>
                <input
                  type="text"
                  name="pricePerKwh"
                  value={chargerData.pricePerKwh}
                  onChange={handleChargerChange}
                  placeholder="e.g., ₹12/kWh"
                  required
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={chargerData.status} onChange={handleChargerChange}>
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowChargerModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <FaPlus /> Add Charger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .owner-dashboard { padding: 20px 0; }
        .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap; gap: 15px; }
        .page-title { font-size: 32px; color: #1a1a2e; margin: 0; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
        .stat-card { background: white; padding: 25px; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .stat-icon { font-size: 32px; color: #2e7d32; margin-bottom: 10px; }
        .stat-card h3 { font-size: 24px; color: #1a1a2e; }
        .stat-card p { color: #6c757d; }
        .stations-list h2 { margin-bottom: 20px; color: #1a1a2e; }
        .stations-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .station-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .station-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .station-header h3 { color: #1a1a2e; margin: 0; }
        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .status-badge.active { background: #d4edda; color: #155724; }
        .station-address { color: #6c757d; margin-bottom: 5px; }
        .station-chargers { color: #2e7d32; font-weight: 500; margin-bottom: 15px; }
        .station-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .btn-sm { padding: 6px 12px; font-size: 12px; display: flex; align-items: center; gap: 5px; }
        .empty-state { text-align: center; padding: 60px 20px; background: white; border-radius: 12px; color: #6c757d; }
        .empty-state p { margin: 5px 0; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; padding: 30px; border-radius: 16px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto; }
        .modal-content h2 { margin-bottom: 20px; color: #1a1a2e; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-weight: 600; margin-bottom: 5px; color: #1a1a2e; }
        .form-group input, .form-group select { width: 100%; padding: 10px; border: 1px solid #dee2e6; border-radius: 8px; font-size: 14px; }
        .form-group input:focus, .form-group select:focus { border-color: #2e7d32; outline: none; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .modal-actions { display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end; }
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .stations-grid { grid-template-columns: 1fr; }
          .dashboard-header { flex-direction: column; align-items: stretch; }
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default OwnerDashboard;