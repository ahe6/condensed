import type { FastifyPluginAsync } from "fastify";
import {
  addCartItemSchema,
  cartIdParamsSchema,
  cartItemParamsSchema,
  createCartSchema,
  updateCartItemSchema
} from "./carts.schemas.js";
import {
  addCartItem,
  clearCart,
  createCart,
  getCart,
  removeCartItem,
  updateCartItemQuantity
} from "./carts.service.js";

export const cartsRoutes: FastifyPluginAsync = async (server) => {
  server.post("/carts", async (request, reply) => {
    const body = createCartSchema.parse(request.body ?? {});
    const cart = await createCart(body);

    return reply.code(201).send(cart);
  });

  server.get("/carts/:id", async (request, reply) => {
    const { id } = cartIdParamsSchema.parse(request.params);
    const cart = await getCart(id);

    if (!cart) {
      return reply.code(404).send({
        error: "Not Found"
      });
    }

    return cart;
  });

  server.post("/carts/:id/items", async (request, reply) => {
    const { id } = cartIdParamsSchema.parse(request.params);
    const body = addCartItemSchema.parse(request.body);
    const cart = await addCartItem(id, body);

    return reply.code(201).send(cart);
  });

  server.patch("/carts/:id/items/:itemId", async (request) => {
    const { id, itemId } = cartItemParamsSchema.parse(request.params);
    const body = updateCartItemSchema.parse(request.body);

    return updateCartItemQuantity(id, itemId, body);
  });

  server.delete("/carts/:id/items/:itemId", async (request) => {
    const { id, itemId } = cartItemParamsSchema.parse(request.params);

    return removeCartItem(id, itemId);
  });

  server.delete("/carts/:id/items", async (request) => {
    const { id } = cartIdParamsSchema.parse(request.params);

    return clearCart(id);
  });
};
