import { z } from "zod";
import { getDb, admin } from "../../lib/firebaseAdmin";

const Body = z.object({
  tenantId: z.string().min(2),
  name: z.string().min(2),
  industry: z.string().optional(),
  city: z.string().optional(),
  plan: z.enum(["trial", "basic", "pro"]).default("trial"),
});

export async function createTenant(req: any, reply: any) {
  const body = Body.parse(req.body);

  const db = getDb();
  const now = admin.firestore.FieldValue.serverTimestamp();

  // tenants/{tenantId}
  await db.doc(`tenants/${body.tenantId}`).set(
    {
      name: body.name,
      industry: body.industry ?? "",
      city: body.city ?? "",
      plan: body.plan,
      limits: {},
      createdAt: now,
    },
    { merge: true }
  );

  // tenants/{tenantId}/config/main
  await db.doc(`tenants/${body.tenantId}/config/main`).set(
    {
      tone: "friendly",
      language: "ar-OM",
      rules: [],
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  );

  return reply.send({ ok: true, tenantId: body.tenantId });
}
