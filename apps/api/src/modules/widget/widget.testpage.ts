import type { FastifyInstance } from "fastify";
import fs from "node:fs";
import path from "node:path";

export async function widgetTestPageRoutes(app: FastifyInstance) {
  app.get("/test-widget", async (_req, reply) => {
    const filePath = path.resolve(process.cwd(), "docs/test-widget.html");

    if (!fs.existsSync(filePath)) {
      reply.code(404).send({ error: "Missing docs/test-widget.html" });
      return;
    }

    reply.header("content-type", "text/html; charset=utf-8");
    reply.send(fs.readFileSync(filePath, "utf8"));
  });
}
