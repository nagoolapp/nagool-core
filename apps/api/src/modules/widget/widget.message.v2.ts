import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { getDocJson, addDoc } from "../../lib/firestoreAdmin";
import { buildSystemPrompt } from "../../lib/promptBuilder";
import { createLead } from "../leads/createLead";
import { checkAndIncDailyMessageLimit } from "../limits/checkLimit";

/**
 * ✅ Secure widget messaging
 * POST /v1/widget/message
 * Body: { sessionToken, message }
 *
 * Rules:
 * - tenantId is derived from session (never from body)
 * - prompt built server-side
 * - rate/limits enforced
 */
const BodySchema = z.object({
  sessionToken: z.string().min(1),
  message: z.string().min(1),
});

function shouldCreateLead(text: string) {
  const s = text.toLowerCase();
  const keys = ["price","buy","order","contact","whatsapp","call","quote","قیمت","خرید","تماس","واتساپ"];
  return keys.some(k => s.includes(k));
}

export const widgetMessageRoutesV2: FastifyPluginAsync = async (app) => {
  app.post("/v1/widget/message", async (req, reply) => {
    const body = BodySchema.parse(req.body ?? {});
    const sessionToken = body.sessionToken;

    // lookup session -> tenantId
    // MVP approach: sessions are stored under tenants/{tenantId}/sessions/{sessionId}
    // We therefore store a reverse index: sessionIndex/{sessionId} -> tenantId when session is created.
    const idx = await getDocJson(`sessionIndex/${sessionToken}`);
    if (!idx?.tenantId) return reply.code(401).send({ ok: false, error: "INVALID_SESSION" });

    const tenantId = String(idx.tenantId);

    // load session doc
    const session = await getDocJson(`tenants/${tenantId}/sessions/${sessionToken}`);
    if (!session || session.status !== "active") return reply.code(401).send({ ok: false, error: "INVALID_SESSION" });

    // enforce origin allowlist (match stored origin or allowed list logic)
    const origin = String(req.headers.origin ?? "");
    if (session.origin && origin && String(session.origin) !== origin) {
      return reply.code(403).send({ ok: false, error: "ORIGIN_MISMATCH" });
    }

    // limits (daily)
    const lim = await checkAndIncDailyMessageLimit(tenantId);
    if (!lim.ok) return reply.code(429).send({ ok: false, error: "LIMIT_REACHED", max: lim.max, used: lim.used });

    // build prompt server-side
    await buildSystemPrompt(tenantId);

    // Phase 5 Stub response (OpenAI wiring later)
    const assistantText = `✅ (Widget Stub) "${body.message}"`;

    // Persist message under tenant
    const messageId = await addDoc(`tenants/${tenantId}/messages`, {
      createdAt: new Date().toISOString(),
      source: "widget",
      sessionId: sessionToken,
      user: { text: body.message },
      assistant: { text: assistantText },
    });

    // lead capture (simple)
    if (shouldCreateLead(body.message)) {
      await createLead(tenantId, { source: "widget", message: body.message, contact: session.user ?? {} });
    }

    return reply.send({ ok: true, messageId, assistant: { text: assistantText } });
  });
};
