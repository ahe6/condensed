import { z } from "zod";

const addressSchema = z.object({
  label: z.string().trim().min(1).optional(),
  recipientName: z.string().trim().min(1),
  line1: z.string().trim().min(1),
  line2: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1),
  state: z.string().trim().min(1).optional(),
  postalCode: z.string().trim().min(1),
  country: z
    .string()
    .trim()
    .length(2)
    .transform((value) => value.toUpperCase()),
  phone: z.string().trim().min(1).optional(),
  isDefaultShipping: z.boolean().optional(),
  isDefaultBilling: z.boolean().optional()
});

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional()
});

export const updateCurrentUserSchema = z
  .object({
    name: z.string().trim().min(1).nullable().optional(),
    phone: z.string().trim().min(1).nullable().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export const addressIdParamsSchema = z.object({
  id: z.string().uuid()
});

export const createAddressSchema = addressSchema;

export const updateAddressSchema = addressSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateCurrentUserInput = z.infer<typeof updateCurrentUserSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
