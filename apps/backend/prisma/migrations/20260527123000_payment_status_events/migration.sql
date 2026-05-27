CREATE TYPE "PaymentStatusEventSource" AS ENUM ('SYSTEM', 'ADMIN_MANUAL', 'ADMIN_SYNC', 'STRIPE_WEBHOOK');

CREATE TABLE "payment_status_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "paymentId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "fromStatus" "PaymentStatus",
    "toStatus" "PaymentStatus" NOT NULL,
    "source" "PaymentStatusEventSource" NOT NULL,
    "providerEventId" TEXT,
    "providerObjectId" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_status_events_pkey" PRIMARY KEY ("id")
);

INSERT INTO "payment_status_events" (
    "paymentId",
    "orderId",
    "fromStatus",
    "toStatus",
    "source",
    "providerObjectId",
    "reason",
    "metadata",
    "createdAt"
)
SELECT
    "id",
    "orderId",
    NULL,
    "status",
    'SYSTEM'::"PaymentStatusEventSource",
    "providerPaymentId",
    'Backfilled current payment status',
    "metadata",
    "createdAt"
FROM "payments";

CREATE UNIQUE INDEX "payment_status_events_providerEventId_key" ON "payment_status_events"("providerEventId");
CREATE INDEX "payment_status_events_paymentId_createdAt_idx" ON "payment_status_events"("paymentId", "createdAt");
CREATE INDEX "payment_status_events_orderId_createdAt_idx" ON "payment_status_events"("orderId", "createdAt");
CREATE INDEX "payment_status_events_providerObjectId_idx" ON "payment_status_events"("providerObjectId");

ALTER TABLE "payment_status_events" ADD CONSTRAINT "payment_status_events_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_status_events" ADD CONSTRAINT "payment_status_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
