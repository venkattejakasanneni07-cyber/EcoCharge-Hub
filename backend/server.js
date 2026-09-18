const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import Firebase Admin
const { admin, db } = require('./config/firebaseAdmin');

// Import routes
const otpRoutes = require('./routes/otpRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://ecocharge-hub.web.app',
    'https://ecocharge-hub.firebaseapp.com',
    'https://ecochargehub.vercel.app',
    'https://*.web.app',
    'https://*.firebaseapp.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ============================================================
// TEST ROUTES
// ============================================================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'EcoChargeHub Backend is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working!' });
});

app.get('/api/firebase-test', async (req, res) => {
  try {
    await db.collection('test').doc('ping').set({
      timestamp: new Date().toISOString(),
    });
    res.json({ success: true, message: 'Firebase connected!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// REGISTER ROUTES
// ============================================================
app.use('/api/otp', otpRoutes);

// ============================================================
// ERROR HANDLING
// ============================================================
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log(`✅ EcoChargeHub Backend running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🔥 Firebase connected successfully!`);
});