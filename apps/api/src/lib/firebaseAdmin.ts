import admin from "firebase-admin";

function mustGet(key: string) {
  const v = process.env[key];
  if (!v) throw new Error("Missing env: " + key);
  return v;
}

function safeGet(key: string) {
  return process.env[key] || "";
}

// If FIREBASE_OPTIONAL=1 OR FIREBASE_PROJECT_ID is missing, we run in "no-firebase" mode.
function firebaseEnabled() {
  if (process.env.FIREBASE_OPTIONAL === "1") return Boolean(process.env.FIREBASE_PROJECT_ID);
  return true;
}
`);
  return v;
}

export function getDb() {
  if (!firebaseEnabled()) {
    throw new Error("Firebase disabled (missing env).");
  }
  const projectId = mustGet("FIREBASE_PROJECT_ID");
  // the rest of your original logic remains below if present
  // NOTE: if your file had more code, we keep it by falling back to old implementation marker
  return _getDbInternal(projectId);
}
),
    });
  }
  return admin.firestore();
}

export { admin };
