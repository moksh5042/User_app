// firebaseConfig.js
<<<<<<< HEAD
// Firebase v9 modular SDK (Realtime Database)
=======
>>>>>>> b0a2188 (Initial commit)
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA11C6qwOowhuri2yMHGs63UlIsedUQ4Mg",
  authDomain: "bustrack-fd763.firebaseapp.com",
  databaseURL: "https://bustrack-fd763-default-rtdb.firebaseio.com",
  projectId: "bustrack-fd763",
  storageBucket: "bustrack-fd763.firebasestorage.app",
  messagingSenderId: "363886219429",
  appId: "1:363886219429:web:f5c753b3d6040b3721bd4c",
  measurementId: "G-FP1KQ4EYEP"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Realtime Database
const db = getDatabase(app);

export { app, db, firebaseConfig };
