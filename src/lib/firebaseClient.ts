import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;

if (!apiKey || !authDomain || !projectId || !appId) {
  // eslint-disable-next-line no-console
  console.warn('[firebase] Missing required Firebase config env vars');
}

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  appId,
  storageBucket,
  messagingSenderId,
  measurementId,
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

export const auth = getAuth();

export function getCurrentUser() {
  return auth.currentUser;
}

export default auth;
