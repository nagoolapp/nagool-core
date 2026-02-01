import type { FastifyInstance } from "fastify";

function makeWidgetKey(tenantId: string) {
  // MVP: deterministic key. Later: store random key in DB
  return `pub_${tenantId}`;
}

export function widgetEmbedRoutes(app: FastifyInstance) {
  // returns ready-to-copy HTML snippet
  app.get("/v1/widget/embed", async (req, reply) => {
    const { tenantId } = (req.query as any) ?? {};
    if (!tenantId || typeof tenantId !== "string") {
      return reply.status(400).send({ error: "tenantId is required" });
    }

    const widgetKey = makeWidgetKey(tenantId);

    // same-origin: widget.js is served from this API domain
    const html = `<script src="${req.protocol}://${req.hostname}/widget.js" data-nagool-key="${widgetKey}" async></script>`;

    return reply.send({
      ok: true,
      tenantId,
      widgetKey,
      html,
    });
  });
}
