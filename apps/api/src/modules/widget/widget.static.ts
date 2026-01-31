import path from "node:path";
import fs from "node:fs";
import type { FastifyInstance } from "fastify";

function serveFile(reply: any, filePath: string, contentType: string) {
  if (!fs.existsSync(filePath)) {
    reply.code(404).send({ error: "Not Found" });
    return;
  }

  const data = fs.readFileSync(filePath);
  reply.header("Content-Type", contentType);
  reply.header("Cache-Control", "public, max-age=300"); // 5 min
  reply.send(data);
}

export async function widgetStaticRoutes(app: FastifyInstance) {
  const widgetDir = path.resolve(process.cwd(), "apps/widget");

  app.get("/widget.js", async (_req, reply) => {
    const filePath = path.join(widgetDir, "widget.js");
    serveFile(reply, filePath, "application/javascript; charset=utf-8");
  });

  app.get("/widget.css", async (_req, reply) => {
    const filePath = path.join(widgetDir, "widget.css");
    serveFile(reply, filePath, "text/css; charset=utf-8");
  });
}
