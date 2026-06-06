CREATE TYPE "AssessmentTemplateStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

CREATE TYPE "AssessmentQuestionType" AS ENUM ('SINGLE_SELECT', 'MULTI_SELECT', 'TEXT', 'NUMBER', 'BOOLEAN');

CREATE TABLE "assessment_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "AssessmentTemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "assessment_questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "templateId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "helpText" TEXT,
    "type" "AssessmentQuestionType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "options" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_questions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "assessment_templates_slug_version_key" ON "assessment_templates"("slug", "version");
CREATE INDEX "assessment_templates_productId_status_version_idx" ON "assessment_templates"("productId", "status", "version");
CREATE UNIQUE INDEX "assessment_questions_templateId_key_key" ON "assessment_questions"("templateId", "key");
CREATE INDEX "assessment_questions_templateId_sortOrder_idx" ON "assessment_questions"("templateId", "sortOrder");

ALTER TABLE "assessment_templates"
ADD CONSTRAINT "assessment_templates_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "products"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "assessment_questions"
ADD CONSTRAINT "assessment_questions_templateId_fkey"
FOREIGN KEY ("templateId") REFERENCES "assessment_templates"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
