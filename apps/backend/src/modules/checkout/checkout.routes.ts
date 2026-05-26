import type { FastifyPluginAsync } from "fastify";
import { checkoutCartSchema } from "./checkout.schemas.js";
import { checkoutCart } from "./checkout.service.js";

export const checkoutRoutes: FastifyPluginAsync = async (server) => {
  server.post("/checkout", async (request, reply) => {
    const body = checkoutCartSchema.parse(request.body);
    const order = await checkoutCart(body);

    return reply.code(201).send(order);
  });
};
