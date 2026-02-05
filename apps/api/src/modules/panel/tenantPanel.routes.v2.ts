import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { authGuard } from "../../lib/authGuard";
import { getDocJson, setDocMerge, addDoc } from "../../lib/firestoreAdmin";
import { buildSystemPrompt } from "../../lib/promptBuilder";
import { createWidgetKey, writeWidgetKeyIndex } from "../widgetKeys/service";

/**
 * PANEL v2 (JWT required)
 * tenantId MUST come from JWT only (req.user.tenantId)
 */
const UpdateConfigSchema = z.object({
  business: z
    .object({
      name: z.string().optional(),
      industry: z.string().optional(),
      city: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
  tone: z.string().optional(),
  rules: z
    .object({
      system: z.array(z.string()).optional(),
      do: z.array(z.string()).optional(),
      dont: z.array(z.string()).optional(),
    })
    .optional(),
  leadCapture: z
    .object({
      enabled: z.boolean().optional(),
      triggerKeywords: z.array(z.string()).optional(),
      method: z.enum(["whatsapp", "form", "phone"]).optional(),
      target: z.string().optional(),
    })
    .optional(),
});

const ChatTestSchema = z.object({
  message: z.string().min(1),
});

const CreateKeySchema = z.object({
  allowedOrigins: z.array(z.string()).min(1),
});

export const tenantPanelRoutesV2: FastifyPluginAsync = async (app) => {
  // ✅ all panel endpoints behind JWT
  app.addHook("preHandler", authGuard);

  const tenantIdFromJwt = (req: any) => {
    const t = req?.user?.tenantId;
    if (!t) throw new Error("TENANT_CONTEXT_MISSING");
    return String(t);
  };

  app.get("/panel/config", async (req, reply) => {
    const tenantId = tenantIdFromJwt(req);
    const cfg = (await getDocJson(`tenants/${tenantId}/config/main`)) ?? {};
    return reply.send({ ok: true, config: cfg });
  });

  app.patch("/panel/config", async (req, reply) => {
    const tenantId = tenantIdFromJwt(req);
    const body = UpdateConfigSchema.parse(req.body ?? {});
    await setDocMerge(`tenants/${tenantId}/config/main`, body as any);
    return reply.send({ ok: true });
  });

  app.get("/panel/stats", async (req, reply) => {
    const tenantId = tenantIdFromJwt(req);
    const stats = (await getDocJson(`tenants/${tenantId}/stats/main`)) ?? {};
    return reply.send({ ok: true, stats });
  });

  app.get("/panel/leads", async (req, reply) => {
    const tenantId = tenantIdFromJwt(req);
    const leadsIndex = (await getDocJson(`tenants/${tenantId}/leadsIndex/main`)) ?? { items: [] };
    return reply.send({ ok: true, leads: leadsIndex.items ?? [] });
  });

  app.post("/panel/chat-test", async (req, reply) => {
    const tenantId = tenantIdFromJwt(req);
    const body = ChatTestSchema.parse(req.body ?? {});
    await buildSystemPrompt(tenantId);

    const assistantText = `✅ (Panel Stub) "${body.message}"`;

    await addDoc(`tenants/${tenantId}/messages`, {
      createdAt: new Date().toISOString(),
      source: "panel",
      user: { text: body.message },
      assistant: { text: assistantText },
    });

    return reply.send({ ok: true, assistant: { text: assistantText } });
  });

  app.post("/panel/widget-keys", async (req, reply) => {
    const tenantId = tenantIdFromJwt(req);
    const body = CreateKeySchema.parse(req.body ?? {});
    const res = await createWidgetKey(tenantId, { allowedOrigins: body.allowedOrigins, status: "active" });
    await writeWidgetKeyIndex(res.widgetKey, tenantId);
    return reply.send({ ok: true, ...res });
  });
};
