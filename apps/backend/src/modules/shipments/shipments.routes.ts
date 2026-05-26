import type { FastifyPluginAsync } from "fastify";
import {
  createShipmentSchema,
  orderShipmentParamsSchema,
  shipmentIdParamsSchema,
  updateShipmentTrackingSchema
} from "./shipments.schemas.js";
import {
  addTrackingNumber,
  createShipment,
  markShipmentDelivered,
  markShipmentReturned,
  markShipmentShipped
} from "./shipments.service.js";

export const shipmentsRoutes: FastifyPluginAsync = async (server) => {
  server.post("/admin/orders/:id/shipments", async (request, reply) => {
    const { id } = orderShipmentParamsSchema.parse(request.params);
    const input = createShipmentSchema.parse(request.body);
    const shipment = await createShipment(id, input);

    return reply.code(201).send(shipment);
  });

  server.patch("/admin/shipments/:id/tracking", async (request) => {
    const { id } = shipmentIdParamsSchema.parse(request.params);
    const input = updateShipmentTrackingSchema.parse(request.body);

    return addTrackingNumber(id, input);
  });

  server.post("/admin/shipments/:id/ship", async (request) => {
    const { id } = shipmentIdParamsSchema.parse(request.params);

    return markShipmentShipped(id);
  });

  server.post("/admin/shipments/:id/deliver", async (request) => {
    const { id } = shipmentIdParamsSchema.parse(request.params);

    return markShipmentDelivered(id);
  });

  server.post("/admin/shipments/:id/return", async (request) => {
    const { id } = shipmentIdParamsSchema.parse(request.params);

    return markShipmentReturned(id);
  });
};
