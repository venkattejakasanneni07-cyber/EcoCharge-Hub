import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaChargingStation } from 'react-icons/fa';
import { signInWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const OwnerLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUnverifiedEmail(null);
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        await signOut(auth);
        setUnverifiedEmail(email);
        setError('Please verify your email address before logging in.');
        setLoading(false);
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().role === 'owner') {
        navigate('/owner');
      } else {
        await signOut(auth);
        setError('This account is not registered as a Host/Owner.');
      }
    } catch (err) {
      setError(err.message || 'Failed to login');
    }
    setLoading(false);
  };

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      await signOut(auth);
      setSuccess(`✅ Verification email resent to ${email}.`);
    } catch (err) {
      setError('Error resending email: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <FaChargingStation className="auth-icon" />
          <h2>Owner / Host Login</h2>
        </div>
        <p className="auth-subtitle">Login to manage your charging stations</p>

        {error && (
          <div className="error-message">
            {error}
            {unverifiedEmail && (
              <button onClick={handleResendVerification} className="resend-btn" disabled={loading}>
                {loading ? 'Sending...' : 'Resend verification email'}
              </button>
            )}
          </div>
        )}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              placeholder="Enter owner email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <FaLock className="input-icon" />
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Login as Owner'}
          </button>
        </form>

        <div className="auth-links">
          <p>Don't have an account? <Link to="/register">Register</Link></p>
        </div>
      </div>

      <style>{`
        .auth-page { display: flex; justify-content: center; align-items: center; min-height: 70vh; padding: 40px 0; }
        .auth-container { width: 100%; max-width: 420px; background: var(--surface); padding: 40px; border-radius: 16px; box-shadow: var(--shadow-md); border: 1px solid var(--border); }
        .auth-header { text-align: center; margin-bottom: 8px; }
        .auth-icon { font-size: 40px; color: var(--primary); margin-bottom: 8px; }
        .auth-container h2 { text-align: center; color: var(--text); margin: 0; font-size: 24px; }
        .auth-subtitle { text-align: center; color: var(--text-muted); margin-bottom: 30px; font-size: 14px; }
        .form-group { position: relative; margin-bottom: 20px; }
        .input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-subtle); }
        .form-group input { width: 100%; padding: 12px 12px 12px 42px; border: 2px solid var(--border); border-radius: 10px; font-size: 15px; background: var(--bg); color: var(--text); }
        .form-group input:focus { border-color: var(--primary); outline: none; }
        .btn-full { width: 100%; padding: 14px; font-size: 16px; margin-top: 10px; }
        .auth-links { text-align: center; margin-top: 24px; font-size: 14px; }
        .auth-links p { margin: 8px 0; color: var(--text-muted); }
        .auth-links a { color: var(--primary); font-weight: 600; }
        .error-message { background: #f8d7da; color: #721c24; padding: 12px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #dc3545; font-size: 13px; }
        .success-message { background: #d4edda; color: #155724; padding: 12px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #28a745; font-size: 13px; }
        .resend-btn { display: block; margin-top: 8px; background: none; border: none; text-decoration: underline; color: #721c24; font-weight: 700; cursor: pointer; font-size: 13px; padding: 0; }
      `}</style>
    </div>
  );
};

export default OwnerLogin;