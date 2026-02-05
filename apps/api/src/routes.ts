import type { FastifyInstance } from "fastify";

// ⬇️ همه routeها اینجا ثبت می‌شن (auto ولی امن)
import sessionRoutes from "./modules/session/routes";
import chatRoutes from "./modules/chat/routes";

export async function registerAllRoutes(app: FastifyInstance) {
  app.register(sessionRoutes);
  app.register(chatRoutes);
}
