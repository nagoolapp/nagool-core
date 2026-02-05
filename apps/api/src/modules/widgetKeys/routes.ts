import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { createWidgetKey, writeWidgetKeyIndex, resolveWidgetKey } from "./service";

/**
 * Phase 5 MVP:
 * - internal routes (later: behind panel JWT)
 */
const CreateSchema = z.object({
  tenantId: z.string().min(1),
  allowedOrigins: z.array(z.string()).optional(),
});

const ResolveSchema = z.object({
  widgetKey: z.string().min(1),
});

const widgetKeyRoutes: FastifyPluginAsync = async (app) => {
  app.post("/widget-keys/create", async (req, reply) => {
    const body = CreateSchema.parse(req.body ?? {});
    const res = await createWidgetKey(body.tenantId, {
      allowedOrigins: body.allowedOrigins ?? ["*"],
      status: "active",
    });
    await writeWidgetKeyIndex(res.widgetKey, body.tenantId);
    return reply.send({ ok: true, ...res });
  });

  // server-side resolve (used by widget bootstrap/session)
  app.post("/widget-keys/resolve", async (req, reply) => {
    const body = ResolveSchema.parse(req.body ?? {});
    const res = await resolveWidgetKey(body.widgetKey);
    if (!res) return reply.code(404).send({ ok: false, error: "WIDGET_KEY_NOT_FOUND" });
    if (res.status !== "active") return reply.code(403).send({ ok: false, error: "WIDGET_KEY_DISABLED" });
    return reply.send({ ok: true, tenantId: res.tenantId, status: res.status, allowedOrigins: res.allowedOrigins ?? ["*"] });
  });
};

export default widgetKeyRoutes;
