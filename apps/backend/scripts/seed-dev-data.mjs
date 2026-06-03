#!/usr/bin/env node
import { createPrismaClient } from "./database-url.mjs";

const prisma = await createPrismaClient();

try {
  const category = await prisma.category.upsert({
    where: {
      slug: "drinkware"
    },
    create: {
      slug: "drinkware",
      name: "Drinkware"
    },
    update: {
      name: "Drinkware"
    }
  });

  const product = await prisma.product.upsert({
    where: {
      slug: "dev-mug"
    },
    create: {
      slug: "dev-mug",
      name: "Dev Mug",
      description: "A sturdy mug for checkout and fulfillment testing.",
      status: "ACTIVE"
    },
    update: {
      name: "Dev Mug",
      description: "A sturdy mug for checkout and fulfillment testing.",
      status: "ACTIVE"
    }
  });

  await prisma.productCategory.upsert({
    where: {
      productId_categoryId: {
        productId: product.id,
        categoryId: category.id
      }
    },
    create: {
      productId: product.id,
      categoryId: category.id
    },
    update: {}
  });

  await prisma.productVariant.upsert({
    where: {
      sku: "DEV-MUG-001"
    },
    create: {
      productId: product.id,
      sku: "DEV-MUG-001",
      title: "Default",
      price: "19.99",
      currency: "USD",
      inventoryQuantity: 25
    },
    update: {
      productId: product.id,
      title: "Default",
      price: "19.99",
      currency: "USD",
      inventoryQuantity: 25
    }
  });

  await prisma.productImage.deleteMany({
    where: {
      productId: product.id
    }
  });

  await prisma.productImage.create({
    data: {
      productId: product.id,
      url: "https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?auto=format&fit=crop&w=1200&q=80",
      altText: "White ceramic mug on a table",
      sortOrder: 0
    }
  });

  console.log("Seeded dev catalog: dev-mug");
} finally {
  await prisma.$disconnect();
}
