// firebase.js or firebase.ts
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import admin from 'firebase-admin';

const firebaseConfig = {
  "projectId": "buildora-cq4sb",
  "appId": "1:781630668768:web:f8fb8a203896a24c26f585",
  "storageBucket": "buildora-cq4sb.firebasestorage.app",
  "apiKey": "AIzaSyAQkxZr8X8xQZwDMxYLRu1b47AZlcvmhVs",
  "authDomain": "buildora-cq4sb.firebaseapp.com",
  "messagingSenderId": "781630668768"
};

// Initialize Firebase for the client
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);


// Initialize Firebase Admin SDK for the server-side (API routes)
// This requires service account credentials.
// IMPORTANT: Ensure the service account JSON is not publicly exposed.
// We will use environment variables for this.

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

if (serviceAccount && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized.");
  } catch (error) {
    console.error("Firebase Admin SDK initialization error:", error);
  }
}

export const adminDb = admin.apps.length ? admin.firestore() : null;
