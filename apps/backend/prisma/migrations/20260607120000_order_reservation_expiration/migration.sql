ALTER TABLE "orders"
ADD COLUMN "reservationExpiresAt" TIMESTAMP(3);

UPDATE "orders"
SET "reservationExpiresAt" = "createdAt" + INTERVAL '1 day'
WHERE "reservationExpiresAt" IS NULL
  AND "inventoryReleasedAt" IS NULL
  AND "status" IN ('PENDING', 'PLACED')
  AND "paymentStatus" IN ('UNPAID', 'FAILED', 'EXPIRED');

CREATE INDEX "orders_reservationExpiresAt_idx" ON "orders"("reservationExpiresAt");
