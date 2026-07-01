DROP TABLE IF EXISTS "assessment_recommendations";
DROP TYPE IF EXISTS "AssessmentRecommendationStatus";

DELETE FROM "assessment_submissions"
WHERE "goalKey" IS NOT NULL OR "productId" IS NULL;

DELETE FROM "assessment_templates"
WHERE "goalKey" IS NOT NULL
  OR "productId" IS NULL
  OR "type" = 'GOAL_INTAKE';

DROP INDEX IF EXISTS "assessment_templates_type_goalKey_status_version_idx";
DROP INDEX IF EXISTS "assessment_submissions_goalKey_submittedAt_idx";

ALTER TABLE "assessment_templates"
DROP COLUMN IF EXISTS "goalKey",
DROP COLUMN IF EXISTS "type",
ALTER COLUMN "productId" SET NOT NULL;

ALTER TABLE "assessment_submissions"
DROP COLUMN IF EXISTS "goalKey",
ALTER COLUMN "productId" SET NOT NULL;

DROP TYPE IF EXISTS "AssessmentTemplateType";
