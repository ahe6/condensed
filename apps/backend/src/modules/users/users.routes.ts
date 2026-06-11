import type { FastifyPluginAsync } from "fastify";
import { getCurrentUser } from "../auth/auth.service.js";
import {
  addressIdParamsSchema,
  createAddressSchema,
  createUserSchema,
  updateAddressSchema
} from "./users.schemas.js";
import {
  createUser,
  createUserAddress,
  deleteUserAddress,
  listUserAddresses,
  listUsers,
  updateUserAddress
} from "./users.service.js";

export const usersRoutes: FastifyPluginAsync = async (server) => {
  server.get("/admin/users", async () => {
    return listUsers();
  });

  server.post("/admin/users", async (request, reply) => {
    const body = createUserSchema.parse(request.body);
    const user = await createUser(body);

    return reply.code(201).send(user);
  });

  server.get("/me/addresses", async (request) => {
    const currentUser = await getCurrentUser(request.headers.authorization);

    return listUserAddresses(currentUser.id);
  });

  server.post("/me/addresses", async (request, reply) => {
    const currentUser = await getCurrentUser(request.headers.authorization);
    const body = createAddressSchema.parse(request.body);
    const address = await createUserAddress(currentUser.id, body);

    return reply.code(201).send(address);
  });

  server.patch("/me/addresses/:id", async (request) => {
    const currentUser = await getCurrentUser(request.headers.authorization);
    const { id } = addressIdParamsSchema.parse(request.params);
    const body = updateAddressSchema.parse(request.body);

    return updateUserAddress(currentUser.id, id, body);
  });

  server.delete("/me/addresses/:id", async (request) => {
    const currentUser = await getCurrentUser(request.headers.authorization);
    const { id } = addressIdParamsSchema.parse(request.params);

    return deleteUserAddress(currentUser.id, id);
  });
};
