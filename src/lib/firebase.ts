// firebase.js or firebase.ts
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  "projectId": "buildora-cq4sb",
  "appId": "1:781630668768:web:f8fb8a203896a24c26f585",
  "storageBucket": "buildora-cq4sb.firebasestorage.app",
  "apiKey": "AIzaSyAQkxZr8X8xQZwDMxYLRu1b47AZlcvmhVs",
  "authDomain": "buildora-cq4sb.firebaseapp.com",
  "messagingSenderId": "781630668768"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const storage = getStorage(app);
