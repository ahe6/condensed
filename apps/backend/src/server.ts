import cors from "@fastify/cors";
import { Prisma } from "@prisma/client";
import Fastify from "fastify";
import { ZodError } from "zod";
import { catalogRoutes } from "./modules/catalog/catalog.routes.js";
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
    origin: true
  });

  server.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: "Bad Request",
        issues: error.issues
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

  server.register(usersRoutes);
  server.register(catalogRoutes);

  return server;
}
