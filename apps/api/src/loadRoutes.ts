import type { FastifyInstance } from "fastify";
import fs from "fs";
import path from "path";

export async function loadRoutes(app: FastifyInstance) {
  const modulesDir = path.join(__dirname, "modules");

  if (!fs.existsSync(modulesDir)) return;

  const modules = fs.readdirSync(modulesDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const mod of modules) {
    const js = path.join(modulesDir, mod, "routes.js");
    const ts = path.join(modulesDir, mod, "routes.ts");

    const target = fs.existsSync(js) ? js : fs.existsSync(ts) ? ts : null;
    if (!target) continue;

    try {
      const routes = await import(target);
      if (routes?.default) {
        app.register(routes.default);
        app.log.info(`✅ Auto-loaded routes: ${mod}`);
      }
    } catch (err) {
      app.log.error(err, `❌ Failed loading routes: ${mod}`);
    }
  }
}
