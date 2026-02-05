import { getDb } from "../../lib/firebaseAdmin";

export default async function getMyWidget(req: any, reply: any) {
  const { tenantId } = req.user;
  const db = getDb();

  const snap = await db
    .collection("widgetKeys")
    .where("tenantId", "==", tenantId)
    .limit(1)
    .get();

  if (snap.empty) {
    return reply.status(404).send({
      ok: false,
      error: "NO_WIDGET_KEY",
    });
  }

  const doc = snap.docs[0];

  return reply.send({
    ok: true,
    widgetKey: doc.data().widgetKey,
  });
}
