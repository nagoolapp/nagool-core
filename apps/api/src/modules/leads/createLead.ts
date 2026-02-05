import { addDoc } from "../../lib/firestoreAdmin";

export async function createLead(tenantId: string, payload: {
  source: "widget" | "panel" | "api";
  message: string;
  contact?: { phone?: string; email?: string; name?: string };
}) {
  const leadId = await addDoc(`tenants/${tenantId}/leads`, {
    ...payload,
    status: "new",
    createdAt: new Date().toISOString(),
  });
  return leadId;
}
