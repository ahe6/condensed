import { z } from "zod";

export const orderShipmentParamsSchema = z.object({
  id: z.string().uuid()
});

export const shipmentIdParamsSchema = z.object({
  id: z.string().uuid()
});

export const createShipmentSchema = z.object({
  carrier: z.string().trim().min(1).optional(),
  trackingNumber: z.string().trim().min(1).optional()
});

export const updateShipmentTrackingSchema = createShipmentSchema.refine(
  (value) => value.carrier !== undefined || value.trackingNumber !== undefined,
  "At least one tracking field is required"
);

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type UpdateShipmentTrackingInput = z.infer<typeof updateShipmentTrackingSchema>;
