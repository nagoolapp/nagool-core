import { cert, getApps, initializeApp } from "firebase-admin/app";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

function mustGet(key: string) {
  const v = process.env[key];
  if (!v) throw new Error("Missing env: " + key);
  return v;
}

function normalizePrivateKey(key: string) {
  // Render env keeps \n, convert to real newlines
  return key.replace(/\\n/g, "\n");
}

function getServiceAccountFromEnv() {
  // Option 1: full JSON in one env var
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      return JSON.parse(json);
    } catch {
      throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON (must be valid JSON)");
    }
  }

  // Option 2: split env vars
  const projectId = mustGet("FIREBASE_PROJECT_ID");
  const clientEmail = mustGet("FIREBASE_CLIENT_EMAIL");
  const privateKey = normalizePrivateKey(mustGet("FIREBASE_PRIVATE_KEY"));

  return { projectId, clientEmail, privateKey };
}

export function ensureFirebase() {
  if (getApps().length) return;
  const sa = getServiceAccountFromEnv();
  initializeApp({ credential: cert(sa as any) });
}

export function getDb() {
  ensureFirebase();
  return getFirestore();
}


export { admin };
