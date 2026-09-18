const crypto = require('crypto'); 
 
const generateOTP = () => { 
  return crypto.randomInt(100000, 999999).toString(); 
}; 
 
const getOTPExpiry = () => { 
  return new Date(Date.now() + 5 * 60 * 1000); 
}; 
 
const isOTPExpired = (expiryTimestamp) => { 
  if (!expiryTimestamp) return true; 
  const expiry = expiryTimestamp.toDate ? expiryTimestamp.toDate() : new Date(expiryTimestamp); 
  return new Date() > expiry; 
}; 
 
module.exports = { generateOTP, getOTPExpiry, isOTPExpired }; 
