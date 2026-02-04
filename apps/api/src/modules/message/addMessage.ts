import { z } from "zod";
import { getDb, admin } from "../../lib/firebaseAdmin";

const Body = z.object({
  tenantId: z.string().min(2),
  sessionId: z.string().min(10),
  role: z.enum(["user", "assistant", "system"]),
  text: z.string().min(1),
});

export async function addMessage(req: any, reply: any) {
  try {
    const body = Body.parse(req.body);
    const db = getDb();
    const now = admin.firestore.FieldValue.serverTimestamp();

    const sessionRef = db.doc(`tenants/${body.tenantId}/sessions/${body.sessionId}`);
    const sessionSnap = await sessionRef.get();

    const s = sessionSnap.exists ? sessionSnap.data() : null;
    const isRealSession = !!s && s.status === "active" && !!s.createdAt;

    if (!isRealSession) {
      return reply.status(400).send({ error: "Invalid sessionId (real session not found)" });
    }

    const ref = await db.collection(`tenants/${body.tenantId}/messages`).add({
      tenantId: body.tenantId,
      sessionId: body.sessionId,
      role: body.role,
      text: body.text,
      createdAt: now,
    });

    await sessionRef.set({ updatedAt: now }, { merge: true });

    await db.doc(`tenants/${body.tenantId}/stats/main`).set(
      {
        messagesCount: admin.firestore.FieldValue.increment(1),
        updatedAt: now,
      },
      { merge: true }
    );

    return reply.send({ ok: true, id: ref.id });
  } catch (err: any) {
    return reply.status(400).send({ error: err?.message ?? "Bad Request" });
  }
}
