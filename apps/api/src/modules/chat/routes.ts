import type { FastifyInstance } from "fastify";
import { ChatMessageBodySchema } from "./schema";
import { store } from "./store";
import { generateReply } from "./openai";

export default async function chatRoutes(app: FastifyInstance) {
  app.post("/chat/message", async (req, reply) => {
    const parsed = ChatMessageBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "VALIDATION_ERROR",
        details: parsed.error.flatten(),
      });
    }

    const { sessionId, text } = parsed.data;

    const session = store.getSession(sessionId);
    if (!session) {
      return reply.status(404).send({
        error: "SESSION_NOT_FOUND",
        message: "Session not found. Start a session first.",
      });
    }

    const tenant = store.getTenant(session.tenantId);
    if (!tenant) {
      return reply.status(400).send({
        error: "TENANT_NOT_FOUND",
        message: "Tenant config missing for this session.",
      });
    }

    // user message
    store.appendMessage(
      sessionId,
      { role: "user", content: text, ts: Date.now() },
      tenant.memoryMaxTurns
    );

    const history = store.getMessages(sessionId);

    let replyText = "";
    try {
      replyText = await generateReply({
        tenant,
        history,
        userText: text,
      });
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      return reply.status(502).send({
        error: "OPENAI_FAILED",
        message: msg,
      });
    }

    // assistant message
    store.appendMessage(
      sessionId,
      { role: "assistant", content: replyText, ts: Date.now() },
      tenant.memoryMaxTurns
    );

    return reply.send({ replyText, sessionId });
  });
}
