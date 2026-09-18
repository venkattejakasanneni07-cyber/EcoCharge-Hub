import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaUser, FaEnvelope, FaLock, FaPhone, FaCar, FaChargingStation
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    vehicle: '',
    role: 'user'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Register with Firebase Auth
      const user = await register(formData.email, formData.password, formData.name);

      // ⚠️ IMPORTANT: Always save with the role user selected
      // Only 'user' or 'owner' allowed (never 'admin' via registration)
      const safeRole = formData.role === 'owner' ? 'owner' : 'user';

      await setDoc(doc(db, 'users', user.uid), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        vehicleModel: formData.vehicle || '',
        role: safeRole,
        createdAt: new Date().toISOString()
      });

      alert(
        `✅ Registration successful! Welcome ${
          safeRole === 'owner' ? 'Station Owner' : 'User'
        }!`
      );

      // Redirect based on role
      if (safeRole === 'owner') {
        navigate('/owner');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      setError(error.message || 'Failed to create account');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Create Account</h2>
        <p className="auth-subtitle">Join the EV revolution</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <FaUser className="input-icon" />
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <FaLock className="input-icon" />
            <input
              type="password"
              name="password"
              placeholder="Password (min 6 characters)"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <FaLock className="input-icon" />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <FaPhone className="input-icon" />
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <FaCar className="input-icon" />
            <input
              type="text"
              name="vehicle"
              placeholder="Vehicle Model"
              value={formData.vehicle}
              onChange={handleChange}
            />
          </div>

          {/* Role selection */}
          <div className="form-group role-selection">
            <label>Register as:</label>
            <div className="role-options">
              <label
                className={`role-option ${
                  formData.role === 'user' ? 'selected' : ''
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={formData.role === 'user'}
                  onChange={handleChange}
                />
                <FaUser /> User
                <span className="role-desc">Book charging stations</span>
              </label>
              <label
                className={`role-option ${
                  formData.role === 'owner' ? 'selected' : ''
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="owner"
                  checked={formData.role === 'owner'}
                  onChange={handleChange}
                />
                <FaChargingStation /> Station Owner
                <span className="role-desc">Manage charging stations</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>

      <style jsx>{`
        .auth-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 70vh;
          padding: 40px 0;
        }
        .auth-container {
          width: 100%;
          max-width: 460px;
        }
        .auth-container h2 {
          text-align: center;
          color: var(--text);
          margin-bottom: 8px;
        }
        .auth-subtitle {
          text-align: center;
          color: var(--text-muted);
          margin-bottom: 30px;
        }
        .form-group {
          position: relative;
          margin-bottom: 16px;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-subtle);
        }
        .form-group input[type='text'],
        .form-group input[type='email'],
        .form-group input[type='password'],
        .form-group input[type='tel'] {
          padding-left: 42px;
        }
        .role-selection {
          margin-top: 10px;
          margin-bottom: 20px;
        }
        .role-selection label {
          display: block;
          font-weight: 600;
          margin-bottom: 10px;
          color: var(--text);
          font-size: 13px;
        }
        .role-options {
          display: flex;
          gap: 12px;
        }
        .role-option {
          flex: 1;
          padding: 14px;
          border: 2px solid var(--border);
          border-radius: 10px;
          cursor: pointer;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s;
        }
        .role-option:hover {
          border-color: var(--primary);
        }
        .role-option.selected {
          border-color: var(--primary);
          background: var(--primary-light);
          color: var(--primary);
        }
        .role-option input[type='radio'] {
          display: none;
        }
        .role-option .role-desc {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 400;
        }
        .btn-full {
          width: 100%;
          padding: 14px;
          font-size: 15px;
          margin-top: 8px;
        }
        .auth-footer {
          text-align: center;
          margin-top: 20px;
          color: var(--text-muted);
        }
        .auth-footer a {
          color: var(--primary);
          font-weight: 600;
        }
        @media (max-width: 480px) {
          .role-options {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default Register;