import type { FastifyPluginAsync } from "fastify";
import { orderNumberParamsSchema } from "./orders.schemas.js";
import { getOrderByNumber, listOrders } from "./orders.service.js";

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
};
