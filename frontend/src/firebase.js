import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC4eQIpptHy2AvZhBRO7MeNfr1fvf3FZ10",
  authDomain: "ecocharge-hub.firebaseapp.com",
  projectId: "ecocharge-hub",
  storageBucket: "ecocharge-hub.firebasestorage.app",
  messagingSenderId: "1012049537954",
  appId: "1:1012049537954:web:8fcb033c5adcd2d19b60fb"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();