import { z } from "zod";
import { addDoc, getDocJson, setDocMerge } from "../../lib/firestoreAdmin";

export const WidgetKeySchema = z.object({
  status: z.enum(["active", "disabled"]).default("active"),
  allowedOrigins: z.array(z.string()).default(["*"]),
  createdAt: z.string().optional(),
});

export async function createWidgetKey(tenantId: string, input?: Partial<z.infer<typeof WidgetKeySchema>>) {
  const data = WidgetKeySchema.parse({
    ...input,
    createdAt: new Date().toISOString(),
  });

  // We want widgetKey to be the doc id (human-friendly key).
  // MVP: random doc id
  const id = await addDoc(`tenants/${tenantId}/widgetKeys`, data as any);
  return { widgetKey: id, ...data };
}

export async function resolveWidgetKey(widgetKey: string) {
  // We don't have global index yet, so scan is NOT acceptable.
  // MVP: store reverse index in widgetKeyIndex/{widgetKey} -> tenantId
  const idx = await getDocJson(`widgetKeyIndex/${widgetKey}`);
  if (!idx?.tenantId) return null;

  const tenantId = String(idx.tenantId);
  const keyDoc = await getDocJson(`tenants/${tenantId}/widgetKeys/${widgetKey}`);
  if (!keyDoc) return null;

  return { tenantId, widgetKey, ...keyDoc };
}

export async function writeWidgetKeyIndex(widgetKey: string, tenantId: string) {
  await setDocMerge(`widgetKeyIndex/${widgetKey}`, {
    tenantId,
    createdAt: new Date().toISOString(),
  });
}

export async function disableWidgetKey(tenantId: string, widgetKey: string) {
  await setDocMerge(`tenants/${tenantId}/widgetKeys/${widgetKey}`, { status: "disabled" });
}
