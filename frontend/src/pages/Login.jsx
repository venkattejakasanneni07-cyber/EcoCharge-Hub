import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaUser } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // ============================================================
  // HANDLE LOGIN
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const user = await login(email, password);

      // Check role to redirect appropriately
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const role = userDoc.data().role;
        if (role === 'owner') {
          navigate('/owner');
        } else if (role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      // Handle specific Firebase error codes with friendly messages
      let message = 'Failed to login';

      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        message = '❌ Invalid email or password. If you registered via Email Link, use the "Login with Email Link" option below.';
      } else if (err.code === 'auth/user-not-found') {
        message = '❌ No account found with this email. Please register first.';
      } else if (err.code === 'auth/too-many-requests') {
        message = '❌ Too many failed attempts. Try again in a few minutes.';
      } else if (err.code === 'auth/invalid-email') {
        message = '❌ Invalid email address.';
      } else if (err.message) {
        message = err.message;
      }

      setError(message);
    }
    setLoading(false);
  };

  // ============================================================
  // HANDLE PASSWORD RESET
  // ============================================================
  const handleResetPassword = async () => {
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email address first, then click "Forgot Password?"');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(`✅ Password reset link sent to ${email}. Check your inbox (and spam folder).`);
    } catch (err) {
      let message = 'Failed to send reset email';

      if (err.code === 'auth/user-not-found') {
        message = '❌ No account found with this email.';
      } else if (err.code === 'auth/invalid-email') {
        message = '❌ Invalid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        message = '❌ Too many requests. Try again later.';
      } else if (err.message) {
        message = err.message;
      }

      setError(message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <FaUser className="auth-icon" />
          <h2>User Login</h2>
        </div>
        <p className="auth-subtitle">Login to book charging stations</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
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

          <p className="forgot-password">
            <button type="button" onClick={handleResetPassword} disabled={loading}>
              Forgot Password?
            </button>
          </p>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login as User'}
          </button>
        </form>

        <div className="auth-links">
          <p>
            Don't have an account? <Link to="/register">Register as User</Link>
          </p>
          <p className="otp-link">
            🔗 Or <Link to="/email-link-login">Login with Email Link</Link> (no password)
          </p>
          <p className="owner-link">
            Are you a Station Owner? <Link to="/owner-login">Login Here</Link>
          </p>
        </div>
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
          max-width: 420px;
        }
        .auth-header {
          text-align: center;
          margin-bottom: 8px;
        }
        .auth-icon {
          font-size: 40px;
          color: var(--primary);
          margin-bottom: 8px;
        }
        .auth-container h2 {
          text-align: center;
          color: var(--text);
          margin: 0;
          font-size: 24px;
        }
        .auth-subtitle {
          text-align: center;
          color: var(--text-muted);
          margin-bottom: 30px;
          font-size: 14px;
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
        .forgot-password {
          text-align: right;
          margin-top: -10px;
          margin-bottom: 20px;
        }
        .forgot-password button {
          background: none;
          border: none;
          color: var(--primary);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          font-family: inherit;
        }
        .forgot-password button:hover:not(:disabled) {
          text-decoration: underline;
        }
        .forgot-password button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-full {
          width: 100%;
          padding: 14px;
          font-size: 16px;
        }
        .auth-links {
          text-align: center;
          margin-top: 24px;
        }
        .auth-links p {
          color: var(--text-muted);
          margin: 8px 0;
          font-size: 14px;
        }
        .auth-links a {
          color: var(--primary);
          font-weight: 600;
        }
        .auth-links a:hover {
          text-decoration: underline;
        }
        .otp-link {
          background: var(--primary-light);
          padding: 10px 16px;
          border-radius: 10px;
          margin: 12px 0;
          border: 1px dashed var(--primary);
        }
        .otp-link a {
          color: var(--primary);
          font-weight: 700;
        }
        .owner-link {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid var(--border);
        }
        .owner-link a {
          color: #1565c0;
        }
        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 20px;
          border-left: 4px solid #dc3545;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.5;
        }
        .success-message {
          background: #d4edda;
          color: #155724;
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 20px;
          border-left: 4px solid #28a745;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

export default Login;