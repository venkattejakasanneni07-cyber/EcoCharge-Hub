import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaCar } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const Profile = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    vehicleModel: ''
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicleModel: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            name: data.name || user.displayName || 'User',
            email: data.email || user.email,
            phone: data.phone || '',
            vehicleModel: data.vehicleModel || ''
          });
          setFormData({
            name: data.name || user.displayName || 'User',
            phone: data.phone || '',
            vehicleModel: data.vehicleModel || ''
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
      setLoading(false);
    };
    fetchUserData();
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: formData.name,
        phone: formData.phone,
        vehicleModel: formData.vehicleModel
      });
      setUserData({
        ...userData,
        name: formData.name,
        phone: formData.phone,
        vehicleModel: formData.vehicleModel
      });
      setEditing(false);
      alert('✅ Profile updated successfully!');
    } catch (error) {
      alert('❌ Error updating profile: ' + error.message);
    }
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="profile-page">
      <div className="container" style={{ padding: '40px 0' }}>
        <h1 className="page-title">My Profile</h1>
        
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              <FaUser className="avatar-icon" />
            </div>
            <div className="profile-name">
              <h2>{userData.name}</h2>
              <p>EV Owner</p>
            </div>
          </div>

          {editing ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Vehicle Model</label>
                <input type="text" name="vehicleModel" value={formData.vehicleModel} onChange={handleChange} />
              </div>
              <div className="profile-actions">
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <>
              <div className="profile-info">
                <div className="info-item">
                  <FaUser className="info-icon" />
                  <div><span className="info-label">Full Name</span><span className="info-value">{userData.name}</span></div>
                </div>
                <div className="info-item">
                  <FaEnvelope className="info-icon" />
                  <div><span className="info-label">Email</span><span className="info-value">{userData.email}</span></div>
                </div>
                <div className="info-item">
                  <FaPhone className="info-icon" />
                  <div><span className="info-label">Phone</span><span className="info-value">{userData.phone || 'Not provided'}</span></div>
                </div>
                <div className="info-item">
                  <FaCar className="info-icon" />
                  <div><span className="info-label">Vehicle Model</span><span className="info-value">{userData.vehicleModel || 'Not provided'}</span></div>
                </div>
              </div>
              <button className="btn btn-primary btn-full" onClick={() => setEditing(true)}>Edit Profile</button>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .profile-page { padding: 20px 0; }
        .page-title { text-align: center; font-size: 36px; color: #1a1a2e; margin-bottom: 30px; }
        .profile-card { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
        .profile-header { display: flex; align-items: center; gap: 20px; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #e9ecef; }
        .profile-avatar { width: 80px; height: 80px; border-radius: 50%; background: #e8f5e9; display: flex; align-items: center; justify-content: center; }
        .avatar-icon { font-size: 40px; color: #2e7d32; }
        .profile-name h2 { color: #1a1a2e; margin: 0; }
        .profile-name p { color: #6c757d; margin: 0; }
        .profile-info { display: flex; flex-direction: column; gap: 15px; margin-bottom: 25px; }
        .info-item { display: flex; align-items: center; gap: 15px; padding: 12px; background: #f8f9fa; border-radius: 8px; }
        .info-icon { font-size: 20px; color: #2e7d32; }
        .info-item div { display: flex; flex-direction: column; }
        .info-label { font-size: 12px; color: #6c757d; }
        .info-value { font-size: 16px; font-weight: 500; color: #1a1a2e; }
        .btn-full { width: 100%; padding: 12px; }
        .profile-actions { display: flex; gap: 10px; }
        .profile-actions .btn { flex: 1; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-weight: 600; margin-bottom: 5px; color: #1a1a2e; }
        .form-group input { width: 100%; padding: 10px; border: 1px solid #dee2e6; border-radius: 8px; font-size: 14px; }
        .form-group input:focus { border-color: #2e7d32; outline: none; }
        @media (max-width: 480px) {
          .profile-card { padding: 20px; }
          .profile-header { flex-direction: column; text-align: center; }
        }
      `}</style>
    </div>
  );
};

export default Profile;