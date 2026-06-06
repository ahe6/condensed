import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase URL slug");

export const assessmentProductSlugParamsSchema = z.object({
  slug: slugSchema
});

const assessmentAnswerValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string())
]);

export const submitAssessmentSchema = z.object({
  answers: z.record(assessmentAnswerValueSchema),
  email: z.string().trim().email().optional()
});

export type AssessmentAnswerValue = z.infer<typeof assessmentAnswerValueSchema>;
export type SubmitAssessmentInput = z.infer<typeof submitAssessmentSchema>;
