import { z } from "zod";

export const startSessionSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().min(5),
  language: z.enum(["ar-OM", "en", "fa"]),
});
