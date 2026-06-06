import type { FastifyPluginAsync } from "fastify";
import { getCurrentUser } from "../auth/auth.service.js";
import {
  assessmentProductSlugParamsSchema,
  submitAssessmentSchema
} from "./assessments.schemas.js";
import {
  getActiveAssessmentForProductSlug,
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
};
