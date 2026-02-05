import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "apps", "api", ".data");
const sessionsFile = path.join(dataDir, "sessions.json");
const messagesFile = path.join(dataDir, "messages.json");

function ensureDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function safeReadJSON<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, "utf-8");
    if (!raw || raw.trim().length === 0) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWriteJSON(file: string, data: any) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

export type PersistedDB = {
  sessions: Record<string, any>;
  messages: Record<string, any[]>;
};

export function loadDB(): PersistedDB {
  ensureDir();
  const sessions = safeReadJSON<Record<string, any>>(sessionsFile, {});
  const messages = safeReadJSON<Record<string, any[]>>(messagesFile, {});
  return { sessions, messages };
}

let writeTimer: NodeJS.Timeout | null = null;

export function scheduleSave(db: PersistedDB) {
  // Debounce to reduce disk writes in dev
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    safeWriteJSON(sessionsFile, db.sessions);
    safeWriteJSON(messagesFile, db.messages);
  }, 150);
}
