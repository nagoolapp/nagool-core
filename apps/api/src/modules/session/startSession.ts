import { randomUUID } from "crypto";
import { db } from "../../lib/firebase";
import { startSessionSchema } from "./schema";

function makeGreeting(language: string, name: string) {
  const safeName = (name || "").trim() || "friend";

  if (language === "ar-OM" || language === "ar") {
    return `هلا ${safeName} 👋 أنا نقول. قلّي شتحتاج وبساعدك فوراً.`;
  }
  if (language === "fa") {
    return `سلام ${safeName} 👋 من نقول هستم. بگو دقیقاً چی می‌خوای تا سریع راهنمایی‌ت کنم.`;
  }
  return `Hi ${safeName} 👋 I'm Nagool. Tell me what you need and I'll help you right away.`;
}

export async function startSession(body: unknown) {
  const data = startSessionSchema.parse(body);
  const sessionId = randomUUID();

  const fullPhone = `${data.countryCode}${data.phone}`;
  const greeting = makeGreeting(data.language, data.name);
  const now = new Date();

  if (db) {
    await db.collection("sessions").doc(sessionId).set({
      tenantId: data.tenantId,
      name: data.name,
      phone: fullPhone,
      email: data.email ?? null,
      language: data.language,
      createdAt: now,
      status: "active",
    });

    await db.collection("leads").doc(sessionId).set({
      tenantId: data.tenantId,
      name: data.name,
      phone: fullPhone,
      email: data.email ?? null,
      language: data.language,
      createdAt: now,
      source: "widget",
    });
  }

  return {
    sessionId,
    token: sessionId,
    greeting,
    language: data.language,
  };
}
