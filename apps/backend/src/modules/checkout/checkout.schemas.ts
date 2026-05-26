import { z } from "zod";

const addressSchema = z.object({
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
  phone: z.string().trim().min(1).optional()
});

export const checkoutCartSchema = z.object({
  cartId: z.string().uuid(),
  email: z.string().email(),
  shippingAddress: addressSchema,
  billingAddress: addressSchema
});

export type CheckoutCartInput = z.infer<typeof checkoutCartSchema>;
