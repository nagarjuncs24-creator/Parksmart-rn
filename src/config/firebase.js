// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Replace with your Firebase project config from Firebase Console


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyApghayratL-5r8MQ7QJ_ZMr6UrrfjJRnE",
  authDomain: "smartpark-f6a3b.firebaseapp.com",
  projectId: "smartpark-f6a3b",
  storageBucket: "smartpark-f6a3b.firebasestorage.app",
  messagingSenderId: "812817307856",
  appId: "1:812817307856:web:1299a6f344bc0e51dee6d5"
};



const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
