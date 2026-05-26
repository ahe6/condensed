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
  images: z
    .array(
      z.object({
        url: z.string().url(),
        altText: z.string().trim().min(1).optional(),
        sortOrder: z.number().int().min(0).default(0)
      })
    )
    .default([]),
  variants: z
    .array(
      z.object({
        sku: z.string().trim().min(1),
        title: z.string().trim().min(1),
        price: z.string().regex(/^\d+(?:\.\d{1,2})?$/, "Use a decimal price with up to two cents"),
        currency: currencySchema.default("USD"),
        inventoryQuantity: z.number().int().min(0).default(0)
      })
    )
    .default([])
});

export const createProductVariantSchema = z.object({
  sku: z.string().trim().min(1),
  title: z.string().trim().min(1),
  price: z.string().regex(/^\d+(?:\.\d{1,2})?$/, "Use a decimal price with up to two cents"),
  currency: currencySchema.default("USD"),
  inventoryQuantity: z.number().int().min(0).default(0)
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type CreateProductVariantInput = z.infer<typeof createProductVariantSchema>;
