import admin from "firebase-admin";

const hasFirebaseEnv =
  !!process.env.FIREBASE_PROJECT_ID &&
  !!process.env.FIREBASE_CLIENT_EMAIL &&
  !!process.env.FIREBASE_PRIVATE_KEY;

if (!hasFirebaseEnv) {
  console.warn("[firebase] Missing env vars. Firebase is DISABLED for now.");
}

if (hasFirebaseEnv && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const db = hasFirebaseEnv ? admin.firestore() : null;
