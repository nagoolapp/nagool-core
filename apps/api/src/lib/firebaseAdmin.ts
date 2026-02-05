import admin from "firebase-admin";

function mustGet(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function getDb() {
  if (!admin.apps.length) {
    const projectId = mustGet("FIREBASE_PROJECT_ID");
    const clientEmail = mustGet("FIREBASE_CLIENT_EMAIL");
    const privateKey = mustGet("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
  return admin.firestore();
}

export { admin };
