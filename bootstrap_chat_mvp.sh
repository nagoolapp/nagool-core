#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
API_DIR="apps/api"
SRC_DIR="$API_DIR/src"

if [[ ! -d "$API_DIR" ]]; then
  echo "❌ $API_DIR پیدا نشد. این اسکریپت باید از ریشه ریپو اجرا بشه."
  exit 1
fi

echo "✅ Creating chat module files..."

mkdir -p "$SRC_DIR/modules/chat"

# ---------------------------
# chat/schema.ts
# ---------------------------
cat > "$SRC_DIR/modules/chat/schema.ts" <<'TS'
import { z } from "zod";

export const ChatMessageBodySchema = z.object({
  sessionId: z.string().min(8),
  text: z.string().min(1).max(5000),
});

export type ChatMessageBody = z.infer<typeof ChatMessageBodySchema>;

export const ChatMessageReplySchema = z.object({
  replyText: z.string(),
  sessionId: z.string(),
});
TS

# ---------------------------
# chat/store.ts (in-memory MVP)
# ---------------------------
cat > "$SRC_DIR/modules/chat/store.ts" <<'TS'
export type Role = "user" | "assistant" | "system";

export type TenantConfig = {
  tenantId: string;
  name: string;
  language?: string;
  systemPrompt: string;
  memoryMaxTurns: number; // number of user+assistant turns to keep
};

export type SessionRecord = {
  sessionId: string;
  tenantId: string;
  name?: string;
  phone?: string;
  language?: string;
  createdAt: number;
};

export type MessageRecord = {
  role: Role;
  content: string;
  ts: number;
};

const now = () => Date.now();

/**
 * MVP: In-memory only.
 * Later: swap with Firestore implementation.
 */
class InMemoryStore {
  tenants = new Map<string, TenantConfig>();
  sessions = new Map<string, SessionRecord>();
  messages = new Map<string, MessageRecord[]>(); // sessionId -> messages

  constructor() {
    // Default demo tenant (فروش‌محور: کوتاه، مستقیم، کمک‌کننده)
    this.tenants.set("demo", {
      tenantId: "demo",
      name: "Demo Tenant",
      language: "ar-OM",
      memoryMaxTurns: 10,
      systemPrompt:
        "You are NAGOOL, a fast, sales-oriented AI assistant for a local business in Oman. " +
        "Keep answers short, practical, and friendly. Ask 1 clarifying question only if absolutely needed. " +
        "If the user asks about price, availability, booking, or ordering, guide them to the next step. " +
        "If you don't know something, say you don't know and ask for the missing detail."
    });
  }

  upsertTenant(cfg: TenantConfig) {
    this.tenants.set(cfg.tenantId, cfg);
  }

  getTenant(tenantId: string) {
    return this.tenants.get(tenantId);
  }

  createSession(s: Omit<SessionRecord, "createdAt">) {
    const rec: SessionRecord = { ...s, createdAt: now() };
    this.sessions.set(rec.sessionId, rec);
    if (!this.messages.has(rec.sessionId)) this.messages.set(rec.sessionId, []);
    return rec;
  }

  getSession(sessionId: string) {
    return this.sessions.get(sessionId);
  }

  appendMessage(sessionId: string, msg: MessageRecord, memoryMaxTurns = 10) {
    const list = this.messages.get(sessionId) ?? [];
    list.push(msg);

    // keep last N turns (turn ~ user+assistant) => 2N messages
    const maxMessages = Math.max(2, memoryMaxTurns * 2);
    const trimmed = list.slice(-maxMessages);

    this.messages.set(sessionId, trimmed);
    return trimmed;
  }

  getMessages(sessionId: string) {
    return this.messages.get(sessionId) ?? [];
  }
}

export const store = new InMemoryStore();
TS

# ---------------------------
# chat/openai.ts (Responses API via fetch)
# ---------------------------
cat > "$SRC_DIR/modules/chat/openai.ts" <<'TS'
import type { MessageRecord, TenantConfig } from "./store";

type OpenAIText = { type: "text"; text: string };
type OpenAIContent = OpenAIText[];

type OpenAIMessage = {
  role: "system" | "user" | "assistant";
  content: OpenAIContent;
};

function env(key: string, fallback?: string) {
  const v = process.env[key];
  return (v && v.trim().length > 0) ? v : fallback;
}

function toOpenAIMessages(systemPrompt: string, history: MessageRecord[], userText: string): OpenAIMessage[] {
  const msgs: OpenAIMessage[] = [];

  msgs.push({
    role: "system",
    content: [{ type: "text", text: systemPrompt }],
  });

  for (const m of history) {
    if (m.role === "system") continue;
    msgs.push({
      role: m.role,
      content: [{ type: "text", text: m.content }],
    });
  }

  msgs.push({
    role: "user",
    content: [{ type: "text", text: userText }],
  });

  return msgs;
}

export async function generateReply(args: {
  tenant: TenantConfig;
  history: MessageRecord[];
  userText: string;
}) {
  const apiKey = env("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const model = env("OPENAI_MODEL", "gpt-4o-mini")!;
  const temperature = Number(env("OPENAI_TEMPERATURE", "0.4"));

  const input = toOpenAIMessages(args.tenant.systemPrompt, args.history, args.userText);

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input,
      temperature: Number.isFinite(temperature) ? temperature : 0.4,
      max_output_tokens: 300,
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`OpenAI error: ${res.status} ${res.statusText} | ${txt}`);
  }

  const data: any = await res.json();

  // Extract best-effort text from Responses API
  // Usually: data.output[0].content[0].text
  let reply = "";
  try {
    const out = data.output?.[0]?.content ?? [];
    for (const c of out) {
      if (c?.type === "output_text" && typeof c?.text === "string") reply += c.text;
      if (c?.type === "text" && typeof c?.text === "string") reply += c.text;
    }
  } catch {}

  if (!reply || reply.trim().length === 0) {
    // fallback
    reply = "متأسف، ما قدرت أرد بشكل واضح. حاول تكتب سؤالك بطريقة أبسط.";
  }

  return reply.trim();
}
TS

# ---------------------------
# chat/routes.ts
# ---------------------------
cat > "$SRC_DIR/modules/chat/routes.ts" <<'TS'
import type { FastifyInstance } from "fastify";
import { ChatMessageBodySchema } from "./schema";
import { store } from "./store";
import { generateReply } from "./openai";

export default async function chatRoutes(app: FastifyInstance) {
  app.post("/v1/chat/message", async (req, reply) => {
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

    const history = store.getMessages(sessionId);

    // append user message
    store.appendMessage(
      sessionId,
      { role: "user", content: text, ts: Date.now() },
      tenant.memoryMaxTurns
    );

    const updatedHistory = store.getMessages(sessionId);

    let replyText = "";
    try {
      replyText = await generateReply({
        tenant,
        history: updatedHistory,
        userText: text,
      });
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      return reply.status(502).send({
        error: "OPENAI_FAILED",
        message: msg,
      });
    }

    // append assistant
    store.appendMessage(
      sessionId,
      { role: "assistant", content: replyText, ts: Date.now() },
      tenant.memoryMaxTurns
    );

    return reply.send({
      replyText,
      sessionId,
    });
  });
}
TS

# ---------------------------
# Patch session/startSession.ts to persist sessions in store
# ---------------------------
SESSION_FILE="$SRC_DIR/modules/session/startSession.ts"
if [[ -f "$SESSION_FILE" ]]; then
  echo "✅ Patching session/startSession.ts to store session in memory..."

  # 1) add import (if missing)
  if ! grep -q 'from "\.\./chat/store"' "$SESSION_FILE" && ! grep -q "from '../chat/store'" "$SESSION_FILE"; then
    perl -0777 -i -pe 's/(^import[^\n]*\n)/$1import { store } from "..\/chat\/store";\n/m' "$SESSION_FILE" || true
  fi

  # 2) insert store.createSession near the place where sessionId/token is generated
  # best-effort: after a line containing `const sessionId`
  if ! grep -q "store.createSession" "$SESSION_FILE"; then
    perl -0777 -i -pe '
      s/(const\s+sessionId\s*=\s*[^;]+;\s*)/$1\n  // persist session for chat MVP\n  store.createSession({\n    sessionId,\n    tenantId: body.tenantId,\n    name: body.name,\n    phone: body.phone,\n    language: body.language,\n  });\n/sm
    ' "$SESSION_FILE" || true
  fi
else
  echo "⚠️ $SESSION_FILE پیدا نشد. (اگر اسم فایل فرق داره، خودت بعداً بهم بگو تا patch بدم)"
fi

# ---------------------------
# Patch server.ts to register chat routes
# ---------------------------
SERVER_FILE="$SRC_DIR/server.ts"
if [[ -f "$SERVER_FILE" ]]; then
  echo "✅ Patching server.ts to register chat routes..."

  # Add import if missing
  if ! grep -q "modules/chat/routes" "$SERVER_FILE"; then
    perl -0777 -i -pe 's/(^import[^\n]*\n)/$1import chatRoutes from ".\/modules\/chat\/routes";\n/m' "$SERVER_FILE" || true
  fi

  # Register if missing (place before listen/ready-ish)
  if ! grep -q "chatRoutes" "$SERVER_FILE"; then
    # try insert before `app.listen` or `await app.listen`
    perl -0777 -i -pe '
      if (s/(^\s*(?:await\s+)?app\.listen\([^\n]*\);\s*$)/  app.register(chatRoutes);\n\n$1/m) {} 
      else { $_ .= "\n\napp.register(chatRoutes);\n"; }
    ' "$SERVER_FILE" || true
  fi
else
  echo "❌ server.ts پیدا نشد: $SERVER_FILE"
  exit 1
fi

# ---------------------------
# .env.example
# ---------------------------
ENV_EX="$API_DIR/.env.example"
if [[ ! -f "$ENV_EX" ]]; then
  echo "✅ Creating apps/api/.env.example ..."
  cat > "$ENV_EX" <<'ENV'
# OpenAI
OPENAI_API_KEY=YOUR_KEY_HERE
OPENAI_MODEL=gpt-4o-mini
OPENAI_TEMPERATURE=0.4
ENV
fi

echo ""
echo "✅ DONE."
echo "Next:"
echo "  cd apps/api"
echo "  cp .env.example .env   # و OPENAI_API_KEY رو بذار"
echo "  npm i"
echo "  npm run dev"
