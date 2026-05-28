import type { FastifyPluginAsync } from "fastify";
import { getCurrentUser } from "../auth/auth.service.js";
import { checkoutCartSchema } from "./checkout.schemas.js";
import { checkoutCart } from "./checkout.service.js";

export const checkoutRoutes: FastifyPluginAsync = async (server) => {
  server.post("/checkout", async (request, reply) => {
    const currentUser = await getCurrentUser(request.headers.authorization);
    const body = checkoutCartSchema.parse(request.body);
    const order = await checkoutCart(body, {
      userId: currentUser.id
    });

    return reply.code(201).send(order);
  });
};
