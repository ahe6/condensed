CREATE TYPE "AssessmentTemplateType" AS ENUM ('PRODUCT_INTAKE', 'GOAL_INTAKE');

CREATE TYPE "CheckoutAuthorizationStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'REVOKED');

ALTER TABLE "assessment_templates"
ADD COLUMN "goalKey" TEXT,
ADD COLUMN "type" "AssessmentTemplateType" NOT NULL DEFAULT 'PRODUCT_INTAKE';

ALTER TABLE "assessment_templates"
ALTER COLUMN "productId" DROP NOT NULL;

ALTER TABLE "assessment_submissions"
ADD COLUMN "goalKey" TEXT,
ADD COLUMN "decisionReason" TEXT,
ADD COLUMN "decisionPolicyId" TEXT,
ADD COLUMN "decisionPolicyVersion" INTEGER,
ADD COLUMN "decidedAt" TIMESTAMP(3);

ALTER TABLE "assessment_submissions"
ALTER COLUMN "productId" DROP NOT NULL;

CREATE TABLE "checkout_authorizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "variantId" UUID,
    "assessmentSubmissionId" UUID NOT NULL,
    "status" "CheckoutAuthorizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checkout_authorizations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "assessment_templates_type_goalKey_status_version_idx"
ON "assessment_templates"("type", "goalKey", "status", "version");

CREATE INDEX "assessment_submissions_goalKey_submittedAt_idx"
ON "assessment_submissions"("goalKey", "submittedAt");

CREATE INDEX "checkout_authorizations_userId_productId_status_expiresAt_idx"
ON "checkout_authorizations"("userId", "productId", "status", "expiresAt");

CREATE INDEX "checkout_authorizations_assessmentSubmissionId_idx"
ON "checkout_authorizations"("assessmentSubmissionId");

CREATE INDEX "checkout_authorizations_variantId_idx"
ON "checkout_authorizations"("variantId");

ALTER TABLE "checkout_authorizations"
ADD CONSTRAINT "checkout_authorizations_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "checkout_authorizations"
ADD CONSTRAINT "checkout_authorizations_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "products"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "checkout_authorizations"
ADD CONSTRAINT "checkout_authorizations_variantId_fkey"
FOREIGN KEY ("variantId") REFERENCES "product_variants"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "checkout_authorizations"
ADD CONSTRAINT "checkout_authorizations_assessmentSubmissionId_fkey"
FOREIGN KEY ("assessmentSubmissionId") REFERENCES "assessment_submissions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
