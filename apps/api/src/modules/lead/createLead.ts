import { z } from "zod";
import { getDb, admin } from "../../lib/firebaseAdmin";

const Body = z.object({
  tenantId: z.string().min(2),
  sessionId: z.string().min(10).optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  note: z.string().optional(),
});

export async function createLead(req: any, reply: any) {
  try {
    const body = Body.parse(req.body);
    const db = getDb();
    const now = admin.firestore.FieldValue.serverTimestamp();

    if (body.sessionId) {
      const sessionSnap = await db
        .doc(`tenants/${body.tenantId}/sessions/${body.sessionId}`)
        .get();

      const s = sessionSnap.exists ? sessionSnap.data() : null;
      const isRealSession = !!s && s.status === "active" && !!s.createdAt;

      if (!isRealSession) {
        return reply.status(400).send({ error: "Invalid sessionId (real session not found)" });
      }
    }

    const ref = await db.collection(`tenants/${body.tenantId}/leads`).add({
      tenantId: body.tenantId,
      sessionId: body.sessionId ?? "",
      name: body.name ?? "",
      phone: body.phone ?? "",
      email: body.email ?? "",
      note: body.note ?? "",
      status: "new",
      createdAt: now,
    });

    await db.doc(`tenants/${body.tenantId}/stats/main`).set(
      {
        leadsCount: admin.firestore.FieldValue.increment(1),
        updatedAt: now,
      },
      { merge: true }
    );

    return reply.send({ ok: true, id: ref.id });
  } catch (err: any) {
    return reply.status(400).send({ error: err?.message ?? "Bad Request" });
  }
}
