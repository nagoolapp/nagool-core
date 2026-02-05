import { resolveWidgetKey } from "../widgetKeys/service";

/**
 * Guard for public widget endpoints.
 * - Enforces allowedOrigins based on widgetKey
 * - Returns { tenantId } if ok
 */
export async function guardWidgetOrigin(req: any, reply: any, widgetKey: string) {
  const resolved: any = await resolveWidgetKey(widgetKey);

  if (!resolved) {
    reply.code(404).send({ ok: false, error: "WIDGET_KEY_NOT_FOUND" });
    return null;
  }
  if (resolved.status !== "active") {
    reply.code(403).send({ ok: false, error: "WIDGET_KEY_DISABLED" });
    return null;
  }

  const origin = String(req.headers.origin ?? "");
  const allowedOrigins: string[] = Array.isArray(resolved.allowedOrigins) ? resolved.allowedOrigins : ["*"];
  const allowAll = allowedOrigins.includes("*");
  const originOk = allowAll || (origin && allowedOrigins.includes(origin));

  if (!originOk) {
    reply.code(403).send({ ok: false, error: "ORIGIN_NOT_ALLOWED", origin, allowedOrigins });
    return null;
  }

  return { tenantId: String(resolved.tenantId), allowedOrigins };
}
