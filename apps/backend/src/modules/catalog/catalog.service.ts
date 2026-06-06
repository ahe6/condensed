import { ProductStatus } from "@prisma/client";
import { prisma } from "../../prisma.js";
import type {
  AddProductImageInput,
  AssignProductCategoryInput,
  CreateCategoryInput,
  CreateProductInput,
  CreateProductVariantInput,
  SetVariantInventoryInput,
  UpdateProductInput,
  UpdateProductVariantInput
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
  return prisma.product.findFirst({
    where: {
      slug,
      status: ProductStatus.ACTIVE
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
      purchaseMode: input.purchaseMode,
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

export function updateProduct(productId: string, input: UpdateProductInput) {
  return prisma.product.update({
    where: {
      id: productId
    },
    data: input,
    include: productInclude
  });
}

export function setProductStatus(productId: string, status: ProductStatus) {
  return prisma.product.update({
    where: {
      id: productId
    },
    data: {
      status
    },
    include: productInclude
  });
}

export async function assignProductCategory(productId: string, input: AssignProductCategoryInput) {
  await prisma.productCategory.upsert({
    where: {
      productId_categoryId: {
        productId,
        categoryId: input.categoryId
      }
    },
    create: {
      productId,
      categoryId: input.categoryId
    },
    update: {}
  });

  return prisma.product.findUniqueOrThrow({
    where: {
      id: productId
    },
    include: productInclude
  });
}

export async function removeProductCategory(productId: string, categoryId: string) {
  await prisma.productCategory.delete({
    where: {
      productId_categoryId: {
        productId,
        categoryId
      }
    }
  });

  return prisma.product.findUniqueOrThrow({
    where: {
      id: productId
    },
    include: productInclude
  });
}

export function addProductImage(productId: string, input: AddProductImageInput) {
  return prisma.productImage.create({
    data: {
      ...input,
      productId
    }
  });
}

export function updateProductVariant(variantId: string, input: UpdateProductVariantInput) {
  return prisma.productVariant.update({
    where: {
      id: variantId
    },
    data: input
  });
}

export function setVariantInventory(variantId: string, input: SetVariantInventoryInput) {
  return prisma.productVariant.update({
    where: {
      id: variantId
    },
    data: {
      inventoryQuantity: input.inventoryQuantity
    }
  });
}
