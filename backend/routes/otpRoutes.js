const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebaseAdmin');
const { generateOTP, getOTPExpiry, isOTPExpired } = require('../utils/otpUtils');
const { sendOTPEmail } = require('../services/emailService');

// Rate limit map
const rateLimitMap = new Map();

// ============================================================
// POST /api/otp/send
// ============================================================
router.post('/send', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit: 1 OTP per 60 seconds
    const lastSent = rateLimitMap.get(normalizedEmail);
    if (lastSent && Date.now() - lastSent < 60 * 1000) {
      const waitSec = Math.ceil((60 * 1000 - (Date.now() - lastSent)) / 1000);
      return res.status(429).json({
        error: `Please wait ${waitSec} seconds before requesting a new code`,
      });
    }

    const otpCode = generateOTP();
    const expiresAt = getOTPExpiry();

    // Save OTP in Firestore
    await db.collection('otps').doc(normalizedEmail).set({
      email: normalizedEmail,
      code: otpCode,
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      attempts: 0,
    });

    // Send email
    await sendOTPEmail(normalizedEmail, otpCode);

    rateLimitMap.set(normalizedEmail, Date.now());

    res.json({
      success: true,
      message: 'OTP sent successfully. Check your email.',
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: error.message || 'Failed to send OTP' });
  }
});

// ============================================================
// POST /api/otp/verify
// ============================================================
router.post('/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpDoc = await db.collection('otps').doc(normalizedEmail).get();

    if (!otpDoc.exists) {
      return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
    }

    const otpData = otpDoc.data();

    if (otpData.attempts >= 5) {
      await db.collection('otps').doc(normalizedEmail).delete();
      return res.status(429).json({ error: 'Too many attempts. Request a new OTP.' });
    }

    if (isOTPExpired(otpData.expiresAt)) {
      await db.collection('otps').doc(normalizedEmail).delete();
      return res.status(400).json({ error: 'OTP expired. Request a new one.' });
    }

    if (otpData.code !== otp.toString().trim()) {
      await db.collection('otps').doc(normalizedEmail).update({
        attempts: admin.firestore.FieldValue.increment(1),
      });
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // OTP verified
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(normalizedEmail);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        userRecord = await admin.auth().createUser({
          email: normalizedEmail,
          emailVerified: true,
          displayName: normalizedEmail.split('@')[0],
        });
        await db.collection('users').doc(userRecord.uid).set({
          name: normalizedEmail.split('@')[0],
          email: normalizedEmail,
          phone: '',
          vehicleModel: '',
          role: 'user',
          provider: 'otp',
          createdAt: new Date().toISOString(),
        });
      } else {
        throw error;
      }
    }

    await db.collection('otps').doc(normalizedEmail).delete();

    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    res.json({
      success: true,
      message: 'Login successful',
      customToken,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: error.message || 'Failed to verify OTP' });
  }
});

module.exports = router;