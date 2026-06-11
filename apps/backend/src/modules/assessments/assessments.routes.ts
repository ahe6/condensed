import type { FastifyPluginAsync } from "fastify";
import { getCurrentUser } from "../auth/auth.service.js";
import {
  assessmentGoalKeyParamsSchema,
  assessmentProductSlugParamsSchema,
  submitAssessmentSchema
} from "./assessments.schemas.js";
import {
  getActiveAssessmentForGoalKey,
  getActiveAssessmentForProductSlug,
  listAdminAssessmentSubmissions,
  submitAssessmentForGoalKey,
  submitAssessmentForProductSlug
} from "./assessments.service.js";

export const assessmentsRoutes: FastifyPluginAsync = async (server) => {
  server.get("/products/:slug/assessment", async (request, reply) => {
    const { slug } = assessmentProductSlugParamsSchema.parse(request.params);
    const assessment = await getActiveAssessmentForProductSlug(slug);

    if (!assessment) {
      return reply.code(404).send({
        error: "Not Found"
      });
    }

    return assessment;
  });

  server.post("/products/:slug/assessment/submissions", async (request, reply) => {
    const currentUser = await getCurrentUser(request.headers.authorization);
    const { slug } = assessmentProductSlugParamsSchema.parse(request.params);
    const input = submitAssessmentSchema.parse(request.body ?? {});
    const submission = await submitAssessmentForProductSlug(slug, input, {
      email: currentUser?.email,
      userId: currentUser?.id
    });

    return reply.code(201).send(submission);
  });

  server.get("/goals/:goalKey/assessment", async (request, reply) => {
    const { goalKey } = assessmentGoalKeyParamsSchema.parse(request.params);
    const assessment = await getActiveAssessmentForGoalKey(goalKey);

    if (!assessment) {
      return reply.code(404).send({
        error: "Not Found"
      });
    }

    return assessment;
  });

  server.post("/goals/:goalKey/assessment/submissions", async (request, reply) => {
    const currentUser = await getCurrentUser(request.headers.authorization);
    const { goalKey } = assessmentGoalKeyParamsSchema.parse(request.params);
    const input = submitAssessmentSchema.parse(request.body ?? {});
    const submission = await submitAssessmentForGoalKey(goalKey, input, {
      email: currentUser?.email,
      userId: currentUser?.id
    });

    return reply.code(201).send(submission);
  });

  server.get("/admin/assessment-submissions", async () => ({
    submissions: await listAdminAssessmentSubmissions()
  }));
};
