// firebase-admin.ts
import admin from 'firebase-admin';

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
