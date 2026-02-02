import { FastifyInstance } from "fastify";
import { resolveTenantIdByWidgetKey } from "./widget.keys";

function getApiOrigin(req: any) {
  const host =
    req.headers["x-forwarded-host"] ||
    req.headers["host"];

  const proto =
    (req.headers["x-forwarded-proto"] as string) ||
    (req.protocol as string) ||
    "http";

  return `${proto}://${host}`;
}

export function widgetEmbedRoutes(app: FastifyInstance) {
  app.get("/v1/widget/embed", async (req, reply) => {
    const { widgetKey } = (req.query as any) ?? {};

    if (!widgetKey || typeof widgetKey !== "string") {
      return reply.status(400).send({ error: "widgetKey is required" });
    }

    const tenantId = resolveTenantIdByWidgetKey(widgetKey);
    if (!tenantId) {
      return reply.status(403).send({ error: "invalid widgetKey" });
    }

    const apiOrigin = getApiOrigin(req);

    const html =
      `<script src="${apiOrigin}/widget.js?v=4" ` +
      `data-nagool-api="${apiOrigin}" ` +
      `data-nagool-key="${widgetKey}"></script>`;

    return reply.send({
      ok: true,
      tenantId,
      widgetKey,
      apiOrigin,
      html,
    });
  });
}
