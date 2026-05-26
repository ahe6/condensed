import { ProductStatus } from "@prisma/client";
import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase URL slug");

const currencySchema = z
  .string()
  .trim()
  .length(3)
  .transform((value) => value.toUpperCase());

export const productSlugParamsSchema = z.object({
  slug: slugSchema
});

export const productIdParamsSchema = z.object({
  id: z.string().uuid()
});

export const variantIdParamsSchema = z.object({
  id: z.string().uuid()
});

export const productCategoryParamsSchema = z.object({
  id: z.string().uuid(),
  categoryId: z.string().uuid()
});

const productImageSchema = z.object({
  url: z.string().url(),
  altText: z.string().trim().min(1).optional(),
  sortOrder: z.number().int().min(0).default(0)
});

const productVariantBaseSchema = z.object({
  sku: z.string().trim().min(1),
  title: z.string().trim().min(1),
  price: z.string().regex(/^\d+(?:\.\d{1,2})?$/, "Use a decimal price with up to two cents")
});

const productVariantSchema = productVariantBaseSchema.extend({
  currency: currencySchema.default("USD"),
  inventoryQuantity: z.number().int().min(0).default(0)
});

export const createCategorySchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1),
  parentId: z.string().uuid().optional()
});

export const createProductSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  categoryIds: z.array(z.string().uuid()).default([]),
  images: z.array(productImageSchema).default([]),
  variants: z.array(productVariantSchema).default([])
});

export const updateProductSchema = z
  .object({
    slug: slugSchema.optional(),
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).nullable().optional(),
    status: z.nativeEnum(ProductStatus).optional()
  })
  .refine((value) => Object.keys(value).length > 0, "At least one product field is required");

export const assignProductCategorySchema = z.object({
  categoryId: z.string().uuid()
});

export const addProductImageSchema = productImageSchema;

export const createProductVariantSchema = productVariantSchema;

export const updateProductVariantSchema = productVariantBaseSchema
  .extend({
    currency: currencySchema.optional(),
    inventoryQuantity: z.number().int().min(0).optional()
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one variant field is required");

export const setVariantInventorySchema = z.object({
  inventoryQuantity: z.number().int().min(0)
});

export type AddProductImageInput = z.infer<typeof addProductImageSchema>;
export type AssignProductCategoryInput = z.infer<typeof assignProductCategorySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type CreateProductVariantInput = z.infer<typeof createProductVariantSchema>;
export type SetVariantInventoryInput = z.infer<typeof setVariantInventorySchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type UpdateProductVariantInput = z.infer<typeof updateProductVariantSchema>;
