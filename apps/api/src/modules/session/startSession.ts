import { randomUUID } from "crypto";
import { db } from "../../lib/firebase";
import { startSessionSchema } from "./schema";

export async function startSession(body: unknown) {
  const data = startSessionSchema.parse(body);
  const sessionId = randomUUID();

  if (db) {
    await db.collection("sessions").doc(sessionId).set({
      ...data,
      createdAt: new Date(),
      status: "active",
    });
  }

  return { sessionId, token: sessionId };
}
