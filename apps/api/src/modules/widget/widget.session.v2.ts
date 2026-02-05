import { guardWidgetOrigin } from "./originGuard";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { addDoc, setDocMerge } from "../../lib/firestoreAdmin";
import { buildSystemPrompt } from "../../lib/promptBuilder";

/**
 * ✅ Secure widget session start (SELLABLE MVP)
 * POST /v1/widget/session/start
 * Body: { widgetKey, name?, phone?, language? }
 *
 * Rules:
 * - widgetKey only (no tenantId, no instructions)
 * - tenantId resolved server-side
 * - prompt built server-side
 */
const BodySchema = z.object({
  widgetKey: z.string().min(1),
  name: z.string().optional(),
  phone: z.string().optional(),
  language: z.string().optional(),
});

export const widgetSessionRoutesV2: FastifyPluginAsync = async (app) => {
  app.post("/v1/widget/session/start", async (req, reply) => {
    const body = BodySchema.parse(req.body ?? {});
    const g = await guardWidgetOrigin(req, reply, body.widgetKey);
    if (!g) return;
    const tenantId = g.tenantId;

    // Build prompt server-side (never expose)
    await buildSystemPrompt(tenantId);

    const sessionId = await addDoc(`tenants/${tenantId}/sessions`, {
      createdAt: new Date().toISOString(),
      widgetKey: body.widgetKey,
      origin,
      user: {
        name: body.name ?? "",
        phone: body.phone ?? "",
        language: body.language ?? "",
      },
      status: "active",
    });

    // reverse index for sessionToken -> tenantId
    await setDocMerge(`sessionIndex/${sessionId}`, { tenantId, createdAt: new Date().toISOString() });

    // For fast lookup (optional)
    await setDocMerge(`tenants/${tenantId}/sessions/${sessionId}`, { sessionId });

    // ✅ sessionToken = sessionId (MVP)
    return reply.send({ ok: true, sessionId, sessionToken: sessionId });
  });
};
