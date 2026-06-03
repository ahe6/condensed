-- CreateEnum
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('OPEN', 'COMPLETED', 'EXPIRED', 'FAILED', 'CANCELED');

-- CreateTable
CREATE TABLE "payment_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "paymentId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAttemptId" TEXT NOT NULL,
    "providerPaymentIntentId" TEXT,
    "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'OPEN',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "expiresAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);

-- Backfill existing Stripe Checkout Session payment rows as attempts.
INSERT INTO "payment_attempts" (
    "paymentId",
    "orderId",
    "provider",
    "providerAttemptId",
    "providerPaymentIntentId",
    "status",
    "amount",
    "currency",
    "completedAt",
    "expiredAt",
    "failedAt",
    "metadata",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "orderId",
    "provider",
    "providerPaymentId",
    "metadata"->>'paymentIntentId',
    CASE
        WHEN "status" IN ('PAID', 'AUTHORIZED', 'REFUNDED', 'DISPUTED') THEN 'COMPLETED'::"PaymentAttemptStatus"
        WHEN "status" = 'EXPIRED' THEN 'EXPIRED'::"PaymentAttemptStatus"
        WHEN "status" = 'FAILED' THEN 'FAILED'::"PaymentAttemptStatus"
        ELSE 'OPEN'::"PaymentAttemptStatus"
    END,
    "amount",
    "currency",
    CASE WHEN "status" IN ('PAID', 'AUTHORIZED', 'REFUNDED', 'DISPUTED') THEN "processedAt" ELSE NULL END,
    CASE WHEN "status" = 'EXPIRED' THEN "processedAt" ELSE NULL END,
    CASE WHEN "status" = 'FAILED' THEN "processedAt" ELSE NULL END,
    "metadata",
    "createdAt",
    "updatedAt"
FROM "payments"
WHERE "provider" = 'stripe'
  AND "providerPaymentId" IS NOT NULL
  AND "providerPaymentId" LIKE 'cs_%';

-- AlterTable
ALTER TABLE "payment_status_events" ADD COLUMN "paymentAttemptId" UUID;

-- Backfill payment event attempt links where provider object ids match attempts.
UPDATE "payment_status_events" pse
SET "paymentAttemptId" = pa."id"
FROM "payment_attempts" pa
WHERE pse."paymentId" = pa."paymentId"
  AND pse."providerObjectId" = pa."providerAttemptId";

-- CreateIndex
CREATE UNIQUE INDEX "payment_attempts_provider_providerAttemptId_key" ON "payment_attempts"("provider", "providerAttemptId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_attempts_provider_providerPaymentIntentId_key" ON "payment_attempts"("provider", "providerPaymentIntentId");

-- CreateIndex
CREATE INDEX "payment_attempts_paymentId_idx" ON "payment_attempts"("paymentId");

-- CreateIndex
CREATE INDEX "payment_attempts_orderId_idx" ON "payment_attempts"("orderId");

-- CreateIndex
CREATE INDEX "payment_attempts_status_idx" ON "payment_attempts"("status");

-- CreateIndex
CREATE INDEX "payment_attempts_expiresAt_idx" ON "payment_attempts"("expiresAt");

-- CreateIndex
CREATE INDEX "payment_status_events_paymentAttemptId_createdAt_idx" ON "payment_status_events"("paymentAttemptId", "createdAt");

-- AddForeignKey
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_status_events" ADD CONSTRAINT "payment_status_events_paymentAttemptId_fkey" FOREIGN KEY ("paymentAttemptId") REFERENCES "payment_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
