const admin = require('firebase-admin');

// ============================================================
// ROBUST Firebase Admin Initialization
// Handles all private key formats automatically
// ============================================================
const initializeFirebase = () => {
  try {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';

    console.log('🔍 Raw key length:', privateKey.length);
    console.log('🔍 Raw key first 40 chars:', JSON.stringify(privateKey.substring(0, 40)));
    console.log('🔍 Raw key last 40 chars:', JSON.stringify(privateKey.substring(privateKey.length - 40)));

    // ============ STEP 1: Remove surrounding quotes ============
    privateKey = privateKey.trim();
    if ((privateKey.startsWith('"') && privateKey.endsWith('"')) ||
        (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
      privateKey = privateKey.slice(1, -1);
      console.log('🔧 Removed surrounding quotes');
    }

    // ============ STEP 2: Replace literal \n with actual newlines ============
    // Case 1: Contains literal "\n" (backslash n)
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
      console.log('🔧 Replaced literal \\n with newlines');
    }
    // Case 2: Already has real newlines (multi-line paste)
    // Case 3: No newlines at all — key is likely broken

    // ============ STEP 3: Verify key structure ============
    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
      throw new Error('Key missing BEGIN PRIVATE KEY marker');
    }
    if (!privateKey.includes('END PRIVATE KEY')) {
      throw new Error('Key missing END PRIVATE KEY marker');
    }
    if (privateKey.length < 1000) {
      throw new Error(`Key too short (${privateKey.length} chars). Expected ~1700 chars.`);
    }

    console.log('✅ Key validated. Length:', privateKey.length);

    // ============ STEP 4: Initialize Firebase ============
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });

    console.log('✅ Firebase Admin initialized successfully');
    console.log('📋 Project ID:', process.env.FIREBASE_PROJECT_ID);
    console.log('📋 Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error.message);
    console.error('');
    console.error('📋 Debug info:');
    console.error('- FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID || '✗ missing');
    console.error('- FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL || '✗ missing');
    console.error('- FIREBASE_PRIVATE_KEY length:', (process.env.FIREBASE_PRIVATE_KEY || '').length);
    process.exit(1);
  }
};

initializeFirebase();

const db = admin.firestore();

module.exports = { admin, db };