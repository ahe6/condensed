CREATE TYPE "ShipmentStatusEventSource" AS ENUM ('SYSTEM', 'ADMIN_MANUAL');

CREATE TABLE "shipment_status_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shipmentId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "fromStatus" "ShipmentStatus",
    "toStatus" "ShipmentStatus" NOT NULL,
    "source" "ShipmentStatusEventSource" NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_status_events_pkey" PRIMARY KEY ("id")
);

INSERT INTO "shipment_status_events" (
    "shipmentId",
    "orderId",
    "fromStatus",
    "toStatus",
    "source",
    "reason",
    "metadata",
    "createdAt"
)
SELECT
    "id",
    "orderId",
    NULL,
    "status",
    'SYSTEM'::"ShipmentStatusEventSource",
    'Backfilled current shipment status',
    jsonb_build_object(
        'carrier', "carrier",
        'trackingNumber', "trackingNumber",
        'shippedAt', "shippedAt",
        'deliveredAt', "deliveredAt"
    ),
    "createdAt"
FROM "shipments";

CREATE INDEX "shipment_status_events_shipmentId_createdAt_idx" ON "shipment_status_events"("shipmentId", "createdAt");
CREATE INDEX "shipment_status_events_orderId_createdAt_idx" ON "shipment_status_events"("orderId", "createdAt");

ALTER TABLE "shipment_status_events" ADD CONSTRAINT "shipment_status_events_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "shipment_status_events" ADD CONSTRAINT "shipment_status_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
