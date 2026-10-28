import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaUser, FaChargingStation } from 'react-icons/fa';
import { auth, db } from '../firebase';
import { sendPasswordResetEmail, sendEmailVerification, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const Login = () => {
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
        setError('Your email is not verified. Please check your inbox for the verification link.');
        setLoading(false);
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const role = userDoc.data().role;
        if (role === 'owner') navigate('/owner');
        else if (role === 'admin') navigate('/admin');
        else navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      let message = 'Failed to login';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        message = '❌ Invalid email or password.';
      } else if (err.code === 'auth/user-not-found') {
        message = '❌ No account found with this email.';
      } else if (err.code === 'auth/too-many-requests') {
        message = '❌ Too many failed attempts. Try again later.';
      } else {
        message = err.message;
      }
      setError(message);
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
      setSuccess(`✅ Verification email resent to ${email}. Check your inbox.`);
    } catch (err) {
      setError('Error resending email: ' + err.message);
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    setError('');
    setSuccess('');
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(`✅ Password reset email sent to ${email}. Check your inbox.`);
    } catch (err) {
      setError(err.message);
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

        {error && (
          <div className="error-message">
            {error}
            {unverifiedEmail && (
              <button onClick={handleResendVerification} className="resend-btn" disabled={loading}>
                {loading ? 'Sending...' : 'Click here to resend verification email'}
              </button>
            )}
          </div>
        )}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <FaEnvelope className="input-icon" />
            <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <FaLock className="input-icon" />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <p className="forgot-password">
            <button type="button" onClick={handleResetPassword} disabled={loading}>
              Forgot Password?
            </button>
          </p>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Login as User'}
          </button>
        </form>

        <div className="auth-links">
          <p>Don't have an account? <Link to="/register">Register</Link></p>
          
          {/* ADDED HOST LOGIN LINK BACK */}
          <div className="host-divider">
            <span>or</span>
          </div>
          <p className="host-login-link">
            <Link to="/owner-login">
              <FaChargingStation /> Login as Host / Owner
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        .auth-page { display: flex; justify-content: center; align-items: center; min-height: 70vh; padding: 40px 0; }
        .auth-container { width: 100%; max-width: 420px; }
        .auth-header { text-align: center; margin-bottom: 8px; }
        .auth-icon { font-size: 40px; color: var(--primary); margin-bottom: 8px; }
        .auth-container h2 { text-align: center; color: var(--text); margin: 0; font-size: 24px; }
        .auth-subtitle { text-align: center; color: var(--text-muted); margin-bottom: 30px; font-size: 14px; }
        .form-group { position: relative; margin-bottom: 20px; }
        .input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-subtle); }
        .form-group input { padding-left: 42px; }
        .forgot-password { text-align: right; margin-top: -10px; margin-bottom: 20px; }
        .forgot-password button { background: none; border: none; color: var(--primary); font-size: 13px; font-weight: 600; cursor: pointer; padding: 0; font-family: inherit; }
        .forgot-password button:hover:not(:disabled) { text-decoration: underline; }
        .btn-full { width: 100%; padding: 14px; font-size: 16px; }
        .auth-links { text-align: center; margin-top: 24px; }
        .auth-links p { color: var(--text-muted); margin: 8px 0; font-size: 14px; }
        .auth-links a { color: var(--primary); font-weight: 600; text-decoration: none; }
        .auth-links a:hover { text-decoration: underline; }
        
        /* New styles for the Host Login section */
        .host-divider { display: flex; align-items: center; text-align: center; margin: 20px 0; color: var(--text-muted); font-size: 12px; }
        .host-divider::before, .host-divider::after { content: ''; flex: 1; border-bottom: 1px solid var(--border); }
        .host-divider span { padding: 0 10px; text-transform: uppercase; letter-spacing: 0.05em; }
        .host-login-link a { display: inline-flex; align-items: center; gap: 8px; color: var(--text); background: var(--bg); padding: 10px 20px; border-radius: 8px; border: 1px solid var(--border); transition: all 0.2s; font-size: 14px; }
        .host-login-link a:hover { background: var(--primary-light); color: var(--primary); border-color: var(--primary); text-decoration: none; }

        .error-message { background: #f8d7da; color: #721c24; padding: 12px 16px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #dc3545; font-size: 13px; font-weight: 500; line-height: 1.5; }
        .success-message { background: #d4edda; color: #155724; padding: 12px 16px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #28a745; font-size: 13px; font-weight: 500; line-height: 1.5; }
        .resend-btn { display: block; margin-top: 8px; background: none; border: none; text-decoration: underline; color: #721c24; font-weight: 700; cursor: pointer; font-size: 13px; padding: 0; }
        .resend-btn:hover { color: #dc3545; }
      `}</style>
    </div>
  );
};

export default Login;