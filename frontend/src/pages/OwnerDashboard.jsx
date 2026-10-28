import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { 
  collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc
} from 'firebase/firestore';
import { FaPlus, FaEdit, FaTrash, FaChargingStation, FaBolt, FaCalendar, FaWallet, FaPlug, FaHome, FaBuilding, FaCrown, FaCheckCircle } from 'react-icons/fa';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [userData, setUserData] = useState(null);
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [showChargerModal, setShowChargerModal] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  
  // Subscription Modal State
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [formData, setFormData] = useState({
    name: '', address: '', city: '', latitude: '', longitude: '', openingHours: '24/7', type: 'home', pricePerKwh: 12
  });
  
  const [chargerData, setChargerData] = useState({
    chargerNumber: '', type: '', power: '', pricePerKwh: '', status: 'available'
  });

  // 1. Check Role & Fetch User Data
  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        window.location.href = '/login';
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          if (data.role === 'owner') {
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

  // 2. Fetch Stations
  useEffect(() => {
    const fetchStations = async () => {
      if (!user || !isOwner) return;
      try {
        const q = query(collection(db, 'stations'), where('ownerId', '==', user.uid));
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

  // 3. Check Subscription
  const isSubscriptionActive = () => {
    if (!userData || !userData.subscriptionExpiry) return false;
    return new Date(userData.subscriptionExpiry) > new Date();
  };

  const handleOpenAddModal = () => {
    if (!isSubscriptionActive()) {
      setShowSubscriptionModal(true);
    } else {
      setShowModal(true);
    }
  };

  // 4. Handle Subscription Payment
  const handleSubscribe = async (amount, months) => {
    setIsProcessingPayment(true);
    try {
      const scriptLoaded = await new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!scriptLoaded) throw new Error('Razorpay SDK failed to load.');

      const response = await fetch('https://ecocharge-hub.onrender.com/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      const options = {
        key: 'rzp_test_TtCSBKsXjrWEX5', // 🔥 REPLACE WITH YOUR KEY
        amount: data.order.amount,
        currency: "INR",
        name: "EcoChargeHub",
        description: `${months} Months Host Subscription`,
        order_id: data.order.id,
        handler: async function (response) {
          const verifyRes = await fetch('https://ecocharge-hub.onrender.com/api/verify-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: user.uid,
              months: months
            }),
          });
          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            alert(`✅ Subscription Activated! You can now list chargers.`);
            setUserData(prev => ({ ...prev, subscriptionExpiry: verifyData.expiry }));
            setShowSubscriptionModal(false);
            setShowModal(true);
          } else {
            alert('Payment verification failed.');
          }
        },
        prefill: { name: user.displayName, email: user.email },
        theme: { color: "#238636" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleChargerChange = (e) => setChargerData({ ...chargerData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStation) {
        await updateDoc(doc(db, 'stations', editingStation.id), { ...formData, updatedAt: serverTimestamp() });
        alert('✅ Station updated!');
      } else {
        await addDoc(collection(db, 'stations'), {
          ...formData, ownerId: user.uid, status: 'active', chargers: 0, verified: false, createdAt: serverTimestamp()
        });
        alert('✅ Station added!');
      }
      setShowModal(false);
      setEditingStation(null);
      setFormData({ name: '', address: '', city: '', latitude: '', longitude: '', openingHours: '24/7', type: 'home', pricePerKwh: 12 });
      window.location.reload();
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      await deleteDoc(doc(db, 'stations', id));
      setStations(stations.filter(s => s.id !== id));
    }
  };

  const handleEdit = (station) => {
    setEditingStation(station);
    setFormData({
      name: station.name || '', address: station.address || '', city: station.city || '',
      latitude: station.latitude || '', longitude: station.longitude || '',
      openingHours: station.openingHours || '24/7', type: station.type || 'home', pricePerKwh: station.pricePerKwh || 12
    });
    setShowModal(true);
  };

  const handleAddCharger = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'stations', selectedStation.id, 'chargers'), { ...chargerData, createdAt: serverTimestamp() });
      await updateDoc(doc(db, 'stations', selectedStation.id), { chargers: (selectedStation.chargers || 0) + 1 });
      alert('✅ Charger added!');
      setShowChargerModal(false);
      window.location.reload();
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };

  if (loading) return <div className="spinner"></div>;
  if (!isOwner) return null;

  return (
    <div className="owner-dashboard">
      <div className="container" style={{ padding: '40px 0' }}>
        
        {/* HEADER */}
        <div className="dashboard-header">
          <div>
            <h1 className="page-title">Host Dashboard</h1>
            {isSubscriptionActive() ? (
              <p style={{ color: 'var(--primary)', marginTop: '5px' }}>
                <FaCrown /> Pro Plan Active (Expires: {new Date(userData.subscriptionExpiry).toLocaleDateString()})
              </p>
            ) : (
              <p style={{ color: 'var(--status-unavailable)', marginTop: '5px' }}>
                ⚠️ Subscription Required to list chargers
              </p>
            )}
          </div>
          
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <FaPlus /> List New Charger
          </button>
        </div>

        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-card"><FaChargingStation className="stat-icon" /><h3>{stations.length}</h3><p>Total Stations</p></div>
          <div className="stat-card"><FaBolt className="stat-icon" /><h3>{stations.reduce((acc, s) => acc + (s.chargers || 0), 0)}</h3><p>Total Chargers</p></div>
          <div className="stat-card"><FaCalendar className="stat-icon" /><h3>0</h3><p>Today's Bookings</p></div>
          <div className="stat-card"><FaWallet className="stat-icon" /><h3>₹0</h3><p>Revenue</p></div>
        </div>

        {/* STATIONS LIST */}
        <div className="stations-list">
          <h2>Your Listed Chargers</h2>
          {stations.length === 0 ? (
            <div className="empty-state">
              <p>You haven't listed any chargers yet.</p>
              <p>Click "List New Charger" to start earning!</p>
            </div>
          ) : (
            <div className="stations-grid">
              {stations.map(station => (
                <div key={station.id} className="station-card">
                  <div className="station-header">
                    <div>
                      <h3>{station.name}</h3>
                      <span className="station-type-badge">
                        {station.type === 'home' ? <><FaHome /> Home</> : <><FaBuilding /> Commercial</>}
                      </span>
                    </div>
                    <span className="status-badge active">{station.verified ? 'Verified' : 'Active'}</span>
                  </div>
                  <p className="station-address">{station.address}, {station.city}</p>
                  <p className="station-price">₹{station.pricePerKwh || 12}/kWh</p>
                  <p className="station-chargers"><FaPlug /> {station.chargers || 0} Chargers</p>
                  <div className="station-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => { setSelectedStation(station); setShowChargerModal(true); }}><FaPlus /> Add Charger</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(station)}><FaEdit /> Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(station.id)}><FaTrash /> Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🔥 SUBSCRIPTION MODAL */}
      {showSubscriptionModal && (
        <div className="modal-overlay" onClick={() => setShowSubscriptionModal(false)}>
          <div className="modal-content subscription-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <FaCrown style={{ fontSize: '50px', color: '#f59e0b' }} />
              <h2>Host Subscription Required</h2>
              <p style={{ color: 'var(--text-muted)' }}>To list your chargers and earn money, please choose a plan.</p>
            </div>

            <div className="plans-grid">
              <div className="plan-card" onClick={() => handleSubscribe(499, 1)}>
                <h3>Monthly</h3>
                <div className="price">₹499<span>/mo</span></div>
                <ul>
                  <li><FaCheckCircle /> List unlimited chargers</li>
                  <li><FaCheckCircle /> Accept bookings</li>
                  <li><FaCheckCircle /> Get paid directly</li>
                </ul>
                <button className="btn btn-primary btn-full" disabled={isProcessingPayment}>
                  {isProcessingPayment ? 'Processing...' : 'Choose Monthly'}
                </button>
              </div>

              <div className="plan-card popular" onClick={() => handleSubscribe(2599, 6)}>
                <div className="popular-badge">Best Value</div>
                <h3>6 Months</h3>
                <div className="price">₹2599<span>/6mo</span></div>
                <ul>
                  <li><FaCheckCircle /> Everything in Monthly</li>
                  <li><FaCheckCircle /> Save ₹395</li>
                  <li><FaCheckCircle /> Priority support</li>
                </ul>
                <button className="btn btn-primary btn-full" disabled={isProcessingPayment}>
                  {isProcessingPayment ? 'Processing...' : 'Choose 6 Months'}
                </button>
              </div>
            </div>

            <button className="btn btn-secondary btn-full" style={{ marginTop: '15px' }} onClick={() => setShowSubscriptionModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ADD/EDIT STATION MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingStation ? 'Edit Charger' : 'List New Charger'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label>Charger Title</label><input type="text" name="name" value={formData.name} onChange={handleChange} required /></div>
              <div className="form-group"><label>Address</label><input type="text" name="address" value={formData.address} onChange={handleChange} required /></div>
              <div className="form-group"><label>City</label><input type="text" name="city" value={formData.city} onChange={handleChange} required /></div>
              <div className="form-row">
                <div className="form-group"><label>Latitude</label><input type="text" name="latitude" value={formData.latitude} onChange={handleChange} /></div>
                <div className="form-group"><label>Longitude</label><input type="text" name="longitude" value={formData.longitude} onChange={handleChange} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Type</label>
                  <select name="type" value={formData.type} onChange={handleChange}>
                    <option value="home">Home Charger (P2P)</option>
                    <option value="commercial">Commercial Station</option>
                  </select>
                </div>
                <div className="form-group"><label>Price per kWh (₹)</label><input type="number" name="pricePerKwh" value={formData.pricePerKwh} onChange={handleChange} required /></div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingStation ? 'Update' : 'List'} Charger</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CHARGER MODAL */}
      {showChargerModal && (
        <div className="modal-overlay" onClick={() => setShowChargerModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Charger to {selectedStation?.name}</h2>
            <form onSubmit={handleAddCharger}>
              <div className="form-group"><label>Charger Number</label><input type="text" name="chargerNumber" value={chargerData.chargerNumber} onChange={handleChargerChange} required /></div>
              <div className="form-group"><label>Type</label>
                <select name="type" value={chargerData.type} onChange={handleChargerChange} required>
                  <option value="">Select Type</option><option value="CCS">CCS</option><option value="CHAdeMO">CHAdeMO</option><option value="Type 2">Type 2</option><option value="AC Wall Socket">AC Wall Socket</option>
                </select>
              </div>
              <div className="form-group"><label>Power (kW)</label><input type="text" name="power" value={chargerData.power} onChange={handleChargerChange} required /></div>
              <div className="form-group"><label>Price per kWh (₹)</label><input type="text" name="pricePerKwh" value={chargerData.pricePerKwh} onChange={handleChargerChange} required /></div>
              <div className="form-group"><label>Status</label>
                <select name="status" value={chargerData.status} onChange={handleChargerChange}>
                  <option value="available">Available</option><option value="occupied">Occupied</option><option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowChargerModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><FaPlus /> Add Charger</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .owner-dashboard { padding: 20px 0; min-height: 100vh; background: var(--bg); }
        .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap; gap: 15px; }
        .page-title { font-size: 32px; color: var(--text); margin: 0; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
        .stat-card { background: var(--surface); padding: 25px; border-radius: 12px; text-align: center; box-shadow: var(--shadow-md); border: 1px solid var(--border); }
        .stat-icon { font-size: 32px; color: var(--primary); margin-bottom: 10px; }
        .stat-card h3 { font-size: 24px; color: var(--text); }
        .stat-card p { color: var(--text-muted); }
        .stations-list h2 { margin-bottom: 20px; color: var(--text); }
        .stations-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .station-card { background: var(--surface); padding: 20px; border-radius: 12px; box-shadow: var(--shadow-md); border: 1px solid var(--border); }
        .station-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
        .station-header h3 { color: var(--text); margin: 0; }
        .station-type-badge { font-size: 12px; color: var(--primary); display: flex; align-items: center; gap: 5px; margin-top: 5px; }
        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: var(--status-available-bg); color: var(--status-available); }
        .station-address { color: var(--text-muted); margin-bottom: 5px; }
        .station-price { color: var(--primary); font-size: 20px; font-weight: 700; margin-bottom: 5px; }
        .station-chargers { color: var(--text-muted); font-weight: 500; margin-bottom: 15px; }
        .station-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .btn-sm { padding: 6px 12px; font-size: 12px; display: flex; align-items: center; gap: 5px; }
        .empty-state { text-align: center; padding: 60px 20px; background: var(--surface); border-radius: 12px; color: var(--text-muted); }
        .empty-state p { margin: 5px 0; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-content { background: var(--surface); padding: 30px; border-radius: 16px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; border: 1px solid var(--border); }
        .modal-content h2 { margin-bottom: 20px; color: var(--text); text-align: center; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-weight: 600; margin-bottom: 5px; color: var(--text); }
        .form-group input, .form-group select { width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; background: var(--bg); color: var(--text); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .modal-actions { display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end; }
        
        .subscription-modal { max-width: 700px; }
        .plans-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
        .plan-card { background: var(--bg); border: 2px solid var(--border); border-radius: 12px; padding: 25px; text-align: center; cursor: pointer; transition: all 0.2s; position: relative; }
        .plan-card:hover { border-color: var(--primary); transform: translateY(-2px); }
        .plan-card.popular { border-color: var(--primary); background: var(--primary-light); }
        .popular-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--primary); color: white; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; }
        .plan-card h3 { color: var(--text); margin-bottom: 10px; }
        .plan-card .price { font-size: 32px; font-weight: 800; color: var(--text); margin-bottom: 20px; }
        .plan-card .price span { font-size: 14px; color: var(--text-muted); font-weight: 500; }
        .plan-card ul { list-style: none; padding: 0; margin-bottom: 20px; text-align: left; }
        .plan-card ul li { color: var(--text-muted); font-size: 14px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
        .plan-card ul li svg { color: var(--primary); }
        .btn-full { width: 100%; }

        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .stations-grid { grid-template-columns: 1fr; }
          .dashboard-header { flex-direction: column; align-items: stretch; }
          .form-row { grid-template-columns: 1fr; }
          .plans-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default OwnerDashboard;