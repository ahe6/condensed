import type { FastifyPluginAsync } from "fastify";
import { getOptionalCurrentUser } from "../auth/auth.service.js";
import { checkoutCartSchema } from "./checkout.schemas.js";
import { checkoutCart } from "./checkout.service.js";

export const checkoutRoutes: FastifyPluginAsync = async (server) => {
  server.post("/checkout", async (request, reply) => {
    const body = checkoutCartSchema.parse(request.body);
    const currentUser = await getOptionalCurrentUser(request.headers.authorization);
    const order = await checkoutCart(body, {
      userId: currentUser?.id
    });

    return reply.code(201).send(order);
  });
};
