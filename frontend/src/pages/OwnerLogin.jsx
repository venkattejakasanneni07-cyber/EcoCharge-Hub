import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaEnvelope, FaLock, FaChargingStation, FaArrowRight,
  FaCheckCircle, FaRedo
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signInWithCustomToken } from 'firebase/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const OwnerLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Mode: 'password' | 'otp'
  const [mode, setMode] = useState('password');

  // Password mode
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // OTP mode
  const [otpStep, setOtpStep] = useState('email'); // 'email' | 'otp'
  const [otpEmail, setOtpEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const inputRefs = useRef([]);

  // Countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  // ==================== PASSWORD LOGIN ====================
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'owner' || userData.role === 'admin') {
          navigate('/owner');
        } else {
          setError('❌ This account is not a Station Owner. Please login as User.');
        }
      } else {
        setError('User profile not found.');
      }
    } catch (err) {
      setError(err.message || 'Failed to login');
    }
    setLoading(false);
  };

  // ==================== OTP: SEND ====================
  const handleSendOTP = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      setOtpStep('otp');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      setSuccess('OTP sent! Check your email.');
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // ==================== OTP INPUT ====================
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (newOtp.every((d) => d !== '')) {
      setTimeout(() => handleVerifyOTP(newOtp.join('')), 100);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = pasted.split('').concat(Array(6 - pasted.length).fill(''));
    setOtp(newOtp);
    if (pasted.length === 6) {
      setTimeout(() => handleVerifyOTP(pasted), 100);
    }
  };

  // ==================== OTP: VERIFY ====================
  const handleVerifyOTP = async (otpCode) => {
    const code = otpCode || otp.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, otp: code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');

      // Sign in to Firebase
      await signInWithCustomToken(auth, data.customToken);

      // Verify the user is an owner
      const userDoc = await getDoc(doc(db, 'users', data.user.uid));
      if (userDoc.exists()) {
        const role = userDoc.data().role;
        if (role === 'owner' || role === 'admin') {
          navigate('/owner');
        } else {
          setError('❌ This account is not a Station Owner.');
          setOtp(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
        }
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <FaChargingStation className="auth-icon" />
          <h2>Owner Login</h2>
        </div>
        <p className="auth-subtitle">Login to manage your charging stations</p>

        {/* Mode Tabs */}
        <div className="mode-tabs">
          <button
            className={`mode-tab ${mode === 'password' ? 'active' : ''}`}
            onClick={() => {
              setMode('password');
              setError('');
              setSuccess('');
            }}
          >
            🔒 Password
          </button>
          <button
            className={`mode-tab ${mode === 'otp' ? 'active' : ''}`}
            onClick={() => {
              setMode('otp');
              setError('');
              setSuccess('');
            }}
          >
            ✉️ OTP
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* ============ PASSWORD MODE ============ */}
        {mode === 'password' && (
          <form onSubmit={handlePasswordLogin}>
            <div className="form-group">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <FaLock className="input-icon" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login as Owner'}
            </button>
          </form>
        )}

        {/* ============ OTP MODE: EMAIL STEP ============ */}
        {mode === 'otp' && otpStep === 'email' && (
          <form onSubmit={handleSendOTP}>
            <div className="form-group">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                placeholder="Enter owner email"
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                required
                autoFocus
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'Sending...' : (<>Send OTP <FaArrowRight /></>)}
            </button>
          </form>
        )}

        {/* ============ OTP MODE: CODE STEP ============ */}
        {mode === 'otp' && otpStep === 'otp' && (
          <>
            <div className="otp-inputs" onPaste={handleOtpPaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  disabled={loading}
                  className="otp-box"
                />
              ))}
            </div>

            <button
              className="btn btn-primary btn-full"
              onClick={() => handleVerifyOTP()}
              disabled={loading || otp.some((d) => !d)}
            >
              {loading ? 'Verifying...' : (<><FaCheckCircle /> Verify & Login</>)}
            </button>

            <div className="resend-row">
              {countdown > 0 ? (
                <span className="countdown">Resend in {countdown}s</span>
              ) : (
                <button
                  className="resend-btn"
                  onClick={handleSendOTP}
                  disabled={loading}
                >
                  <FaRedo /> Resend OTP
                </button>
              )}
            </div>

            <button
              className="change-email-btn"
              onClick={() => {
                setOtpStep('email');
                setOtp(['', '', '', '', '', '']);
                setError('');
                setSuccess('');
              }}
            >
              ← Use a different email
            </button>
          </>
        )}

        <div className="auth-links">
          <p>
            Don't have an account? <Link to="/register">Register as Owner</Link>
          </p>
          <p className="user-link">
            Are you a User? <Link to="/login">Login Here</Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .auth-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 75vh;
          padding: 40px 20px;
        }
        .auth-container {
          width: 100%;
          max-width: 440px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 40px;
          box-shadow: var(--shadow-xl);
        }
        .auth-header {
          text-align: center;
          margin-bottom: 8px;
        }
        .auth-icon {
          font-size: 40px;
          color: #1565c0;
          margin-bottom: 8px;
        }
        .auth-container h2 {
          text-align: center;
          color: var(--text);
          margin: 0;
          font-size: 24px;
          font-weight: 800;
        }
        .auth-subtitle {
          text-align: center;
          color: var(--text-muted);
          margin-bottom: 24px;
          font-size: 14px;
        }

        /* Mode tabs */
        .mode-tabs {
          display: flex;
          gap: 8px;
          background: var(--bg);
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 24px;
        }
        .mode-tab {
          flex: 1;
          padding: 10px;
          border: none;
          background: transparent;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .mode-tab.active {
          background: var(--surface);
          color: var(--primary);
          box-shadow: var(--shadow-sm);
        }

        .form-group {
          position: relative;
          margin-bottom: 20px;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-subtle);
        }
        .form-group input {
          padding-left: 42px;
        }
        .btn-full {
          width: 100%;
          padding: 14px;
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        /* OTP inputs */
        .otp-inputs {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-bottom: 24px;
        }
        .otp-box {
          width: 52px;
          height: 60px;
          text-align: center;
          font-size: 24px;
          font-weight: 800;
          border: 2px solid var(--border);
          border-radius: 12px;
          background: var(--surface);
          color: var(--text);
          outline: none;
          transition: all 0.2s;
          font-family: 'Inter', monospace;
        }
        .otp-box:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(35, 134, 54, 0.15);
        }
        .otp-box:disabled {
          opacity: 0.5;
        }

        .resend-row {
          text-align: center;
          margin: 16px 0;
        }
        .countdown {
          color: var(--text-muted);
          font-size: 13px;
        }
        .resend-btn {
          background: none;
          border: none;
          color: var(--primary);
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 8px;
        }
        .resend-btn:hover {
          background: var(--primary-light);
        }
        .change-email-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 13px;
          cursor: pointer;
          display: block;
          margin: 8px auto 0;
          padding: 8px;
        }
        .change-email-btn:hover {
          color: var(--primary);
        }

        .auth-links {
          text-align: center;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid var(--border);
        }
        .auth-links p {
          color: var(--text-muted);
          margin: 8px 0;
          font-size: 14px;
        }
        .auth-links a {
          color: #1565c0;
          font-weight: 600;
        }
        .user-link {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid var(--border);
        }
        .user-link a {
          color: var(--primary);
        }

        @media (max-width: 480px) {
          .auth-container { padding: 28px 20px; }
          .otp-inputs { gap: 6px; }
          .otp-box { width: 44px; height: 54px; font-size: 20px; }
        }
      `}</style>
    </div>
  );
};

export default OwnerLogin;