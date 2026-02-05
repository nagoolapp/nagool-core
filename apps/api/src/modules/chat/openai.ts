import type { MessageRecord, TenantConfig } from "./store";

type OpenAIInputText = { type: "input_text"; text: string };
type OpenAIContent = OpenAIInputText[];

type OpenAIMessage = {
  role: "system" | "user" | "assistant";
  content: OpenAIContent;
};

function env(key: string, fallback?: string) {
  const v = process.env[key];
  return v && v.trim().length > 0 ? v : fallback;
}

function toOpenAIMessages(
  systemPrompt: string,
  history: MessageRecord[],
  userText: string
): OpenAIMessage[] {
  const msgs: OpenAIMessage[] = [];

  // system prompt
  msgs.push({
    role: "system",
    content: [{ type: "input_text", text: systemPrompt }],
  });

  // history
  for (const m of history) {
    if (m.role === "system") continue;
    msgs.push({
      role: m.role,
      content: [{ type: "input_text", text: m.content }],
    });
  }

  // current user message
  msgs.push({
    role: "user",
    content: [{ type: "input_text", text: userText }],
  });

  return msgs;
}

export async function generateReply(args: {
  tenant: TenantConfig;
  history: MessageRecord[];
  userText: string;
}) {
  const apiKey = env("OPENAI_API_KEY");
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const model = env("OPENAI_MODEL", "gpt-4o-mini")!;
  const temperature = Number(env("OPENAI_TEMPERATURE", "0.4"));

  const input = toOpenAIMessages(
    args.tenant.systemPrompt,
    args.history,
    args.userText
  );

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input,
      temperature: Number.isFinite(temperature) ? temperature : 0.4,
      max_output_tokens: 300,
    }),
  });

  const raw = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`OpenAI error: ${res.status} ${res.statusText} | ${raw}`);
  }

  const data: any = raw ? JSON.parse(raw) : {};

  // Extract text from Responses output
  let reply = "";
  try {
    const blocks = data.output?.[0]?.content ?? [];
    for (const b of blocks) {
      if (b?.type === "output_text" && typeof b.text === "string") {
        reply += b.text;
      }
    }
  } catch {}

  reply = (reply || "").trim();
  if (!reply) reply = "ما قدرت أرد الحين. حاول مرة ثانية.";

  return reply;
}
