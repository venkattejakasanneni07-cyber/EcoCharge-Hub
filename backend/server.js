const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const crypto = require('crypto');
const Razorpay = require('razorpay');
dotenv.config();

const { admin, db } = require('./config/firebaseAdmin');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://ecocharge-hub.web.app',
    'https://ecocharge-hub.firebaseapp.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ============================================
// ROUTES
// ============================================
app.get('/', (req, res) => {
  res.json({ success: true, message: 'EcoChargeHub Backend is running' });
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

// ============================================
// RAZORPAY ROUTES
// ============================================

// 1. Create an Order
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount } = req.body;
    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (error) {
    console.error('Razorpay Order Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Verify Payment Signature
app.post('/api/verify-payment', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    res.json({ success: true, message: "Payment verified successfully" });
  } else {
    res.status(400).json({ success: false, message: "Invalid signature" });
  }
});

// 3. Verify Subscription Payment & Update Firestore
app.post('/api/verify-subscription', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, months } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    try {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      let baseDate = new Date();
      if (userDoc.exists && userDoc.data().subscriptionExpiry) {
         const currentExpiry = new Date(userDoc.data().subscriptionExpiry);
         if (currentExpiry > new Date()) {
             baseDate = currentExpiry;
         }
      }
      
      baseDate.setMonth(baseDate.getMonth() + months);

      await userRef.update({
        subscriptionExpiry: baseDate.toISOString(),
        subscriptionStatus: 'active'
      });

      res.json({ success: true, message: "Subscription activated!", expiry: baseDate.toISOString() });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  } else {
    res.status(400).json({ success: false, message: "Invalid signature" });
  }
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`✅ EcoChargeHub Backend running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🔥 Firebase connected successfully!`);
});