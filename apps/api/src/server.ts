import "dotenv/config";
import Fastify from "fastify";

import { startSessionHandler } from "./modules/session/startSessionHandler";
import { startSession } from "./modules/session/startSession"; // (اگر جای دیگه نیاز شد، نگهش می‌داریم)

import { widgetStaticRoutes } from "./modules/widget/widget.static";
import { widgetSessionRoutes } from "./modules/widget/widget.session";
import { widgetTestPageRoutes } from "./modules/widget/widget.testpage";
import { widgetEmbedRoutes } from "./modules/widget/widget.embed";
import { widgetBootstrapRoutes } from "./modules/widget/widget.bootstrap";

import chatRoutes from "./modules/chat/routes";
import { createTenant } from "./modules/tenant/createTenant";
import { addMessage } from "./modules/message/addMessage";
import { createLead } from "./modules/lead/createLead";

const app = Fastify({ logger: true });

app.get("/health", async () => ({ ok: true, service: "nagool-api" }));

// ✅ Phase 2: session stored under tenants/{tenantId}/sessions
app.post("/v1/session/start", startSessionHandler);

// ✅ Phase 1: tenant create
app.post("/v1/tenant/create", createTenant);

// ✅ Phase 2: messages + leads
app.post("/v1/message/add", addMessage);
app.post("/v1/lead/create", createLead);

// Widget routes
app.register(widgetBootstrapRoutes);
app.register(widgetStaticRoutes);
app.register(widgetSessionRoutes);
app.register(widgetTestPageRoutes);
app.register(widgetEmbedRoutes);

/** ✅ chat routes */
app.register(chatRoutes, { prefix: "/v1" });

app.listen({ port: 3001, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
