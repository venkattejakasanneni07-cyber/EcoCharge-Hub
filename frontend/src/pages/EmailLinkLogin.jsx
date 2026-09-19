import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaArrowRight, FaCheckCircle } from 'react-icons/fa';
import { auth, db } from '../firebase';
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const EmailLinkLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'sent' | 'verifying'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ============ CHECK IF USER ARRIVED VIA EMAIL LINK ============
  useEffect(() => {
    const completeSignIn = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        setStep('verifying');

        // Get email from localStorage
        let emailForSignIn = window.localStorage.getItem('emailForSignIn');

        // If not found, prompt user
        if (!emailForSignIn) {
          emailForSignIn = window.prompt(
            'Please enter the email you used to sign in:'
          );
        }

        if (!emailForSignIn) {
          setError('Email required to complete sign-in');
          setStep('email');
          return;
        }

        try {
          const result = await signInWithEmailLink(
            auth,
            emailForSignIn,
            window.location.href
          );

          // Clear stored email
          window.localStorage.removeItem('emailForSignIn');

          const user = result.user;

          // Check if user exists in Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));

          if (!userDoc.exists()) {
            // Create user document
            await setDoc(doc(db, 'users', user.uid), {
              name: user.displayName || emailForSignIn.split('@')[0],
              email: emailForSignIn,
              phone: '',
              vehicleModel: '',
              role: 'user',
              provider: 'email-link',
              createdAt: new Date().toISOString(),
            });
          }

          // Redirect based on role
          const finalDoc = await getDoc(doc(db, 'users', user.uid));
          const role = finalDoc.exists() ? finalDoc.data().role : 'user';

          if (role === 'owner') navigate('/owner');
          else if (role === 'admin') navigate('/admin');
          else navigate('/dashboard');
        } catch (err) {
          console.error('Sign in error:', err);
          setError(err.message || 'Failed to sign in');
          setStep('email');
        }
      }
    };

    completeSignIn();
  }, [navigate]);

  // ============ SEND EMAIL LINK ============
  const handleSendLink = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const actionCodeSettings = {
      url: `${window.location.origin}/email-link-login`,
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);

      // Save email locally
      window.localStorage.setItem('emailForSignIn', email);

      setStep('sent');
    } catch (err) {
      console.error('Send link error:', err);
      setError(err.message || 'Failed to send login link');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-icon-wrap">
            <FaEnvelope />
          </div>
          <h2>
            {step === 'email' && 'Passwordless Login'}
            {step === 'sent' && 'Check Your Email'}
            {step === 'verifying' && 'Signing In...'}
          </h2>
        </div>

        <p className="auth-subtitle">
          {step === 'email' && "We'll send you a secure login link"}
          {step === 'sent' && `Link sent to ${email}`}
          {step === 'verifying' && 'Please wait...'}
        </p>

        {error && <div className="error-message">{error}</div>}

        {/* ============ STEP 1: EMAIL INPUT ============ */}
        {step === 'email' && (
          <form onSubmit={handleSendLink}>
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
              {loading ? 'Sending...' : (<>Send Login Link <FaArrowRight /></>)}
            </button>

            <p className="hint">
              💡 No password needed. Click the link in your email to sign in.
            </p>
          </form>
        )}

        {/* ============ STEP 2: LINK SENT ============ */}
        {step === 'sent' && (
          <div className="sent-state">
            <FaCheckCircle className="success-icon" />
            <p>
              We sent a login link to <strong>{email}</strong>
            </p>
            <p className="hint">
              Check your inbox (and spam folder). Click the link to sign in.
            </p>

            <button
              className="btn btn-secondary btn-full"
              onClick={() => {
                setStep('email');
                setError('');
              }}
            >
              Use Different Email
            </button>
          </div>
        )}

        {/* ============ STEP 3: VERIFYING ============ */}
        {step === 'verifying' && (
          <div className="verifying-state">
            <div className="spinner"></div>
            <p>Verifying your link...</p>
          </div>
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
        }
        .auth-subtitle {
          text-align: center;
          color: var(--text-muted);
          margin-bottom: 28px;
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
        .btn-full {
          width: 100%;
          padding: 14px;
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .hint {
          text-align: center;
          color: var(--text-muted);
          font-size: 13px;
          margin-top: 16px;
          line-height: 1.5;
        }
        .sent-state {
          text-align: center;
        }
        .success-icon {
          font-size: 56px;
          color: var(--status-available);
          margin-bottom: 20px;
        }
        .sent-state p {
          color: var(--text-muted);
          margin-bottom: 12px;
          font-size: 14px;
        }
        .verifying-state {
          text-align: center;
          padding: 20px 0;
        }
        .verifying-state p {
          color: var(--text-muted);
          margin-top: 16px;
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
      `}</style>
    </div>
  );
};

export default EmailLinkLogin;