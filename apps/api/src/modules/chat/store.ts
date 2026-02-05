import { loadDB, scheduleSave } from "./persist";

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
  countryCode?: string;
  createdAt: number;
};

export type MessageRecord = {
  role: Role;
  content: string;
  ts: number;
};

const now = () => Date.now();

/**
 * Persistent store (file-based) so sessions won't vanish after restart.
 * Data stored in: apps/api/.data/*.json
 */
class PersistentStore {
  tenants = new Map<string, TenantConfig>();

  private db = loadDB(); // { sessions: {}, messages: {} }

  constructor() {
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
    this.db.sessions[rec.sessionId] = rec;

    if (!this.db.messages[rec.sessionId]) this.db.messages[rec.sessionId] = [];
    scheduleSave(this.db);

    return rec;
  }

  getSession(sessionId: string): SessionRecord | undefined {
    return this.db.sessions[sessionId];
  }

  appendMessage(sessionId: string, msg: MessageRecord, memoryMaxTurns = 10) {
    const list = this.db.messages[sessionId] ?? [];
    list.push(msg);

    const maxMessages = Math.max(2, memoryMaxTurns * 2);
    const trimmed = list.slice(-maxMessages);

    this.db.messages[sessionId] = trimmed;
    scheduleSave(this.db);

    return trimmed;
  }

  getMessages(sessionId: string): MessageRecord[] {
    return this.db.messages[sessionId] ?? [];
  }
}

export const store = new PersistentStore();
