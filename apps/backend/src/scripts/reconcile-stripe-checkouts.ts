import { expireDueOrderReservations } from "../modules/orders/orders.service.js";
import { reconcileStripeCheckoutSessions } from "../modules/payments/payments.service.js";
import { prisma } from "../prisma.js";

const olderThanMinutes = parsePositiveInt(process.env.STRIPE_CHECKOUT_RECONCILE_MINUTES, 15);
const batchSize = parsePositiveInt(process.env.STRIPE_CHECKOUT_RECONCILE_BATCH_SIZE, 50);

try {
  const stripeCheckoutReconciliation = await reconcileStripeCheckoutSessions({
    batchSize,
    olderThanMinutes
  });
  const orderReservationExpiration = await expireDueOrderReservations({
    batchSize
  });

  console.log(
    JSON.stringify(
      {
        stripeCheckoutReconciliation,
        orderReservationExpiration
      },
      null,
      2
    )
  );
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
