import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FaBars, FaTimes, FaLeaf, FaUser, FaSignOutAlt, 
  FaMoon, FaSun, FaChevronDown 
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState('user');
  const [userName, setUserName] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setUserRole('user');
        setUserName('');
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role || 'user');
          setUserName(userData.name || user.displayName || 'User');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, [user]);

  useEffect(() => {
    setIsOpen(false);
    setShowProfileMenu(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      setUserRole('user');
      setUserName('');
      setShowProfileMenu(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <Link to="/" className="nav-logo">
          <FaLeaf className="logo-icon" />
          <span className="logo-text">EcoChargeHub</span>
        </Link>

        <ul className={`nav-menu ${isOpen ? 'active' : ''}`}>
          <li>
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/stations" className={`nav-link ${isActive('/stations') ? 'active' : ''}`}>
              Find Stations
            </Link>
          </li>
          <li>
            <Link to="/about" className={`nav-link ${isActive('/about') ? 'active' : ''}`}>
              About
            </Link>
          </li>

          {user && (
            <>
              <li>
                <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/history" className={`nav-link ${isActive('/history') ? 'active' : ''}`}>
                  Bookings
                </Link>
              </li>
              <li>
                <Link to="/sustainability" className={`nav-link ${isActive('/sustainability') ? 'active' : ''}`}>
                  Sustainability
                </Link>
              </li>
              {userRole === 'owner' && (
                <li>
                  <Link to="/owner" className={`nav-link ${isActive('/owner') ? 'active' : ''}`}>
                    Owner Panel
                  </Link>
                </li>
              )}
              {userRole === 'admin' && (
                <li>
                  <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
                    Admin
                  </Link>
                </li>
              )}
            </>
          )}

          <li className="theme-toggle-item">
            <button 
              className="theme-toggle" 
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            >
              {theme === 'light' ? <FaMoon /> : <FaSun />}
            </button>
          </li>

          {user ? (
            <li className="user-menu-item">
              <button 
                className="user-menu-btn"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="user-avatar"><FaUser /></div>
                <span className="user-name">{userName}</span>
                <FaChevronDown className={`chevron ${showProfileMenu ? 'open' : ''}`} />
              </button>

              {showProfileMenu && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-avatar"><FaUser /></div>
                    <div className="dropdown-info">
                      <span className="dropdown-name">{userName}</span>
                      <span className="dropdown-email">{user.email}</span>
                      <span className={`dropdown-role ${userRole}`}>
                        {userRole === 'owner' ? 'Station Owner' : userRole === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link to="/profile" className="dropdown-item">
                    <FaUser /> My Profile
                  </Link>
                  <button className="dropdown-item logout-item" onClick={handleLogout}>
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              )}
            </li>
          ) : (
            <>
              <li className="auth-link">
                <Link to="/login" className="login-link">Login</Link>
              </li>
              <li className="auth-btn">
                <Link to="/register" className="btn btn-primary register-btn">Register</Link>
              </li>
            </>
          )}
        </ul>

        <button className="hamburger" onClick={toggleMenu} aria-label="Menu">
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {isOpen && <div className="mobile-overlay" onClick={toggleMenu}></div>}

      <style jsx>{`
        .navbar {
          background: var(--surface);
          box-shadow: var(--shadow-sm);
          position: sticky;
          top: 0;
          z-index: 1000;
          border-bottom: 1px solid var(--border);
          transition: background 0.3s ease;
        }
        .nav-container {
          display: flex; justify-content: space-between;
          align-items: center; padding: 14px 20px;
          max-width: 1200px; margin: 0 auto; position: relative;
        }

        .nav-logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; color: var(--primary);
          font-size: 20px; font-weight: 800;
          letter-spacing: -0.03em; transition: transform 0.3s;
        }
        .nav-logo:hover { transform: scale(1.02); }
        .logo-icon { font-size: 26px; }

        .nav-menu {
          display: flex; list-style: none; gap: 8px;
          align-items: center; margin: 0; padding: 0;
        }

        .nav-link {
          text-decoration: none;
          color: var(--text-muted);
          font-weight: 500; font-size: 14px;
          letter-spacing: -0.01em;
          padding: 8px 14px; border-radius: 8px;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .nav-link:hover {
          color: var(--primary);
          background: var(--primary-light);
        }
        .nav-link.active {
          color: var(--primary);
          background: var(--primary-light);
          font-weight: 600;
        }

        .theme-toggle-item { margin-left: 8px; }
        .theme-toggle {
          background: var(--bg);
          border: none; font-size: 16px;
          cursor: pointer; padding: 8px;
          width: 36px; height: 36px;
          border-radius: 50%; transition: all 0.3s;
          color: var(--text-muted);
          display: flex; align-items: center; justify-content: center;
        }
        .theme-toggle:hover {
          background: var(--primary-light);
          color: var(--primary);
          transform: rotate(15deg);
        }

        .auth-link { margin-left: 8px; }
        .login-link {
          text-decoration: none;
          color: var(--text-muted);
          font-weight: 600; font-size: 14px;
          padding: 8px 16px; border-radius: 8px;
          transition: all 0.2s;
        }
        .login-link:hover {
          color: var(--primary);
          background: var(--primary-light);
        }
        .auth-btn { margin-left: 4px; }
        .register-btn {
          padding: 9px 20px; border-radius: 8px;
          font-size: 14px; font-weight: 600;
        }

        .user-menu-item { position: relative; margin-left: 8px; }
        .user-menu-btn {
          display: flex; align-items: center; gap: 8px;
          background: var(--bg); border: none;
          padding: 6px 12px 6px 6px;
          border-radius: 50px; cursor: pointer;
          transition: all 0.2s; font-family: inherit;
        }
        .user-menu-btn:hover { background: var(--primary-light); }
        .user-avatar {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          border-radius: 50%; display: flex;
          align-items: center; justify-content: center;
          color: white; font-size: 14px;
        }
        .user-name {
          font-weight: 600; color: var(--text);
          font-size: 14px; max-width: 100px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .chevron {
          font-size: 10px; color: var(--text-muted);
          transition: transform 0.2s;
        }
        .chevron.open { transform: rotate(180deg); }

        .profile-dropdown {
          position: absolute; top: calc(100% + 10px); right: 0;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: var(--shadow-lg);
          min-width: 240px; overflow: hidden;
          z-index: 100;
        }
        .dropdown-header {
          padding: 16px; display: flex;
          gap: 12px; align-items: center;
          background: var(--bg);
        }
        .dropdown-avatar {
          width: 42px; height: 42px;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          border-radius: 50%; display: flex;
          align-items: center; justify-content: center;
          color: white; font-size: 18px; flex-shrink: 0;
        }
        .dropdown-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .dropdown-name {
          font-weight: 700; color: var(--text); font-size: 14px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .dropdown-email {
          color: var(--text-muted); font-size: 12px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .dropdown-role {
          display: inline-block; padding: 2px 8px;
          border-radius: 20px; font-size: 10px;
          font-weight: 600; margin-top: 4px; width: fit-content;
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        .dropdown-role.user { background: var(--primary-light); color: var(--primary); }
        .dropdown-role.owner { background: var(--status-available-bg); color: var(--status-available); }
        .dropdown-role.admin { background: var(--status-limited-bg); color: var(--status-limited); }
        .dropdown-divider { height: 1px; background: var(--border); }
        .dropdown-item {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px; text-decoration: none;
          color: var(--text-muted); font-size: 14px; font-weight: 500;
          background: none; border: none; width: 100%;
          cursor: pointer; transition: all 0.2s;
          font-family: inherit; text-align: left;
        }
        .dropdown-item:hover { background: var(--bg); color: var(--primary); }
        .dropdown-item svg { font-size: 14px; }
        .logout-item { color: var(--status-unavailable); }
        .logout-item:hover { background: var(--status-unavailable-bg); color: var(--status-unavailable); }

        .hamburger {
          display: none; background: none; border: none;
          font-size: 22px; cursor: pointer;
          color: var(--text); padding: 8px;
          border-radius: 8px; transition: background 0.2s;
        }
        .hamburger:hover { background: var(--bg); }

        .mobile-overlay {
          display: none; position: fixed; inset: 0;
          background: rgba(0,0,0,0.4);
          z-index: 998; top: 60px;
        }

        @media (max-width: 992px) {
          .nav-menu { gap: 4px; }
          .nav-link { font-size: 13px; padding: 6px 10px; }
          .user-name { display: none; }
        }
        @media (max-width: 768px) {
          .nav-container { flex-wrap: wrap; padding: 12px 16px; }
          .logo-text { font-size: 18px; }
          .hamburger { display: block; }
          .mobile-overlay { display: block; }
          .nav-menu {
            display: none; flex-direction: column;
            width: 100%; padding: 16px 0; gap: 4px;
            position: absolute; top: 100%; left: 0;
            background: var(--surface);
            box-shadow: var(--shadow-lg);
            border-top: 1px solid var(--border);
            border-radius: 0 0 16px 16px;
            z-index: 999;
            max-height: calc(100vh - 60px); overflow-y: auto;
          }
          .nav-menu.active { display: flex; }
          .nav-menu li { width: 100%; }
          .nav-link {
            display: block; padding: 12px 20px;
            font-size: 15px; border-radius: 0; width: 100%;
          }
          .nav-link.active {
            background: var(--primary-light);
            border-left: 3px solid var(--primary);
          }
          .theme-toggle-item { margin-left: 0; padding: 8px 20px; }
          .theme-toggle {
            width: 100%; border-radius: 8px;
            padding: 12px; font-size: 15px;
            justify-content: flex-start;
          }
          .theme-toggle::after {
            content: 'Toggle Theme'; margin-left: 8px;
          }
          .auth-link, .auth-btn { margin-left: 0; width: 100%; }
          .login-link {
            display: block; padding: 12px 20px;
            font-size: 15px; border-radius: 0; width: 100%;
          }
          .register-btn {
            display: block; width: calc(100% - 40px);
            margin: 8px 20px; text-align: center; padding: 12px;
          }
          .user-menu-item { width: 100%; margin-left: 0; padding: 8px 20px; }
          .user-menu-btn {
            width: 100%; justify-content: flex-start;
            padding: 12px; border-radius: 8px;
          }
          .user-name { display: block; font-size: 15px; }
          .profile-dropdown {
            position: static; box-shadow: none;
            margin-top: 8px;
            border: 1px solid var(--border);
          }
        }
        @media (max-width: 480px) {
          .logo-text { font-size: 16px; }
          .logo-icon { font-size: 22px; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;