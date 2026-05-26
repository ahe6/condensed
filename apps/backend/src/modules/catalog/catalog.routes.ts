import { ProductStatus } from "@prisma/client";
import type { FastifyPluginAsync } from "fastify";
import {
  addProductImageSchema,
  assignProductCategorySchema,
  createCategorySchema,
  createProductSchema,
  createProductVariantSchema,
  productCategoryParamsSchema,
  productIdParamsSchema,
  productSlugParamsSchema,
  setVariantInventorySchema,
  updateProductSchema,
  updateProductVariantSchema,
  variantIdParamsSchema
} from "./catalog.schemas.js";
import {
  addProductImage,
  assignProductCategory,
  createCategory,
  createProduct,
  createProductVariant,
  getProductBySlug,
  listAdminProducts,
  listCategories,
  listProducts,
  removeProductCategory,
  setProductStatus,
  setVariantInventory,
  updateProduct,
  updateProductVariant
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

  server.patch("/admin/products/:id", async (request) => {
    const { id } = productIdParamsSchema.parse(request.params);
    const body = updateProductSchema.parse(request.body);

    return updateProduct(id, body);
  });

  server.post("/admin/products/:id/publish", async (request) => {
    const { id } = productIdParamsSchema.parse(request.params);

    return setProductStatus(id, ProductStatus.ACTIVE);
  });

  server.post("/admin/products/:id/archive", async (request) => {
    const { id } = productIdParamsSchema.parse(request.params);

    return setProductStatus(id, ProductStatus.ARCHIVED);
  });

  server.post("/admin/products/:id/categories", async (request) => {
    const { id } = productIdParamsSchema.parse(request.params);
    const body = assignProductCategorySchema.parse(request.body);

    return assignProductCategory(id, body);
  });

  server.delete("/admin/products/:id/categories/:categoryId", async (request) => {
    const { id, categoryId } = productCategoryParamsSchema.parse(request.params);

    return removeProductCategory(id, categoryId);
  });

  server.post("/admin/products/:id/images", async (request, reply) => {
    const { id } = productIdParamsSchema.parse(request.params);
    const body = addProductImageSchema.parse(request.body);
    const image = await addProductImage(id, body);

    return reply.code(201).send(image);
  });

  server.post("/admin/products/:id/variants", async (request, reply) => {
    const { id } = productIdParamsSchema.parse(request.params);
    const body = createProductVariantSchema.parse(request.body);
    const variant = await createProductVariant(id, body);

    return reply.code(201).send(variant);
  });

  server.patch("/admin/variants/:id", async (request) => {
    const { id } = variantIdParamsSchema.parse(request.params);
    const body = updateProductVariantSchema.parse(request.body);

    return updateProductVariant(id, body);
  });

  server.patch("/admin/variants/:id/inventory", async (request) => {
    const { id } = variantIdParamsSchema.parse(request.params);
    const body = setVariantInventorySchema.parse(request.body);

    return setVariantInventory(id, body);
  });

  server.post("/admin/categories", async (request, reply) => {
    const body = createCategorySchema.parse(request.body);
    const category = await createCategory(body);

    return reply.code(201).send(category);
  });
};
