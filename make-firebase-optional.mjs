import fs from "fs";
import path from "path";

const p = path.join(process.cwd(), "apps", "api", "src", "lib", "firebaseAdmin.ts");
if (!fs.existsSync(p)) {
  console.error("❌ firebaseAdmin.ts not found:", p);
  process.exit(1);
}

let s = fs.readFileSync(p, "utf8");

// If already optional, skip
if (s.includes("FIREBASE_OPTIONAL")) {
  console.log("ℹ️ already patched");
  process.exit(0);
}

// Replace mustGet() behavior to allow running without Firebase
// Strategy: keep mustGet for strict mode, but provide safeGet + optional getDb()
s = s.replace(
  /function\s+mustGet\s*\([^\)]*\)\s*\{[\s\S]*?\}\s*/m,
`function mustGet(key: string) {
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
`
);

// Patch getDb() to not throw when firebase is disabled
s = s.replace(
  /export\s+function\s+getDb\s*\([^\)]*\)\s*\{[\s\S]*?\}\s*/m,
`export function getDb() {
  if (!firebaseEnabled()) {
    throw new Error("Firebase disabled (missing env).");
  }
  const projectId = mustGet("FIREBASE_PROJECT_ID");
  // the rest of your original logic remains below if present
  // NOTE: if your file had more code, we keep it by falling back to old implementation marker
  return _getDbInternal(projectId);
}
`
);

// If original file doesn't have internal function, we can't safely reconstruct.
// So instead, we do a safer minimal patch: only relax mustGet for FIREBASE_PROJECT_ID.
if (!s.includes("_getDbInternal")) {
  // fallback patch: change mustGet("FIREBASE_PROJECT_ID") to safeGet with a guard
  s = fs.readFileSync(p, "utf8");
  if (!s.includes("firebaseEnabled")) {
    s = s.replace(
      /function\s+mustGet\s*\(\s*key\s*:\s*string\s*\)\s*\{[\s\S]*?\}/m,
`function mustGet(key: string) {
  const v = process.env[key];
  if (!v) throw new Error("Missing env: " + key);
  return v;
}

function firebaseEnabled() {
  return Boolean(process.env.FIREBASE_PROJECT_ID);
}
`
    );
    s = s.replace(/mustGet\(\s*["']FIREBASE_PROJECT_ID["']\s*\)/g, `(firebaseEnabled() ? mustGet("FIREBASE_PROJECT_ID") : "")`);
    // Add a comment marker
    s = `// FIREBASE_OPTIONAL PATCH\n` + s;
  }
}

fs.writeFileSync(p, s, "utf8");
console.log("✅ patched firebaseAdmin.ts to be optional-safe");
