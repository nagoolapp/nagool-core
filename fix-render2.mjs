import fs from "fs";
import path from "path";

const root = process.cwd();
const rootPkgPath = path.join(root, "package.json");
const apiTsconfigPath = path.join(root, "apps", "api", "tsconfig.json");
const serverPath = path.join(root, "apps", "api", "src", "server.ts");

function readJson(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }
function writeJson(p, obj) { fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8"); }

if (!fs.existsSync(rootPkgPath)) {
  console.error("❌ package.json not found at repo root");
  process.exit(1);
}

const pkg = readJson(rootPkgPath);
pkg.scripts ||= {};
pkg.devDependencies ||= {};

// Ensure TS tooling exists (safe)
pkg.devDependencies.typescript ||= "^5.6.0";
pkg.devDependencies["@types/node"] ||= "^20.0.0";

// ✅ Add API scripts on ROOT package.json (since apps/api has no package.json)
pkg.scripts["build:api"] ||= "tsc -p apps/api/tsconfig.json";
pkg.scripts["start:api"] ||= "node apps/api/dist/server.js";

// Optional convenience (won't override if exists)
pkg.scripts.build ||= pkg.scripts.build || "npm run build:api";
pkg.scripts.start ||= pkg.scripts.start || "npm run start:api";

writeJson(rootPkgPath, pkg);
console.log("✅ Patched root package.json (build:api / start:api)");

// ✅ Ensure apps/api/tsconfig.json exists and outputs to apps/api/dist
if (!fs.existsSync(apiTsconfigPath)) {
  const tsconfig = {
    compilerOptions: {
      outDir: "dist",
      rootDir: "src",
      target: "ES2020",
      module: "commonjs",
      moduleResolution: "node",
      esModuleInterop: true,
      strict: false,
      skipLibCheck: true
    },
    include: ["src/**/*.ts"]
  };
  fs.mkdirSync(path.dirname(apiTsconfigPath), { recursive: true });
  fs.writeFileSync(apiTsconfigPath, JSON.stringify(tsconfig, null, 2) + "\n", "utf8");
  console.log("✅ Created apps/api/tsconfig.json");
} else {
  const ts = readJson(apiTsconfigPath);
  ts.compilerOptions ||= {};
  ts.compilerOptions.outDir ||= "dist";
  ts.compilerOptions.rootDir ||= "src";
  ts.compilerOptions.module ||= "commonjs";
  ts.compilerOptions.moduleResolution ||= "node";
  ts.compilerOptions.esModuleInterop ??= true;
  ts.include ||= ["src/**/*.ts"];
  writeJson(apiTsconfigPath, ts);
  console.log("✅ Patched apps/api/tsconfig.json");
}

// ✅ Patch server listen for Render (PORT + 0.0.0.0) best-effort
if (fs.existsSync(serverPath)) {
  let s = fs.readFileSync(serverPath, "utf8");

  // Insert port const if missing
  if (!/\bconst\s+port\s*=\s*Number\(process\.env\.PORT/.test(s)) {
    const importBlock = s.match(/^(?:import .*;\s*\n)+/m);
    const idx = importBlock ? importBlock[0].length : 0;
    s = s.slice(0, idx) + `const port = Number(process.env.PORT || 3001);\n` + s.slice(idx);
  }

  // Replace common listen variants to include host + port
  if (!s.includes('host: "0.0.0.0"') && !s.includes("host: '0.0.0.0'")) {
    // Replace app.listen({ ... })
    s = s.replace(/app\.listen\(\s*{([^}]*)}\s*\)/g, (full, inside) => {
      let inside2 = inside;
      if (/\bport\s*:/.test(inside2)) inside2 = inside2.replace(/\bport\s*:\s*[^,}]+/, "port: port");
      else inside2 = `port: port, ${inside2}`.trim();

      if (/\bhost\s*:/.test(inside2)) inside2 = inside2.replace(/\bhost\s*:\s*["'][^"']+["']/, 'host: "0.0.0.0"');
      else inside2 = `${inside2}, host: "0.0.0.0"`;

      return `app.listen({ ${inside2} })`;
    });

    // Replace app.listen(3001)
    s = s.replace(/app\.listen\(\s*\d+\s*\)/g, `app.listen({ port: port, host: "0.0.0.0" })`);
  }

  fs.writeFileSync(serverPath, s, "utf8");
  console.log('✅ Patched apps/api/src/server.ts for Render listen');
} else {
  console.warn("⚠️ server.ts not found at apps/api/src/server.ts (skip listen patch)");
}

console.log("\n✅ NEXT: local test");
console.log("npm ci && npm run build:api && npm run start:api");
