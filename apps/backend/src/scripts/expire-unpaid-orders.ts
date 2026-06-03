import { reconcileStripeCheckoutSessions } from "../modules/payments/payments.service.js";
import { prisma } from "../prisma.js";

const olderThanMinutes = parsePositiveInt(process.env.ORDER_EXPIRY_MINUTES, 15);
const batchSize = parsePositiveInt(process.env.ORDER_EXPIRY_BATCH_SIZE, 50);

try {
  const result = await reconcileStripeCheckoutSessions({
    batchSize,
    olderThanMinutes
  });

  console.log(JSON.stringify(result, null, 2));
} finally {
  await prisma.$disconnect();
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Expected a positive integer, received ${value}`);
  }

  return parsed;
}
