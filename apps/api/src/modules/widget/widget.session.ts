import type { FastifyInstance } from "fastify";
import { z } from "zod";

const BodySchema = z.object({
  publicKey: z.string().min(3),
  model: z.string().min(3).optional(),
  instructions: z.string().min(1).optional(),
  modalities: z.array(z.enum(["audio", "text"])).optional(),
});

type Body = z.infer<typeof BodySchema>;

function cors(reply: any) {
  reply.header("Access-Control-Allow-Origin", "*");
  reply.header("Access-Control-Allow-Methods", "POST,OPTIONS");
  reply.header("Access-Control-Allow-Headers", "content-type");
}

export async function widgetSessionRoutes(app: FastifyInstance) {
  app.options("/v1/widget/session", async (_req, reply) => {
    cors(reply);
    reply.code(204).send();
  });

  app.post("/v1/widget/session", async (req, reply) => {
    cors(reply);

    const parsed = BodySchema.safeParse((req as any).body ?? {});
    if (!parsed.success) {
      reply.code(400).send({ error: "bad_request", details: parsed.error.flatten() });
      return;
    }

    const body: Body = parsed.data;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      reply.code(500).send({ error: "server_misconfig", message: "OPENAI_API_KEY is missing" });
      return;
    }

    const model = body.model ?? "gpt-realtime";
    const instructions =
      body.instructions ??
      "You are Nagool, a fast, friendly sales assistant for GCC businesses. Ask short clarifying questions, then help the user pick a product/service and guide them to the next step (WhatsApp/checkout/booking).";

    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        modalities: body.modalities ?? ["audio", "text"],
        instructions,
      }),
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      reply.code(502).send({
        error: "openai_error",
        status: r.status,
        body: text.slice(0, 2000),
      });
      return;
    }

    const data = (await r.json()) as any;

    reply.send({
      sessionId: data.id ?? null,
      model,
      clientSecret: data.client_secret?.value ?? null,
      expiresAt: data.client_secret?.expires_at ?? null,
      realtimeWsUrl: `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`,
    });
  });
}
