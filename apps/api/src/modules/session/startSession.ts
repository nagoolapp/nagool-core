import { randomUUID } from "crypto";
import { StartSessionBodySchema } from "./schema";
import { store } from "../chat/store";

export async function startSession(body: unknown) {
  const parsed = StartSessionBodySchema.safeParse(body);
  if (!parsed.success) {
    // Keep same style you already had: array json in error string
    throw new Error(JSON.stringify(parsed.error.issues, null, 2));
  }

  const data = parsed.data;
  const sessionId = randomUUID();

  // Persist for chat
  store.createSession({
    sessionId,
    tenantId: data.tenantId,
    name: data.name,
    phone: data.phone,
    language: data.language,
    countryCode: data.countryCode,
  });

  const greeting = `هلا ${data.name} 👋 أنا نقول. قلّي شتحتاج وبساعدك فوراً.`;

  return {
    sessionId,
    token: sessionId,
    greeting,
    language: data.language,
  };
}
