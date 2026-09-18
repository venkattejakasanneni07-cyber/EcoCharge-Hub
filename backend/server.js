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

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================
// TEST ROUTES
// ============================================================
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
// START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log(`✅ EcoChargeHub Backend running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🔥 Firebase connected successfully!`);
});