import { z } from "zod";

export const orderNumberParamsSchema = z.object({
  orderNumber: z.string().trim().min(1)
});

export const orderIdParamsSchema = z.object({
  id: z.string().uuid()
});
