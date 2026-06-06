import { AssessmentTemplateStatus, ProductPurchaseMode, ProductStatus } from "@prisma/client";
import { prisma } from "../../prisma.js";

export function getActiveAssessmentForProductSlug(slug: string) {
  return prisma.assessmentTemplate.findFirst({
    where: {
      status: AssessmentTemplateStatus.ACTIVE,
      product: {
        slug,
        status: ProductStatus.ACTIVE,
        purchaseMode: ProductPurchaseMode.ASSESSMENT_REQUIRED
      }
    },
    include: {
      questions: {
        orderBy: [
          {
            sortOrder: "asc"
          },
          {
            createdAt: "asc"
          }
        ]
      },
      product: true
    },
    orderBy: {
      version: "desc"
    }
  });
}
