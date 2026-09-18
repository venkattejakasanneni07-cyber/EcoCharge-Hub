import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * RoleProtectedRoute
 * 
 * Protects a route based on the user's role stored in Firestore.
 * 
 * @param {ReactNode} children - The component to render
 * @param {string[]} allowedRoles - Array of roles allowed to access (e.g., ['owner'])
 */
const RoleProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkRole = async () => {
      // Wait for auth to finish loading
      if (authLoading) return;

      // Not logged in → let ProtectedRoute redirect
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (!userDoc.exists()) {
          setError('User profile not found in database.');
          setLoading(false);
          return;
        }

        const userData = userDoc.data();
        setUserRole(userData.role || 'user');
      } catch (err) {
        console.error('Error checking role:', err);
        setError(err.message);
      }
      setLoading(false);
    };

    checkRole();
  }, [user, authLoading]);

  // Loading state
  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  // Not logged in → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Error loading user data
  if (error) {
    return (
      <div className="access-denied">
        <div className="denied-card">
          <div className="denied-icon">⚠️</div>
          <h2>Error Loading Profile</h2>
          <p>{error}</p>
          <button
            className="btn btn-primary"
            onClick={() => (window.location.href = '/dashboard')}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Role not allowed → show Access Denied
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return (
      <div className="access-denied">
        <div className="denied-card">
          <div className="denied-icon">🚫</div>
          <h2>Access Denied</h2>
          <p>
            You don't have permission to access this page.
            {allowedRoles.includes('owner') && ' This page is for Station Owners only.'}
            {allowedRoles.includes('admin') && ' This page is for Admins only.'}
          </p>
          <div className="denied-actions">
            <button
              className="btn btn-primary"
              onClick={() => (window.location.href = '/dashboard')}
            >
              Go to Dashboard
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => (window.location.href = '/stations')}
            >
              Browse Stations
            </button>
          </div>
        </div>
      </div>
    );
  }

  // All checks passed
  return children;
};

export default RoleProtectedRoute;