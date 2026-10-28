import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import Home from './pages/Home';
import About from './pages/About';
import Stations from './pages/Stations';
import StationDetails from './pages/StationDetails';
import Login from './pages/Login';
import EmailLinkLogin from './pages/EmailLinkLogin';
import OwnerLogin from './pages/OwnerLogin';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Booking from './pages/Booking';
import History from './pages/History';
import Sustainability from './pages/Sustainability';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import VerifyEmail from './pages/VerifyEmail'; // <-- NEW IMPORT

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="app">
        <Navbar />
        <main>
          <Routes>
            {/* ============ PUBLIC ROUTES ============ */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/stations" element={<Stations />} />
            <Route path="/stations/:id" element={<StationDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/email-link-login" element={<EmailLinkLogin />} />
            <Route path="/owner-login" element={<OwnerLogin />} />
            <Route path="/register" element={<Register />} />
            
            {/* ============ NEW VERIFY EMAIL ROUTE ============ */}
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* ============ PROTECTED ROUTES ============ */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/booking/:stationId" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/sustainability" element={<ProtectedRoute><Sustainability /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* ============ ROLE-PROTECTED ROUTES ============ */}
            <Route path="/owner" element={<RoleProtectedRoute allowedRoles={['owner']}><OwnerDashboard /></RoleProtectedRoute>} />
            <Route path="/admin" element={<RoleProtectedRoute allowedRoles={['admin']}><AdminDashboard /></RoleProtectedRoute>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;