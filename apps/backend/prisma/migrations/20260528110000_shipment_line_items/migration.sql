CREATE TABLE "shipment_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shipmentId" UUID NOT NULL,
    "orderItemId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipment_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "shipment_items"
    ADD CONSTRAINT "shipment_items_quantity_check" CHECK ("quantity" > 0);

CREATE UNIQUE INDEX "shipment_items_shipmentId_orderItemId_key"
    ON "shipment_items"("shipmentId", "orderItemId");

CREATE INDEX "shipment_items_orderItemId_idx"
    ON "shipment_items"("orderItemId");

ALTER TABLE "shipment_items"
    ADD CONSTRAINT "shipment_items_shipmentId_fkey"
    FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "shipment_items"
    ADD CONSTRAINT "shipment_items_orderItemId_fkey"
    FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

WITH first_shipments AS (
    SELECT
        s."id" AS "shipmentId",
        s."orderId",
        ROW_NUMBER() OVER (PARTITION BY s."orderId" ORDER BY s."createdAt", s."id") AS rn
    FROM "shipments" s
)
INSERT INTO "shipment_items" ("shipmentId", "orderItemId", "quantity", "updatedAt")
SELECT
    fs."shipmentId",
    oi."id",
    oi."quantity",
    CURRENT_TIMESTAMP
FROM first_shipments fs
JOIN "order_items" oi ON oi."orderId" = fs."orderId"
WHERE fs.rn = 1;
