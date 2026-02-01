import "dotenv/config";
import Fastify from "fastify";
import { startSession } from "./modules/session/startSession";
import { widgetStaticRoutes } from "./modules/widget/widget.static";
import { widgetSessionRoutes } from "./modules/widget/widget.session";
import { widgetTestPageRoutes } from "./modules/widget/widget.testpage";
import { widgetEmbedRoutes } from "./modules/widget/widget.embed";
import { widgetBootstrapRoutes } from "./modules/widget/widget.bootstrap";

const app = Fastify({ logger: true });

app.get("/health", async () => ({ ok: true, service: "nagool-api" }));

app.post("/v1/session/start", async (req, reply) => {
  try {
    const result = await startSession(req.body);
    reply.send(result);
  } catch (err: any) {
    reply.status(400).send({ error: err?.message ?? "Bad Request" });
  }
});
app.register(widgetBootstrapRoutes);
app.register(widgetStaticRoutes);
app.register(widgetSessionRoutes);
app.register(widgetTestPageRoutes);
app.register(widgetEmbedRoutes);
app.listen({ port: 3001, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
