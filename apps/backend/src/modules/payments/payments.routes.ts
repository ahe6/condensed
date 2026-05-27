import type { FastifyPluginAsync } from "fastify";
import {
  createPaymentSchema,
  createStripeCheckoutSessionSchema,
  orderIdParamsSchema,
  orderPaymentParamsSchema,
  paymentIdParamsSchema
} from "./payments.schemas.js";
import {
  createPayment,
  createStripeCheckoutSession,
  handleStripeWebhook,
  markPaymentAuthorized,
  markPaymentFailed,
  markPaymentPaid,
  refundPayment,
  syncStripePayment
} from "./payments.service.js";

export const paymentsRoutes: FastifyPluginAsync = async (server) => {
  server.post("/orders/:id/stripe-checkout-session", async (request, reply) => {
    const { id } = orderIdParamsSchema.parse(request.params);
    const input = createStripeCheckoutSessionSchema.parse(request.body);
    const checkoutSession = await createStripeCheckoutSession(id, input);

    return reply.code(201).send(checkoutSession);
  });

  server.post("/webhooks/stripe", async (request) => {
    const signature = request.headers["stripe-signature"];

    return handleStripeWebhook(request.body as string, Array.isArray(signature) ? signature[0] : signature);
  });

  server.post("/admin/orders/:id/payments", async (request, reply) => {
    const { id } = orderPaymentParamsSchema.parse(request.params);
    const input = createPaymentSchema.parse(request.body);
    const payment = await createPayment(id, input);

    return reply.code(201).send(payment);
  });

  server.post("/admin/payments/:id/authorize", async (request) => {
    const { id } = paymentIdParamsSchema.parse(request.params);

    return markPaymentAuthorized(id);
  });

  server.post("/admin/payments/:id/pay", async (request) => {
    const { id } = paymentIdParamsSchema.parse(request.params);

    return markPaymentPaid(id);
  });

  server.post("/admin/payments/:id/fail", async (request) => {
    const { id } = paymentIdParamsSchema.parse(request.params);

    return markPaymentFailed(id);
  });

  server.post("/admin/payments/:id/refund", async (request) => {
    const { id } = paymentIdParamsSchema.parse(request.params);

    return refundPayment(id);
  });

  server.post("/admin/payments/:id/sync-stripe", async (request) => {
    const { id } = paymentIdParamsSchema.parse(request.params);

    return syncStripePayment(id);
  });
};
