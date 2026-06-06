import type { FastifyPluginAsync } from "fastify";
import { assessmentProductSlugParamsSchema } from "./assessments.schemas.js";
import { getActiveAssessmentForProductSlug } from "./assessments.service.js";

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
};
