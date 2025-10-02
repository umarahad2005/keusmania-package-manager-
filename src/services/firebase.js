// Firebase web SDK initialization (modular v9+ style)
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCmkyVfGok3zjEs9EgqaBGU9nrQeGATpyA",
  authDomain: "keusmania-b31dd.firebaseapp.com",
  projectId: "keusmania-b31dd",
  storageBucket: "keusmania-b31dd.firebasestorage.app",
  messagingSenderId: "917676860009",
  appId: "1:917676860009:web:819beba5082de75c81f8f8",
  measurementId: "G-H21VB0CVH9"
};

const app = initializeApp(firebaseConfig);
let analytics; try { analytics = getAnalytics(app); } catch(_) { /* analytics optional (SSR / unsupported) */ }
const db = getFirestore(app);

export { app, db, analytics };