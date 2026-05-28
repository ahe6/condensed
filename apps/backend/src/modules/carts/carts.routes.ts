import type { FastifyPluginAsync } from "fastify";
import { getCurrentUser, getOptionalCurrentUser } from "../auth/auth.service.js";
import {
  addCartItemSchema,
  cartIdParamsSchema,
  cartItemParamsSchema,
  createCartSchema,
  getMyCartSchema,
  updateCartItemSchema
} from "./carts.schemas.js";
import {
  addCartItem,
  clearCart,
  createCart,
  getCart,
  getOrCreateUserCart,
  removeCartItem,
  updateCartItemQuantity
} from "./carts.service.js";

export const cartsRoutes: FastifyPluginAsync = async (server) => {
  server.get("/me/cart", async (request) => {
    const currentUser = await getCurrentUser(request.headers.authorization);

    return getOrCreateUserCart(currentUser.id);
  });

  server.post("/me/cart", async (request) => {
    const currentUser = await getCurrentUser(request.headers.authorization);
    const body = getMyCartSchema.parse(request.body ?? {});

    return getOrCreateUserCart(currentUser.id, body);
  });

  server.post("/carts", async (request, reply) => {
    const currentUser = await getOptionalCurrentUser(request.headers.authorization);
    const body = createCartSchema.parse(request.body ?? {});
    const cart = await createCart(body, currentUser?.id);

    return reply.code(201).send(cart);
  });

  server.get("/carts/:id", async (request, reply) => {
    const currentUser = await getOptionalCurrentUser(request.headers.authorization);
    const { id } = cartIdParamsSchema.parse(request.params);
    const cart = await getCart(id, currentUser?.id);

    if (!cart) {
      return reply.code(404).send({
        error: "Not Found"
      });
    }

    return cart;
  });

  server.post("/carts/:id/items", async (request, reply) => {
    const currentUser = await getOptionalCurrentUser(request.headers.authorization);
    const { id } = cartIdParamsSchema.parse(request.params);
    const body = addCartItemSchema.parse(request.body);
    const cart = await addCartItem(id, body, currentUser?.id);

    return reply.code(201).send(cart);
  });

  server.patch("/carts/:id/items/:itemId", async (request) => {
    const currentUser = await getOptionalCurrentUser(request.headers.authorization);
    const { id, itemId } = cartItemParamsSchema.parse(request.params);
    const body = updateCartItemSchema.parse(request.body);

    return updateCartItemQuantity(id, itemId, body, currentUser?.id);
  });

  server.delete("/carts/:id/items/:itemId", async (request) => {
    const currentUser = await getOptionalCurrentUser(request.headers.authorization);
    const { id, itemId } = cartItemParamsSchema.parse(request.params);

    return removeCartItem(id, itemId, currentUser?.id);
  });

  server.delete("/carts/:id/items", async (request) => {
    const currentUser = await getOptionalCurrentUser(request.headers.authorization);
    const { id } = cartIdParamsSchema.parse(request.params);

    return clearCart(id, currentUser?.id);
  });
};
