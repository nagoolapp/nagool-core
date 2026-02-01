import { z } from "zod";

export const startSessionSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1),
  countryCode: z.string().min(1),
  phone: z.string().min(5),
  language: z.string().min(2),
  email: z.string().email().optional(),
});
