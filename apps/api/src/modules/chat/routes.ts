import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { buildSystemPrompt } from "../../lib/promptBuilder";
import { addDoc } from "../../lib/firestoreAdmin";
import { createLead } from "../leads/createLead";
import { trackUsage } from "../stats/trackUsage";
import { checkAndIncDailyMessageLimit } from "../limits/checkLimit";

const BodySchema = z.object({
  message: z.string().min(1),
  });

function shouldCreateLead(text: string, triggerKeywords: string[]) {
  const s = text.toLowerCase();
  const defaults = [
    "price","buy","order","contact","whatsapp","call","quote",
    "قیمت","خرید","تماس","واتساپ"
  ];
  const keys = [...new Set([...defaults, ...(triggerKeywords ?? [])])];
  return keys.some((k) => k && s.includes(k.toLowerCase()));
}

function isPromptInjectionAttempt(text: string) {
  const s = text.toLowerCase();
  return (
    s.includes("system prompt") ||
    s.includes("developer message") ||
    s.includes("ignore previous") ||
    s.includes("reveal") && s.includes("instructions") ||
    s.includes("override") && (s.includes("rule") || s.includes("policy"))
  );
}

/**
 * Named export (usable if you prefer direct call).
 */
export async function registerChatRoutes(app: FastifyInstance) {
  app.post("/chat/message", async (req, reply) => {
    const body = BodySchema.parse(req.body ?? {});
    const headerTenant = (req.headers["x-tenant-id"] as string | undefined) ?? undefined;

    const tenantId = headerTenant;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "TENANT_REQUIRED" });

    const lim = await checkAndIncDailyMessageLimit(tenantId);
    if (!lim.ok) {
      return reply.code(429).send({ ok: false, error: "LIMIT_REACHED", max: lim.max, used: lim.used });
    }

    const { config } = await buildSystemPrompt(tenantId);

    // Phase 4 Stub: pipeline+storage+lead+stats proof (OpenAI wiring comes next)
    const assistantText = `✅ (Phase4 Stub) "${body.message}"`;

    const injection = isPromptInjectionAttempt(body.message);

    const msgId = await addDoc(`tenants/${tenantId}/messages`, {
      createdAt: new Date().toISOString(),
      user: { text: body.message },
      assistant: { text: assistantText },
      source: "api",
    });

    if (config.leadCapture.enabled && shouldCreateLead(body.message, config.leadCapture.triggerKeywords)) {
      await createLead(tenantId, { source: "api", message: body.message });
    }

    await trackUsage(tenantId, { messagesInc: 1, tokensInc: 0 });

    return reply.send({ ok: true, messageId: msgId, assistant: { text: assistantText } });
  });
}

/**
 * ✅ Default export = Fastify plugin
 * This fixes: "Plugin must be a function ... Received undefined"
 */
const chatRoutes: FastifyPluginAsync = async (app) => {
  await registerChatRoutes(app);
};

export default chatRoutes;
