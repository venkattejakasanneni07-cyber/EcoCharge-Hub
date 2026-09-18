const dotenv = require('dotenv');
dotenv.config();

console.log('📋 Checking environment variables:');
console.log('-----------------------------------');
console.log('PORT:', process.env.PORT);
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('FIREBASE_PRIVATE_KEY length:', process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 'undefined');
console.log('-----------------------------------');

if (process.env.FIREBASE_PRIVATE_KEY) {
  console.log('✅ All environment variables are loaded!');
} else {
  console.log('❌ Missing environment variables! Check your .env file.');
}