import type { FastifyPluginAsync } from "fastify";
import { orderIdParamsSchema, orderNumberParamsSchema } from "./orders.schemas.js";
import { cancelOrder, getOrderByNumber, listOrders, markOrderPlaced } from "./orders.service.js";

export const ordersRoutes: FastifyPluginAsync = async (server) => {
  server.get("/orders/:orderNumber", async (request, reply) => {
    const { orderNumber } = orderNumberParamsSchema.parse(request.params);
    const order = await getOrderByNumber(orderNumber);

    if (!order) {
      return reply.code(404).send({
        error: "Not Found"
      });
    }

    return order;
  });

  server.get("/admin/orders", async () => {
    return listOrders();
  });

  server.post("/admin/orders/:id/place", async (request) => {
    const { id } = orderIdParamsSchema.parse(request.params);

    return markOrderPlaced(id);
  });

  server.post("/admin/orders/:id/cancel", async (request) => {
    const { id } = orderIdParamsSchema.parse(request.params);

    return cancelOrder(id);
  });
};
