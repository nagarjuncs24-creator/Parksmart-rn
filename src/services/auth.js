// Authentication service using Firebase
import { auth, db } from '../config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function register(email, password, name) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const userData = {
      uid: cred.user.uid,
      name,
      email: email.trim().toLowerCase(),
      phone: '',
      vehicleNumber: '',
      vehicleType: 'Car',
      profileImageUrl: cred.user.photoURL || '',
      role: 'user',
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), userData);
    return cred.user;
  } catch (error) {
    throw new Error(`Registration failed: ${error.message}`);
  }
}

export async function login(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (error) {
    throw new Error(`Login failed: ${error.message}`);
  }
}

export async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(`Logout failed: ${error.message}`);
  }
}

export function getCurrentUser() {
  return auth.currentUser;
}

export function subscribeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function updateAuthUserProfile({ displayName, photoURL }) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to update your profile.');
  }

  const payload = {};
  if (displayName !== undefined) payload.displayName = displayName;
  if (photoURL !== undefined) payload.photoURL = photoURL;

  if (Object.keys(payload).length) {
    await updateProfile(user, payload);
  }

  return user;
}
