import { z } from "zod";

export const StartSessionBodySchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().min(1),
  countryCode: z.string().optional().default("OM"),
  language: z.string().optional().default("ar-OM"),
});

export type StartSessionBody = z.infer<typeof StartSessionBodySchema>;
