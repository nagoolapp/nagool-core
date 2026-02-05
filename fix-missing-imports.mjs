import fs from "fs";
import path from "path";

const root = process.cwd();

const getMyWidgetPath = path.join(root, "apps", "api", "src", "modules", "widgetKeys", "getMyWidget.ts");
const guardPath = path.join(root, "apps", "api", "src", "modules", "auth", "guard.ts");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeIfMissing(p, content) {
  if (!fs.existsSync(p)) {
    ensureDir(path.dirname(p));
    fs.writeFileSync(p, content, "utf8");
    console.log("✅ created", p.replace(root + "/", ""));
  } else {
    console.log("ℹ️ exists", p.replace(root + "/", ""));
  }
}

// Minimal getMyWidget resolver used by widgetKeys routes
writeIfMissing(
  getMyWidgetPath,
`export type WidgetResolved = {
  tenantId: string;
  widgetKey: string;
  status?: "active" | "inactive";
  allowedOrigins?: string[];
};

/**
 * Minimal resolver: returns an "active" widget allowing all origins by default.
 * Replace later with Firestore lookup / real logic.
 */
export async function getMyWidget(input: { tenantId: string; widgetKey: string }): Promise<WidgetResolved> {
  return {
    tenantId: input.tenantId,
    widgetKey: input.widgetKey,
    status: "active",
    allowedOrigins: ["*"]
  };
}

export default getMyWidget;
`
);

// Minimal auth guard used by routes
writeIfMissing(
  guardPath,
`import type { FastifyRequest } from "fastify";

/**
 * Minimal auth guard placeholder.
 * Replace with real auth/tenant validation later.
 */
export function guard(_req: FastifyRequest) {
  return true;
}

export default guard;
`
);

console.log("\\n✅ Done. Now: npm ci && npm run build:api");
