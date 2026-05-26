import { z } from "zod";

export const orderNumberParamsSchema = z.object({
  orderNumber: z.string().trim().min(1)
});
