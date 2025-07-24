// firebase.js or firebase.ts
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "API_KEY",
  authDomain: "projectId.firebaseapp.com",
  projectId: "projectId",
  storageBucket: "projectId.appspot.com",
  messagingSenderId: "12345",
  appId: "1:12345:web:67890"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const storage = getStorage(app);
