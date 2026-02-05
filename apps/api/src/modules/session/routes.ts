import type { FastifyInstance } from "fastify";
import type { FastifyPluginAsync } from "fastify";
import crypto from "node:crypto";

/**
 * Minimal MVP session routes.
 * Keeps build green and provides /v1/session/start compatible response.
 */
const sessionRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.post("/v1/session/start", async (req, reply) => {
    const sessionId = crypto.randomUUID();
    return reply.send({ sessionId, token: sessionId });
  });
};

export default sessionRoutes;
