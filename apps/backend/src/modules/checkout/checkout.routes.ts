import type { FastifyPluginAsync } from "fastify";
import { getCurrentUser } from "../auth/auth.service.js";
import { createStripeCheckoutSession } from "../payments/payments.service.js";
import { checkoutCartSchema, checkoutCartWithStripeSchema } from "./checkout.schemas.js";
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

  server.post("/checkout/stripe", async (request, reply) => {
    const currentUser = await getCurrentUser(request.headers.authorization);
    const body = checkoutCartWithStripeSchema.parse(request.body);
    const order = await checkoutCart(body, {
      userId: currentUser.id
    });
    const returnUrl = `${body.returnBaseUrl.replace(/\/$/, "")}/orders/${encodeURIComponent(
      order.orderNumber
    )}?session_id={CHECKOUT_SESSION_ID}`;
    const checkoutSession = await createStripeCheckoutSession(order.id, {
      returnUrl
    });

    return reply.code(201).send({
      checkoutSession,
      order
    });
  });
};
