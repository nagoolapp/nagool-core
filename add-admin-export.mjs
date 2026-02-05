import fs from "fs";
import path from "path";

const p = path.join(process.cwd(), "apps", "api", "src", "lib", "firebaseAdmin.ts");
if (!fs.existsSync(p)) { console.error("❌ not found:", p); process.exit(1); }

let s = fs.readFileSync(p, "utf8");

// 1) Ensure admin import exists
if (!s.includes('import * as admin from "firebase-admin";') && !s.includes('import * as admin from \'firebase-admin\';')) {
  // add after first import line
  const lines = s.split("\n");
  const firstImportIdx = lines.findIndex(l => l.trim().startsWith("import "));
  const insertAt = firstImportIdx >= 0 ? firstImportIdx + 1 : 0;
  lines.splice(insertAt, 0, 'import * as admin from "firebase-admin";');
  s = lines.join("\n");
}

// 2) Ensure export { admin } at bottom (or just export const adminRef)
if (!/export\s*\{\s*admin\s*\}\s*;?/.test(s) && !/export\s+const\s+admin\b/.test(s)) {
  s += "\n\nexport { admin };\n";
}

fs.writeFileSync(p, s, "utf8");
console.log("✅ Patched firebaseAdmin.ts to export admin");
