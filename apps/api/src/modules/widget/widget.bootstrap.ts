import { resolveWidgetKey } from "../widgetKeys/service";
import type { FastifyInstance } from "fastify";

export async function widgetBootstrapRoutes(app: FastifyInstance) {
  // Simple bootstrap config: /widget/bootstrap
  app.get("/widget/bootstrap", async (req, reply) => {
    const origin = `${req.protocol}://${req.hostname}`;
    return reply.send({
      ok: true,
      widget: {
        testPage: "/test-widget",
        embedScript: "/widget/embed.js",
      },
      api: {
        baseUrl: origin,
        startSession: "/v1/session/start",
        chatMessage: "/v1/chat/message",
      },
      defaults: {
        tenantId: "demo",
        language: "ar-OM",
        countryCode: "OM",
      }
    });
  });
}
