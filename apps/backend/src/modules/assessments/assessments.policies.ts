import { AssessmentSubmissionStatus } from "@prisma/client";

export type AssessmentAnswersByKey = Record<string, string | number | boolean | string[]>;

export type AssessmentDecision = {
  policyId: string;
  policyVersion: number;
  reason: string;
  status: "APPROVED" | "REJECTED" | "REVIEW_REQUIRED";
};

export type AssessmentRecommendationDecision = {
  productSlug: string;
  rank: number;
  reasonCode: string;
  reasonText: string;
  sourcePolicyId: string;
  sourcePolicyVersion: number;
};

const basicProductIntakePolicy = {
  id: "product-intake-basic-v1",
  version: 1
};

const goalIntakeRecommendationPolicy = {
  id: "goal-intake-recommendations-v1",
  version: 1
};

const goalRecommendationsByKey = {
  "hair-loss": [
    ["hair-thinning-consult", "hair_consult"],
    ["hair-density-support-kit", "hair_routine"]
  ],
  "hormone-health": [
    ["testosterone-health-check-in", "hormone_check_in"],
    ["testosterone-labs-panel", "baseline_labs"],
    ["hormone-health-check-in", "hormone_support"]
  ],
  "sexual-health": [
    ["ed-wellness-consult", "sexual_wellness_consult"],
    ["sexual-health-screening-kit", "screening_labs"],
    ["early-finish-support-consult", "timing_support"]
  ],
  "skin-care": [
    ["acne-care-consult", "skin_consult"],
    ["skin-clarity-routine", "skin_routine"],
    ["age-support-skin-consult", "texture_support"]
  ],
  "weight-loss": [
    ["glp1-weight-care-consult", "glp1_consult"],
    ["oral-weight-loss-consult", "oral_weight_options"],
    ["weight-loss-labs-panel", "baseline_labs"],
    ["metabolic-labs-panel", "metabolic_labs"]
  ],
  "wellness-labs": [
    ["general-health-check-labs", "general_screening"],
    ["metabolic-labs-panel", "metabolic_labs"],
    ["thyroid-labs-panel", "thyroid_labs"]
  ]
} satisfies Record<string, Array<[string, string]>>;

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

export function evaluateGoalIntakeRecommendations(
  goalKey: string,
  answers: AssessmentAnswersByKey
): AssessmentRecommendationDecision[] {
  const recommendations =
    goalRecommendationsByKey[goalKey as keyof typeof goalRecommendationsByKey] ??
    goalRecommendationsByKey["wellness-labs"];
  const timeframe = typeof answers.timeframe === "string" ? answers.timeframe : null;

  return recommendations.map(([productSlug, reasonCode], index) => ({
    productSlug,
    rank: index + 1,
    reasonCode,
    reasonText: getRecommendationReasonText(goalKey, reasonCode, timeframe),
    sourcePolicyId: goalIntakeRecommendationPolicy.id,
    sourcePolicyVersion: goalIntakeRecommendationPolicy.version
  }));
}

function getRecommendationReasonText(goalKey: string, reasonCode: string, timeframe: string | null) {
  const timeframeText =
    timeframe === "researching"
      ? "because you are comparing options"
      : "because you want a clear next step";

  return `${humanizeToken(reasonCode)} matched to ${humanizeToken(goalKey)} ${timeframeText}.`;
}

function humanizeToken(value: string) {
  return value.replace(/[-_]+/g, " ");
}
