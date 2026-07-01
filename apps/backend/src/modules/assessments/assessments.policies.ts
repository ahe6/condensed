import { AssessmentSubmissionStatus } from "@prisma/client";

export type AssessmentAnswersByKey = Record<string, string | number | boolean | string[]>;

export type AssessmentDecision = {
  policyId: string;
  policyVersion: number;
  reason: string;
  status: "APPROVED" | "REJECTED" | "REVIEW_REQUIRED";
};

const basicProductIntakePolicy = {
  id: "product-intake-basic-v1",
  version: 1
};

export function evaluateProductIntakeAssessment(answers: AssessmentAnswersByKey): AssessmentDecision {
  if (answers.timeframe === "researching") {
    return {
      policyId: basicProductIntakePolicy.id,
      policyVersion: basicProductIntakePolicy.version,
      reason: "customer_researching",
      status: AssessmentSubmissionStatus.REVIEW_REQUIRED
    };
  }

  return {
    policyId: basicProductIntakePolicy.id,
    policyVersion: basicProductIntakePolicy.version,
    reason: "basic_eligible",
    status: AssessmentSubmissionStatus.APPROVED
  };
}
