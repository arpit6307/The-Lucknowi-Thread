import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// === YAHAN APNA FIREBASE CONFIG OBJECT PASTE KAREN ===
const firebaseConfig = {
  apiKey: "AIzaSyDXXWIys4dBwJY9g-1acUo_IT7fN8PmopY",
  authDomain: "the-lucknowi-thread.firebaseapp.com",
  databaseURL: "https://the-lucknowi-thread-default-rtdb.firebaseio.com",
  projectId: "the-lucknowi-thread",
  storageBucket: "the-lucknowi-thread.firebasestorage.app",
  messagingSenderId: "73547073808",
  appId: "1:73547073808:web:9d93c6ab53b17432b97d95"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services ko export karen
export const auth = getAuth(app);
export const db = getFirestore(app);