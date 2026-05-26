import type { FastifyPluginAsync } from "fastify";
import { createUserSchema } from "./users.schemas.js";
import { createUser, listUsers } from "./users.service.js";

export const usersRoutes: FastifyPluginAsync = async (server) => {
  server.get("/users", async () => {
    return listUsers();
  });

  server.post("/users", async (request, reply) => {
    const body = createUserSchema.parse(request.body);
    const user = await createUser(body);

    return reply.code(201).send(user);
  });
};
