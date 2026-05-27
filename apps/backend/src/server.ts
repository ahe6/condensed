import cors from "@fastify/cors";
import { Prisma } from "@prisma/client";
import Fastify from "fastify";
import { ZodError } from "zod";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { AuthError, requireAdmin } from "./modules/auth/auth.service.js";
import { cartsRoutes } from "./modules/carts/carts.routes.js";
import { catalogRoutes } from "./modules/catalog/catalog.routes.js";
import { CheckoutError } from "./modules/checkout/checkout.service.js";
import { checkoutRoutes } from "./modules/checkout/checkout.routes.js";
import { ordersRoutes } from "./modules/orders/orders.routes.js";
import { paymentsRoutes } from "./modules/payments/payments.routes.js";
import { PaymentError } from "./modules/payments/payments.service.js";
import { shipmentsRoutes } from "./modules/shipments/shipments.routes.js";
import { ShipmentError } from "./modules/shipments/shipments.service.js";
import { usersRoutes } from "./modules/users/users.routes.js";
import { config } from "./config.js";
import { prisma } from "./prisma.js";

export function buildServer() {
  const server = Fastify({
    logger: {
      level: config.LOG_LEVEL
    }
  });

  server.register(cors, {
    methods: ["GET", "HEAD", "POST", "PATCH", "DELETE", "OPTIONS"],
    origin: true
  });

  server.removeContentTypeParser("application/json");
  server.addContentTypeParser("application/json", { parseAs: "string" }, (request, body, done) => {
    if (request.url === "/webhooks/stripe") {
      done(null, body);
      return;
    }

    try {
      done(null, body ? JSON.parse(body as string) : null);
    } catch (error) {
      done(error as Error);
    }
  });

  server.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: "Bad Request",
        issues: error.issues
      });
    }

    if (error instanceof CheckoutError) {
      return reply.code(error.statusCode).send({
        error: error.message
      });
    }

    if (error instanceof AuthError) {
      return reply.code(error.statusCode).send({
        error: error.message
      });
    }

    if (error instanceof PaymentError) {
      return reply.code(error.statusCode).send({
        error: error.message
      });
    }

    if (error instanceof ShipmentError) {
      return reply.code(error.statusCode).send({
        error: error.message
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return reply.code(409).send({
          error: "Conflict",
          target: error.meta?.target
        });
      }

      if (error.code === "P2025") {
        return reply.code(404).send({
          error: "Not Found"
        });
      }

      if (error.code === "P2003") {
        return reply.code(400).send({
          error: "Invalid Reference",
          field: error.meta?.field_name
        });
      }
    }

    server.log.error(error);

    return reply.code(500).send({
      error: "Internal Server Error"
    });
  });

  server.get("/health", async () => ({
    ok: true
  }));

  server.get("/ready", async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      return reply.code(503).send({
        ok: false,
        error: "Database Unavailable"
      });
    }

    return {
      ok: true
    };
  });

  server.addHook("preHandler", async (request) => {
    if (request.url.startsWith("/admin/")) {
      await requireAdmin(request.headers.authorization);
    }
  });

  server.register(authRoutes);
  server.register(usersRoutes);
  server.register(catalogRoutes);
  server.register(cartsRoutes);
  server.register(checkoutRoutes);
  server.register(ordersRoutes);
  server.register(paymentsRoutes);
  server.register(shipmentsRoutes);

  return server;
}
