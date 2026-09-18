import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaEnvelope, FaArrowRight, FaCheckCircle, FaRedo, FaLock
} from 'react-icons/fa';
import { auth, db } from '../firebase';
import { signInWithCustomToken } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const OtpLogin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  // ============ SEND OTP ============
  const handleSendOTP = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setStep('otp');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      setSuccess('OTP sent! Check your email inbox.');

      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // ============ OTP INPUT HANDLING ============
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits entered
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
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);

    const newOtp = pasted.split('').concat(Array(6 - pasted.length).fill(''));
    setOtp(newOtp);

    if (pasted.length === 6) {
      setTimeout(() => handleVerifyOTP(pasted), 100);
    }
  };

  // ============ VERIFY OTP ============
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
        body: JSON.stringify({ email, otp: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      // Sign in to Firebase with the custom token
      await signInWithCustomToken(auth, data.customToken);

      // Redirect based on role
      const userDoc = await getDoc(doc(db, 'users', data.user.uid));
      if (userDoc.exists()) {
        const role = userDoc.data().role;
        if (role === 'owner') navigate('/owner');
        else if (role === 'admin') navigate('/admin');
        else navigate('/dashboard');
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
          <div className="auth-icon-wrap">
            {step === 'email' ? <FaEnvelope /> : <FaLock />}
          </div>
          <h2>{step === 'email' ? 'Login with OTP' : 'Enter 6-digit Code'}</h2>
        </div>

        <p className="auth-subtitle">
          {step === 'email' && "Enter your email — we'll send a 6-digit code"}
          {step === 'otp' && `Code sent to ${email}`}
        </p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* STEP 1: EMAIL INPUT */}
        {step === 'email' && (
          <form onSubmit={handleSendOTP}>
            <div className="form-group">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

        {/* STEP 2: OTP INPUT */}
        {step === 'otp' && (
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
                setStep('email');
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
            Prefer password? <Link to="/login">Login here</Link>
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
          margin-bottom: 12px;
        }
        .auth-icon-wrap {
          width: 64px;
          height: 64px;
          background: var(--primary-light);
          color: var(--primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          margin: 0 auto 16px;
        }
        .auth-container h2 {
          text-align: center;
          color: var(--text);
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .auth-subtitle {
          text-align: center;
          color: var(--text-muted);
          margin-bottom: 28px;
          font-size: 14px;
          line-height: 1.5;
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
          transition: all 0.2s;
        }
        .resend-btn:hover {
          background: var(--primary-light);
        }
        .resend-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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
          margin: 0;
          font-size: 14px;
        }
        .auth-links a {
          color: var(--primary);
          font-weight: 600;
        }

        @media (max-width: 480px) {
          .auth-container { padding: 28px 20px; }
          .otp-inputs { gap: 6px; }
          .otp-box {
            width: 44px;
            height: 54px;
            font-size: 20px;
            border-radius: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default OtpLogin;