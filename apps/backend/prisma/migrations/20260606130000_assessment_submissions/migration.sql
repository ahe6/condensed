CREATE TYPE "AssessmentSubmissionStatus" AS ENUM ('SUBMITTED', 'REVIEW_REQUIRED', 'APPROVED', 'REJECTED');

CREATE TABLE "assessment_submissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "templateId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "userId" UUID,
    "email" TEXT,
    "status" "AssessmentSubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_submissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "assessment_answers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "submissionId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "questionKey" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_answers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "assessment_submissions_templateId_submittedAt_idx" ON "assessment_submissions"("templateId", "submittedAt");
CREATE INDEX "assessment_submissions_productId_submittedAt_idx" ON "assessment_submissions"("productId", "submittedAt");
CREATE INDEX "assessment_submissions_userId_submittedAt_idx" ON "assessment_submissions"("userId", "submittedAt");
CREATE INDEX "assessment_submissions_status_submittedAt_idx" ON "assessment_submissions"("status", "submittedAt");
CREATE UNIQUE INDEX "assessment_answers_submissionId_questionKey_key" ON "assessment_answers"("submissionId", "questionKey");
CREATE INDEX "assessment_answers_questionId_idx" ON "assessment_answers"("questionId");

ALTER TABLE "assessment_submissions"
ADD CONSTRAINT "assessment_submissions_templateId_fkey"
FOREIGN KEY ("templateId") REFERENCES "assessment_templates"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "assessment_submissions"
ADD CONSTRAINT "assessment_submissions_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "products"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "assessment_submissions"
ADD CONSTRAINT "assessment_submissions_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "assessment_answers"
ADD CONSTRAINT "assessment_answers_submissionId_fkey"
FOREIGN KEY ("submissionId") REFERENCES "assessment_submissions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "assessment_answers"
ADD CONSTRAINT "assessment_answers_questionId_fkey"
FOREIGN KEY ("questionId") REFERENCES "assessment_questions"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
