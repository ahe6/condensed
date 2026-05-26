import type { FastifyPluginAsync } from "fastify";
import {
  createCategorySchema,
  createProductSchema,
  createProductVariantSchema,
  productIdParamsSchema,
  productSlugParamsSchema
} from "./catalog.schemas.js";
import {
  createCategory,
  createProduct,
  createProductVariant,
  getProductBySlug,
  listAdminProducts,
  listCategories,
  listProducts
} from "./catalog.service.js";

export const catalogRoutes: FastifyPluginAsync = async (server) => {
  server.get("/products", async () => {
    return listProducts();
  });

  server.get("/products/:slug", async (request, reply) => {
    const { slug } = productSlugParamsSchema.parse(request.params);
    const product = await getProductBySlug(slug);

    if (!product) {
      return reply.code(404).send({
        error: "Not Found"
      });
    }

    return product;
  });

  server.get("/categories", async () => {
    return listCategories();
  });

  server.get("/admin/products", async () => {
    return listAdminProducts();
  });

  server.post("/admin/products", async (request, reply) => {
    const body = createProductSchema.parse(request.body);
    const product = await createProduct(body);

    return reply.code(201).send(product);
  });

  server.post("/admin/products/:id/variants", async (request, reply) => {
    const { id } = productIdParamsSchema.parse(request.params);
    const body = createProductVariantSchema.parse(request.body);
    const variant = await createProductVariant(id, body);

    return reply.code(201).send(variant);
  });

  server.post("/admin/categories", async (request, reply) => {
    const body = createCategorySchema.parse(request.body);
    const category = await createCategory(body);

    return reply.code(201).send(category);
  });
};
