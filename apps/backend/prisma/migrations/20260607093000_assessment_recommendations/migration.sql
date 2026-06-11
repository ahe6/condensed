CREATE TYPE "AssessmentRecommendationStatus" AS ENUM ('RECOMMENDED', 'SELECTED', 'DISMISSED');

CREATE TABLE "assessment_recommendations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "assessmentSubmissionId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "status" "AssessmentRecommendationStatus" NOT NULL DEFAULT 'RECOMMENDED',
    "rank" INTEGER NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "reasonText" TEXT,
    "sourcePolicyId" TEXT NOT NULL,
    "sourcePolicyVersion" INTEGER NOT NULL,
    "selectedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "assessment_recommendations_assessmentSubmissionId_productId_key"
ON "assessment_recommendations"("assessmentSubmissionId", "productId");

CREATE INDEX "assessment_recommendations_assessmentSubmissionId_rank_idx"
ON "assessment_recommendations"("assessmentSubmissionId", "rank");

CREATE INDEX "assessment_recommendations_productId_idx"
ON "assessment_recommendations"("productId");

ALTER TABLE "assessment_recommendations"
ADD CONSTRAINT "assessment_recommendations_assessmentSubmissionId_fkey"
FOREIGN KEY ("assessmentSubmissionId") REFERENCES "assessment_submissions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "assessment_recommendations"
ADD CONSTRAINT "assessment_recommendations_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "products"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
