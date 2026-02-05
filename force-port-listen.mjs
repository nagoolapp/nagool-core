import fs from "fs";
import path from "path";

const p = path.join(process.cwd(), "apps", "api", "src", "server.ts");
if (!fs.existsSync(p)) { console.error("❌ not found:", p); process.exit(1); }

let s = fs.readFileSync(p, "utf8");

// ensure port const exists
if (!/\bconst\s+port\s*=/.test(s)) {
  const importBlock = s.match(/^(?:import .*;\s*\n)+/m);
  const idx = importBlock ? importBlock[0].length : 0;
  s = s.slice(0, idx) + `const port = Number(process.env.PORT || 3001);\n` + s.slice(idx);
}

// FORCE replace common listen patterns to always use port + 0.0.0.0
// (covers Fastify listen variants)
s = s.replace(/app\.listen\(\s*\d+\s*\)/g, 'app.listen({ port, host: "0.0.0.0" })');
s = s.replace(/app\.listen\(\s*{[^}]*}\s*\)/g, (m) => {
  // rewrite to canonical call (safe for Render)
  return 'app.listen({ port, host: "0.0.0.0" })';
});

// If no app.listen found, we DON'T invent one. Just keep file as-is.
fs.writeFileSync(p, s, "utf8");
console.log("✅ Patched server.ts (forced listen to use process.env.PORT via const port)");
