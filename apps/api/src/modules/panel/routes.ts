import { z } from "zod";
import { authGuard } from "../../lib/authGuard";
import { getDb, admin } from "../../lib/firebaseAdmin";

const AddMessageBody = z.object({
  sessionId: z.string().min(10),
  role: z.enum(["user", "assistant", "system"]),
  text: z.string().min(1),
});

const CreateLeadBody = z.object({
  sessionId: z.string().min(10).optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  note: z.string().optional(),
});

export default async function panelRoutes(app: any) {
  app.post("/panel/messages", { preHandler: authGuard }, async (req: any, reply: any) => {
    const body = AddMessageBody.parse(req.body);
    const tenantId = req.user.tenantId;

    const db = getDb();
    const now = admin.firestore.FieldValue.serverTimestamp();

    const sessionRef = db.doc(`tenants/${tenantId}/sessions/${body.sessionId}`);
    const sessionSnap = await sessionRef.get();

    const s = sessionSnap.exists ? sessionSnap.data() : null;
    const isRealSession = !!s && s.status === "active" && !!s.createdAt;
    if (!isRealSession) return reply.status(400).send({ error: "Invalid sessionId (real session not found)" });

    const ref = await db.collection(`tenants/${tenantId}/messages`).add({
      tenantId,
      sessionId: body.sessionId,
      role: body.role,
      text: body.text,
      createdAt: now,
    });

    await sessionRef.set({ updatedAt: now }, { merge: true });

    await db.doc(`tenants/${tenantId}/stats/main`).set(
      { messagesCount: admin.firestore.FieldValue.increment(1), updatedAt: now },
      { merge: true }
    );

    return reply.send({ ok: true, id: ref.id });
  });

  app.post("/panel/leads", { preHandler: authGuard }, async (req: any, reply: any) => {
    const body = CreateLeadBody.parse(req.body);
    const tenantId = req.user.tenantId;

    const db = getDb();
    const now = admin.firestore.FieldValue.serverTimestamp();

    if (body.sessionId) {
      const sessionSnap = await db.doc(`tenants/${tenantId}/sessions/${body.sessionId}`).get();
      const s = sessionSnap.exists ? sessionSnap.data() : null;
      const isRealSession = !!s && s.status === "active" && !!s.createdAt;
      if (!isRealSession) return reply.status(400).send({ error: "Invalid sessionId (real session not found)" });
    }

    const ref = await db.collection(`tenants/${tenantId}/leads`).add({
      tenantId,
      sessionId: body.sessionId ?? "",
      name: body.name ?? "",
      phone: body.phone ?? "",
      email: body.email ?? "",
      note: body.note ?? "",
      status: "new",
      createdAt: now,
    });

    await db.doc(`tenants/${tenantId}/stats/main`).set(
      { leadsCount: admin.firestore.FieldValue.increment(1), updatedAt: now },
      { merge: true }
    );

    return reply.send({ ok: true, id: ref.id });
  });
}
