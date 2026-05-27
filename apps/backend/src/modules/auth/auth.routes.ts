import type { FastifyPluginAsync } from "fastify";
import { getCurrentUser, listCurrentUserOrders } from "./auth.service.js";

export const authRoutes: FastifyPluginAsync = async (server) => {
  server.get("/me", async (request) => {
    return getCurrentUser(request.headers.authorization);
  });

  server.get("/me/orders", async (request) => {
    return listCurrentUserOrders(request.headers.authorization);
  });
};
