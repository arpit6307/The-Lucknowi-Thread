import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage"; // <-- NAYA: Firebase Storage ke liye import

// Environment variables se Firebase configuration ko surakshit roop se load karein.
const firebaseConfig = {
  apiKey: "AIzaSyDXXWIys4dBwJY9g-1acUo_IT7fN8PmopY",
  authDomain: "the-lucknowi-thread.firebaseapp.com",
  databaseURL: "https://the-lucknowi-thread-default-rtdb.firebaseio.com",
  projectId: "the-lucknowi-thread",
  storageBucket: "the-lucknowi-thread.firebasestorage.app",
  messagingSenderId: "73547073808",
  appId: "1:73547073808:web:9d93c6ab53b17432b97d95"
};

// Firebase app ko initialize karein
const app = initializeApp(firebaseConfig);

// Zaroori Firebase services ko export karein
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app); 
export const storage = getStorage(app); // <-- NAYA: Storage ko initialize aur export kiya gaya hai