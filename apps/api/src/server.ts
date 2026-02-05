import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";

import tenantRoutes from "./modules/tenants/routes";

import { startSessionHandler } from "./modules/session/startSessionHandler";
import { startSession } from "./modules/session/startSession";

import { widgetStaticRoutes } from "./modules/widget/widget.static";
import { widgetSessionRoutes } from "./modules/widget/widget.session";
import { widgetSessionRoutesV2 } from "./modules/widget/widget.session.v2";
import { widgetMessageRoutesV2 } from "./modules/widget/widget.message.v2";
import { widgetTestPageRoutes } from "./modules/widget/widget.testpage";
import { widgetEmbedRoutes } from "./modules/widget/widget.embed";
import { widgetBootstrapRoutes } from "./modules/widget/widget.bootstrap";
import { widgetBootstrapRoutesV2 } from "./modules/widget/widget.bootstrap.v2";

import chatRoutes from "./modules/chat/routes";
import authRoutes from "./modules/auth/routes";
import publicRoutes from "./modules/public/routes";
import panelRoutes from "./modules/panel/routes";
import { tenantPanelRoutesV2 } from "./modules/panel/tenantPanel.routes.v2";
import widgetKeyRoutes from "./modules/widgetKeys/routes";
import { createTenant } from "./modules/tenant/createTenant";

const port = Number(process.env.PORT || 3001);

const app = Fastify({ logger: true });

/**
 * ✅ CORS (MUST be before routes)
 */
await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);

    const allowed = new Set([
      "https://app.nagool.com",
      "http://localhost:3000",
    ]);

    return allowed.has(origin) ? cb(null, true) : cb(new Error("CORS"), false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204,
});

/**
 * ✅ HARD FIX: handle ALL preflight requests (otherwise Fastify 404 on OPTIONS)
 */
app.options("/*", async (_req, reply) => {
  return reply.code(204).send();
});

app.get("/health", async () => ({ ok: true, service: "nagool-api" }));

app.post("/v1/session/start", startSessionHandler);
app.post("/v1/tenant/create", createTenant);

// Widget routes
app.register(widgetBootstrapRoutes);
app.register(widgetBootstrapRoutesV2);
app.register(widgetStaticRoutes);
app.register(widgetSessionRoutes);
app.register(widgetSessionRoutesV2);
app.register(widgetMessageRoutesV2);
app.register(widgetTestPageRoutes);
app.register(widgetEmbedRoutes);

app.register(authRoutes, { prefix: "/v1" });
app.register(publicRoutes, { prefix: "/v1" });
app.register(panelRoutes, { prefix: "/v1" });
app.register(tenantPanelRoutesV2, { prefix: "/v1" });
app.register(widgetKeyRoutes, { prefix: "/v1" });
app.register(tenantRoutes, { prefix: "/v1" });
app.register(chatRoutes, { prefix: "/v1" });

app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
