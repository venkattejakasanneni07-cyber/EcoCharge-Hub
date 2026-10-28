import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { FaEnvelopeOpenText } from 'react-icons/fa';

const VerifyEmail = () => {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(async () => {
      if (auth.currentUser) {
        await auth.currentUser.reload(); // Refresh user data from Firebase
        
        if (auth.currentUser.emailVerified) {
          clearInterval(interval);
          setChecking(false);
          
          const user = auth.currentUser;
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);

          // If they don't exist in Firestore yet, create their profile now
          if (!userSnap.exists()) {
            const pendingRole = localStorage.getItem('pendingRole') || 'user';
            const pendingPhone = localStorage.getItem('pendingPhone') || '';
            const pendingVehicle = localStorage.getItem('pendingVehicle') || '';
            
            try {
              await setDoc(userRef, {
                name: user.displayName || 'User',
                email: user.email,
                role: pendingRole,
                phone: pendingPhone,
                vehicleModel: pendingVehicle,
                createdAt: new Date().toISOString()
              });
              
              // Clean up local storage
              localStorage.removeItem('pendingRole');
              localStorage.removeItem('pendingPhone');
              localStorage.removeItem('pendingVehicle');
            } catch (err) {
              console.error("Error saving user profile:", err);
            }
          }

          // Check their role to redirect correctly
          const finalSnap = await getDoc(userRef);
          if (finalSnap.exists() && finalSnap.data().role === 'owner') {
            navigate('/owner'); // Redirect hosts to Owner Dashboard
          } else {
            navigate('/dashboard'); // Redirect users to User Dashboard
          }
        }
      } else {
        navigate('/login');
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className="verify-page">
      <div className="verify-card">
        <FaEnvelopeOpenText className="verify-icon" />
        <h2>Verify your email</h2>
        <p>
          We have sent a verification link to <strong>{auth.currentUser?.email}</strong>. 
          Please check your inbox and click the link.
        </p>
        <p className="status-text">
          {checking ? 'Waiting for verification...' : 'Verified! Redirecting...'}
        </p>
        <button className="btn btn-outline" onClick={handleLogout}>
          Cancel and Logout
        </button>
      </div>
      <style>{`
        .verify-page { display: flex; justify-content: center; align-items: center; min-height: 70vh; padding: 40px 20px; }
        .verify-card { background: var(--surface); padding: 40px; border-radius: 16px; text-align: center; max-width: 450px; border: 1px solid var(--border); box-shadow: var(--shadow-md); }
        .verify-icon { font-size: 60px; color: var(--primary); margin-bottom: 20px; }
        .verify-card h2 { margin-bottom: 15px; color: var(--text); }
        .verify-card p { color: var(--text-muted); margin-bottom: 20px; line-height: 1.6; }
        .status-text { font-weight: 700; color: var(--primary); }
      `}</style>
    </div>
  );
};

export default VerifyEmail;