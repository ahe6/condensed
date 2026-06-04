import { z } from "zod";

export const updateCurrentUserSchema = z
  .object({
    name: z.string().trim().min(1).nullable().optional(),
    phone: z.string().trim().min(1).nullable().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export type UpdateCurrentUserInput = z.infer<typeof updateCurrentUserSchema>;
