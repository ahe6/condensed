#!/usr/bin/env node
import { createPrismaClient } from "./database-url.mjs";

const expectedConfirmation = "health-dev";

if (process.env.CONFIRM_DEV_DATA_RESET !== expectedConfirmation) {
  throw new Error(`Set CONFIRM_DEV_DATA_RESET=${expectedConfirmation} to reset dev app data.`);
}

const prisma = await createPrismaClient();

const tables = [
  "checkout_authorizations",
  "assessment_answers",
  "assessment_submissions",
  "assessment_questions",
  "assessment_templates",
  "notification_events",
  "shipment_tracking_events",
  "shipment_status_events",
  "shipment_items",
  "shipments",
  "payment_status_events",
  "payment_attempts",
  "payments",
  "order_notes",
  "order_items",
  "order_addresses",
  "orders",
  "cart_items",
  "carts",
  "addresses",
  "users",
  "product_categories",
  "product_images",
  "product_variants",
  "products",
  "categories"
];

try {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables.join(", ")} RESTART IDENTITY CASCADE`);
  console.log(`Reset dev app data across ${tables.length} tables`);
} finally {
  await prisma.$disconnect();
}
