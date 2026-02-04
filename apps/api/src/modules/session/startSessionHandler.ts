import { z } from "zod";
import { getDb, admin } from "../../lib/firebaseAdmin";
import { startSession } from "./startSession";

const Body = z.object({
  tenantId: z.string().min(2),
  name: z.string().optional(),
  phone: z.string().optional(),
  language: z.string().optional(),
});

export async function startSessionHandler(req: any, reply: any) {
  try {
    const body = Body.parse(req.body);

    const result = await startSession(body);

    const db = getDb();
    const now = admin.firestore.FieldValue.serverTimestamp();

    await db.doc(`tenants/${body.tenantId}/sessions/${result.sessionId}`).set(
      {
        sessionId: result.sessionId,
        tenantId: body.tenantId,
        name: body.name ?? "",
        phone: body.phone ?? "",
        language: body.language ?? "",
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    await db.doc(`tenants/${body.tenantId}/stats/main`).set(
      {
        sessionsCount: admin.firestore.FieldValue.increment(1),
        updatedAt: now,
      },
      { merge: true }
    );

    return reply.send(result);
  } catch (err: any) {
    return reply.status(400).send({ error: err?.message ?? "Bad Request" });
  }
}
