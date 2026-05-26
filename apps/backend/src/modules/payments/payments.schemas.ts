import { z } from "zod";

const currencySchema = z
  .string()
  .trim()
  .length(3)
  .transform((value) => value.toUpperCase());

const decimalAmountSchema = z
  .string()
  .regex(/^\d+(?:\.\d{1,2})?$/, "Use a decimal amount with up to two cents");

export const orderPaymentParamsSchema = z.object({
  id: z.string().uuid()
});

export const paymentIdParamsSchema = z.object({
  id: z.string().uuid()
});

export const createPaymentSchema = z.object({
  provider: z.string().trim().min(1),
  providerPaymentId: z.string().trim().min(1).optional(),
  amount: decimalAmountSchema,
  currency: currencySchema.default("USD")
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
