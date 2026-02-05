import fs from "fs";
import path from "path";

const serverPath = path.join(process.cwd(), "apps", "api", "src", "server.ts");
const pkgPath = path.join(process.cwd(), "package.json");

function readJson(p){ return JSON.parse(fs.readFileSync(p,"utf8")); }
function writeJson(p,obj){ fs.writeFileSync(p, JSON.stringify(obj,null,2)+"\n","utf8"); }

if (!fs.existsSync(serverPath)) {
  console.error("❌ server.ts not found:", serverPath);
  process.exit(1);
}

let s = fs.readFileSync(serverPath, "utf8");

// ✅ Repair the exact broken pattern you have
s = s.replace(
  /import\s+Fastify\s+from\s+"fastifyconst port = Number\(process\.env\.PORT \|\| 3001\);\s*\n\s*";\s*\n?/g,
  'import Fastify from "fastify";\n'
);

// ✅ Ensure we have `const port = ...` on its own line AFTER imports
if (!/\bconst\s+port\s*=\s*Number\(process\.env\.PORT\s*\|\|\s*3001\);/.test(s)) {
  // find end of import block (lines starting with import ...)
  const lines = s.split("\n");
  let insertAt = 0;
  while (insertAt < lines.length && lines[insertAt].trim().startsWith("import ")) insertAt++;
  lines.splice(insertAt, 0, "const port = Number(process.env.PORT || 3001);");
  s = lines.join("\n");
}

// ✅ Ensure listen uses 0.0.0.0 (best-effort, non-destructive)
if (!s.includes('host: "0.0.0.0"') && !s.includes("host: '0.0.0.0'")) {
  // Replace simple listen(port) patterns
  s = s.replace(/app\.listen\(\s*port\s*\)/g, 'app.listen({ port, host: "0.0.0.0" })');
  s = s.replace(/app\.listen\(\s*\d+\s*\)/g, 'app.listen({ port, host: "0.0.0.0" })');
}

fs.writeFileSync(serverPath, s, "utf8");
console.log("✅ Fixed apps/api/src/server.ts");

// ✅ Add a production start script that Render can use (without touching your dev start:api)
if (fs.existsSync(pkgPath)) {
  const pkg = readJson(pkgPath);
  pkg.scripts ||= {};
  pkg.scripts["build:api"] ||= "tsc -p apps/api/tsconfig.json";
  pkg.scripts["start:api:prod"] ||= "node apps/api/dist/server.js";
  writeJson(pkgPath, pkg);
  console.log("✅ Ensured scripts: build:api + start:api:prod in root package.json");
}
