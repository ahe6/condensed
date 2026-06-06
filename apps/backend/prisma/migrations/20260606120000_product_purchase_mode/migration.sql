CREATE TYPE "ProductPurchaseMode" AS ENUM ('DIRECT', 'ASSESSMENT_REQUIRED');

ALTER TABLE "products"
ADD COLUMN "purchaseMode" "ProductPurchaseMode" NOT NULL DEFAULT 'DIRECT';
