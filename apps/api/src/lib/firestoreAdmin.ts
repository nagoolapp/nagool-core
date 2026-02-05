import admin from "firebase-admin";

function initAdmin() {
  if (admin.apps.length) return;

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export function db() {
  initAdmin();
  return admin.firestore();
}

export async function getDocJson(path: string) {
  const snap = await db().doc(path).get();
  return snap.exists ? snap.data() : null;
}

export async function setDocMerge(path: string, data: Record<string, any>) {
  await db().doc(path).set(data, { merge: true });
}

export async function addDoc(collectionPath: string, data: Record<string, any>) {
  const ref = await db().collection(collectionPath).add(data);
  return ref.id;
}
