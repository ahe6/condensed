CREATE TYPE "ShipmentTrackingEventSource" AS ENUM ('SYSTEM', 'ADMIN_MANUAL');

CREATE TABLE "shipment_tracking_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shipmentId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "fromCarrier" TEXT,
    "toCarrier" TEXT,
    "fromTrackingNumber" TEXT,
    "toTrackingNumber" TEXT,
    "source" "ShipmentTrackingEventSource" NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_tracking_events_pkey" PRIMARY KEY ("id")
);

INSERT INTO "shipment_tracking_events" (
    "shipmentId",
    "orderId",
    "fromCarrier",
    "toCarrier",
    "fromTrackingNumber",
    "toTrackingNumber",
    "source",
    "reason",
    "metadata",
    "createdAt"
)
SELECT
    "id",
    "orderId",
    NULL,
    "carrier",
    NULL,
    "trackingNumber",
    'SYSTEM'::"ShipmentTrackingEventSource",
    'Backfilled current shipment tracking',
    jsonb_build_object(
        'status', "status"
    ),
    "updatedAt"
FROM "shipments"
WHERE "carrier" IS NOT NULL OR "trackingNumber" IS NOT NULL;

CREATE INDEX "shipment_tracking_events_shipmentId_createdAt_idx" ON "shipment_tracking_events"("shipmentId", "createdAt");
CREATE INDEX "shipment_tracking_events_orderId_createdAt_idx" ON "shipment_tracking_events"("orderId", "createdAt");

ALTER TABLE "shipment_tracking_events" ADD CONSTRAINT "shipment_tracking_events_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "shipment_tracking_events" ADD CONSTRAINT "shipment_tracking_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
