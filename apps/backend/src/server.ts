import cors from "@fastify/cors";
import Fastify from "fastify";
import { z, ZodError } from "zod";
import { config } from "./config.js";
import { prisma } from "./prisma.js";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional()
});

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

  server.get("/users", async () => {
    return prisma.user.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });
  });

  server.post("/users", async (request, reply) => {
    const body = createUserSchema.parse(request.body);
    const user = await prisma.user.create({
      data: body
    });

    return reply.code(201).send(user);
  });

  return server;
}
