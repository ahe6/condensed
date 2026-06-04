import type { FastifyPluginAsync } from "fastify";
import { updateCurrentUserSchema } from "./auth.schemas.js";
import { getCurrentUser, listCurrentUserOrders, updateCurrentUserProfile } from "./auth.service.js";

export const authRoutes: FastifyPluginAsync = async (server) => {
  server.get("/me", async (request) => {
    return getCurrentUser(request.headers.authorization);
  });

  server.patch("/me", async (request) => {
    const currentUser = await getCurrentUser(request.headers.authorization);
    const body = updateCurrentUserSchema.parse(request.body);

    return updateCurrentUserProfile(currentUser.id, body);
  });

  server.get("/me/orders", async (request) => {
    return listCurrentUserOrders(request.headers.authorization);
  });
};
