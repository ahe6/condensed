import type { FastifyPluginAsync } from "fastify";
import { createPaymentSchema, orderPaymentParamsSchema, paymentIdParamsSchema } from "./payments.schemas.js";
import {
  createPayment,
  markPaymentAuthorized,
  markPaymentFailed,
  markPaymentPaid,
  refundPayment
} from "./payments.service.js";

export const paymentsRoutes: FastifyPluginAsync = async (server) => {
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
};
