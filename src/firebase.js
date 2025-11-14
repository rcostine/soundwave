// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDJG5xW4yL63ohgA57xcG9Wttst8jO8gEI",
  authDomain: "soundwave-live-pricing-sim.firebaseapp.com",
  databaseURL: "https://soundwave-live-pricing-sim-default-rtdb.firebaseio.com",
  projectId: "soundwave-live-pricing-sim",
  storageBucket: "soundwave-live-pricing-sim.firebasestorage.app",
  messagingSenderId: "772382975669",
  appId: "1:772382975669:web:125aea8a913694f23bc0fc",
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

