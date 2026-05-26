import { ProductStatus } from "@prisma/client";
import { prisma } from "../../prisma.js";
import type {
  CreateCategoryInput,
  CreateProductInput,
  CreateProductVariantInput
} from "./catalog.schemas.js";

const productInclude = {
  variants: {
    orderBy: {
      createdAt: "asc" as const
    }
  },
  images: {
    orderBy: {
      sortOrder: "asc" as const
    }
  },
  categories: {
    include: {
      category: true
    }
  }
};

export function listProducts() {
  return prisma.product.findMany({
    where: {
      status: ProductStatus.ACTIVE
    },
    include: productInclude,
    orderBy: {
      createdAt: "desc"
    }
  });
}

export function listAdminProducts() {
  return prisma.product.findMany({
    include: productInclude,
    orderBy: {
      createdAt: "desc"
    }
  });
}

export function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: {
      slug
    },
    include: productInclude
  });
}

export function listCategories() {
  return prisma.category.findMany({
    orderBy: {
      name: "asc"
    }
  });
}

export function createCategory(input: CreateCategoryInput) {
  return prisma.category.create({
    data: input
  });
}

export function createProduct(input: CreateProductInput) {
  return prisma.product.create({
    data: {
      slug: input.slug,
      name: input.name,
      description: input.description,
      status: input.status,
      variants: {
        create: input.variants
      },
      images: {
        create: input.images
      },
      categories: {
        create: input.categoryIds.map((categoryId) => ({
          categoryId
        }))
      }
    },
    include: productInclude
  });
}

export function createProductVariant(productId: string, input: CreateProductVariantInput) {
  return prisma.productVariant.create({
    data: {
      ...input,
      productId
    }
  });
}
