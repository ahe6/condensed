ALTER TABLE "orders"
ADD COLUMN "inventoryReleasedAt" TIMESTAMP(3);

CREATE INDEX "orders_inventoryReleasedAt_idx" ON "orders"("inventoryReleasedAt");
