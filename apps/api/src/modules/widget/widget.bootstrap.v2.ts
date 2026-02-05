import { guardWidgetOrigin } from "./originGuard";
import type { FastifyPluginAsync } from "fastify";
import { getDocJson } from "../../lib/firestoreAdmin";

/**
 * ✅ Public widget bootstrap (SELLABLE MVP)
 * GET /v1/widget/bootstrap?widgetKey=...
 *
 * Rules:
 * - widgetKey only (no tenantId in query/body)
 * - resolve widgetKey -> tenantId server-side
 * - enforce Origin allowlist (if defined)
 * - DO NOT return prompt/rules/business raw config
 */
export const widgetBootstrapRoutesV2: FastifyPluginAsync = async (app) => {
  app.get("/v1/widget/bootstrap", async (req, reply) => {
    const widgetKey = String((req.query as any)?.widgetKey ?? "");
    if (!widgetKey) return reply.code(400).send({ ok: false, error: "WIDGET_KEY_REQUIRED" });

    const g = await guardWidgetOrigin(req, reply, widgetKey);
    if (!g) return;
    const tenantId = g.tenantId;
    const allowedOrigins = g.allowedOrigins;

    // Pull SAFE tenant public fields
    const cfg = (await getDocJson(`tenants/${tenantId}/config/main`)) ?? {};
    const business = cfg.business ?? {};
    const tone = String(cfg.tone ?? "professional");

    // Limits (safe)
    const limits = (await getDocJson(`tenants/${tenantId}/limits/main`)) ?? {};

    return reply.send({
      ok: true,
      widgetKey,
      status: "active",
      allowedOrigins,
      branding: {
        name: business.name ?? "",
        industry: business.industry ?? "",
        city: business.city ?? "",
      },
      ai: {
        tone,
        // ⚠️ do NOT expose rules/prompt
      },
      limits: {
        trialDailyMessages: Number(limits.trialDailyMessages ?? 30),
      },
    });
  });
};
