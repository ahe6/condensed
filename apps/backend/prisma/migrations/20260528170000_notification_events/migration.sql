-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SHIPMENT_DELIVERED');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "notification_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderId" UUID NOT NULL,
    "shipmentId" UUID,
    "type" "NotificationType" NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_events_shipmentId_type_key" ON "notification_events"("shipmentId", "type");

-- CreateIndex
CREATE INDEX "notification_events_orderId_createdAt_idx" ON "notification_events"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "notification_events_shipmentId_createdAt_idx" ON "notification_events"("shipmentId", "createdAt");

-- CreateIndex
CREATE INDEX "notification_events_status_createdAt_idx" ON "notification_events"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
