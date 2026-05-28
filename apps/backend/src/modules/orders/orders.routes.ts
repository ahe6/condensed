import type { FastifyPluginAsync } from "fastify";
import { getAdminIdentity, getCurrentUser } from "../auth/auth.service.js";
import {
  adminOrderQuerySchema,
  createOrderNoteSchema,
  orderIdParamsSchema,
  orderNumberParamsSchema
} from "./orders.schemas.js";
import {
  cancelOrder,
  createOrderNote,
  getOrderByNumberForUser,
  listOrders,
  markOrderPlaced
} from "./orders.service.js";

export const ordersRoutes: FastifyPluginAsync = async (server) => {
  server.get("/orders/:orderNumber", async (request, reply) => {
    const { orderNumber } = orderNumberParamsSchema.parse(request.params);
    const currentUser = await getCurrentUser(request.headers.authorization);
    const order = await getOrderByNumberForUser(orderNumber, currentUser.id);

    if (!order) {
      return reply.code(404).send({
        error: "Not Found"
      });
    }

    return order;
  });

  server.get("/admin/orders", async (request) => {
    const query = adminOrderQuerySchema.parse(request.query);

    return listOrders(query);
  });

  server.post("/admin/orders/:id/place", async (request) => {
    const { id } = orderIdParamsSchema.parse(request.params);

    return markOrderPlaced(id);
  });

  server.post("/admin/orders/:id/cancel", async (request) => {
    const { id } = orderIdParamsSchema.parse(request.params);

    return cancelOrder(id);
  });

  server.post("/admin/orders/:id/notes", async (request, reply) => {
    const { id } = orderIdParamsSchema.parse(request.params);
    const input = createOrderNoteSchema.parse(request.body);
    const admin = await getAdminIdentity(request.headers.authorization);
    const order = await createOrderNote(id, input, admin.email);

    return reply.code(201).send(order);
  });
};
