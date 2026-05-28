import type { FastifyPluginAsync } from "fastify";
import { updateCurrentUserSchema } from "../users/users.schemas.js";
import { updateUserProfile } from "../users/users.service.js";
import { getCurrentUser, listCurrentUserOrders } from "./auth.service.js";

export const authRoutes: FastifyPluginAsync = async (server) => {
  server.get("/me", async (request) => {
    return getCurrentUser(request.headers.authorization);
  });

  server.patch("/me", async (request) => {
    const currentUser = await getCurrentUser(request.headers.authorization);
    const body = updateCurrentUserSchema.parse(request.body);

    return updateUserProfile(currentUser.id, body);
  });

  server.get("/me/orders", async (request) => {
    return listCurrentUserOrders(request.headers.authorization);
  });
};
