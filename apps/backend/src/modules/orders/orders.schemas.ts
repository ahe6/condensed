import { z } from "zod";

export const adminOrderQuerySchema = z.object({
  search: z.string().trim().optional().default(""),
  payment: z
    .enum(["ALL", "UNPAID", "AUTHORIZED", "PAID", "FAILED", "REFUNDED", "DISPUTED"])
    .optional()
    .default("ALL"),
  fulfillment: z
    .enum(["ALL", "UNFULFILLED", "PARTIAL", "FULFILLED", "RETURNED"])
    .optional()
    .default("ALL"),
  dateField: z
    .enum([
      "ANY",
      "ORDER_CREATED",
      "ORDER_PLACED",
      "ORDER_UPDATED",
      "SHIPMENT_CREATED",
      "SHIPMENT_SHIPPED",
      "SHIPMENT_DELIVERED"
    ])
    .optional()
    .default("ANY"),
  dateFrom: z.string().trim().optional().default(""),
  dateTo: z.string().trim().optional().default(""),
  sort: z
    .enum([
      "CREATED_DESC",
      "CREATED_ASC",
      "UPDATED_DESC",
      "PLACED_DESC",
      "SHIPPED_DESC",
      "DELIVERED_DESC",
      "TOTAL_DESC",
      "TOTAL_ASC"
    ])
    .optional()
    .default("CREATED_DESC"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(5)
});

export const orderNumberParamsSchema = z.object({
  orderNumber: z.string().trim().min(1)
});

export const orderIdParamsSchema = z.object({
  id: z.string().uuid()
});

export const createOrderNoteSchema = z.object({
  body: z.string().trim().min(1).max(2000)
});

export type AdminOrderQuery = z.infer<typeof adminOrderQuerySchema>;
export type CreateOrderNoteInput = z.infer<typeof createOrderNoteSchema>;
