import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { bootstrapTenant } from "./bootstrapTenant";

/**
 * INTERNAL / DEV ONLY for now.
 * In Phase 6, this will be behind panel JWT (admin/tenant owner).
 */
const BodySchema = z.object({
  tenantId: z.string().min(1),
});

const tenantRoutes: FastifyPluginAsync = async (app) => {
  app.post("/tenant/bootstrap", async (req, reply) => {
    const body = BodySchema.parse(req.body ?? {});
    const res = await bootstrapTenant(body.tenantId);
    return reply.send({ ok: true, ...res });
  });
};

export default tenantRoutes;
