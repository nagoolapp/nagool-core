import "dotenv/config";
import Fastify from "fastify";
import tenantRoutes from "./modules/tenants/routes";

import { startSessionHandler } from "./modules/session/startSessionHandler";
import { startSession } from "./modules/session/startSession"; // (اگر جای دیگه نیاز شد، نگهش می‌داریم)

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
import panelRoutes from "./modules/panel/routes";
import widgetKeyRoutes from "./modules/widgetKeys/routes";
import { createTenant } from "./modules/tenant/createTenant";

const app = Fastify({ logger: true });

app.get("/health", async () => ({ ok: true, service: "nagool-api" }));

// ✅ Phase 2: session stored under tenants/{tenantId}/sessions
app.post("/v1/session/start", startSessionHandler);

// ✅ Phase 1: tenant create
app.post("/v1/tenant/create", createTenant);// Widget routes
app.register(widgetBootstrapRoutes);
app.register(widgetBootstrapRoutesV2);
app.register(widgetStaticRoutes);
app.register(widgetSessionRoutes);
app.register(widgetSessionRoutesV2);
app.register(widgetMessageRoutesV2);
app.register(widgetTestPageRoutes);
app.register(widgetEmbedRoutes);

app.register(authRoutes, { prefix: "/v1" });
app.register(panelRoutes, { prefix: "/v1" });
app.register(widgetKeyRoutes, { prefix: "/v1" });
app.register(tenantRoutes, { prefix: "/v1" });
/** ✅ chat routes */
app.register(chatRoutes, { prefix: "/v1" });

app.listen({ port: 3001, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
