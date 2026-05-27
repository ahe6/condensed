import { z } from "zod";

export const orderShipmentParamsSchema = z.object({
  id: z.string().uuid()
});

export const shipmentIdParamsSchema = z.object({
  id: z.string().uuid()
});

const trackingFieldsSchema = z.object({
  carrier: z.string().trim().min(1).optional(),
  trackingNumber: z.string().trim().min(1).optional()
});

export const createShipmentSchema = trackingFieldsSchema.extend({
  items: z
    .array(
      z.object({
        orderItemId: z.string().uuid(),
        quantity: z.number().int().min(1)
      })
    )
    .optional()
});

export const updateShipmentTrackingSchema = trackingFieldsSchema.refine(
  (value) => value.carrier !== undefined || value.trackingNumber !== undefined,
  "At least one tracking field is required"
);

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type UpdateShipmentTrackingInput = z.infer<typeof updateShipmentTrackingSchema>;
