import {
  AssessmentQuestionType,
  AssessmentSubmissionStatus,
  AssessmentTemplateStatus,
  ProductPurchaseMode,
  ProductStatus
} from "@prisma/client";
import { prisma } from "../../prisma.js";
import type { AssessmentAnswerValue, SubmitAssessmentInput } from "./assessments.schemas.js";

type AssessmentTemplateWithQuestions = NonNullable<
  Awaited<ReturnType<typeof getActiveAssessmentForProductSlug>>
>;

type NormalizedAssessmentAnswer = string | number | boolean | string[];

type SubmitAssessmentOptions = {
  email?: string | null;
  userId?: string;
};

export class AssessmentError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}

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

export async function submitAssessmentForProductSlug(
  slug: string,
  input: SubmitAssessmentInput,
  options: SubmitAssessmentOptions = {}
) {
  const assessment = await getActiveAssessmentForProductSlug(slug);

  if (!assessment) {
    throw new AssessmentError("Assessment not found", 404);
  }

  const answers = validateAssessmentAnswers(assessment, input.answers);
  const email = input.email ?? options.email ?? null;

  return prisma.assessmentSubmission.create({
    data: {
      email,
      productId: assessment.productId,
      status: AssessmentSubmissionStatus.SUBMITTED,
      templateId: assessment.id,
      userId: options.userId,
      answers: {
        create: answers.map((answer) => ({
          questionId: answer.questionId,
          questionKey: answer.questionKey,
          value: answer.value
        }))
      }
    },
    include: {
      answers: {
        orderBy: {
          questionKey: "asc"
        }
      },
      product: true,
      template: true
    }
  });
}

function validateAssessmentAnswers(
  assessment: AssessmentTemplateWithQuestions,
  rawAnswers: Record<string, AssessmentAnswerValue>
) {
  const questionKeys = new Set(assessment.questions.map((question) => question.key));

  for (const key of Object.keys(rawAnswers)) {
    if (!questionKeys.has(key)) {
      throw new AssessmentError(`Unknown answer: ${key}`);
    }
  }

  return assessment.questions.map((question) => {
    const rawAnswer = rawAnswers[question.key];
    const value = normalizeAnswer(question, rawAnswer);

    if (question.required && !isAnswered(value)) {
      throw new AssessmentError(`Missing required answer: ${question.key}`);
    }

    return {
      questionId: question.id,
      questionKey: question.key,
      value
    };
  });
}

function normalizeAnswer(
  question: AssessmentTemplateWithQuestions["questions"][number],
  rawAnswer: AssessmentAnswerValue | undefined
): NormalizedAssessmentAnswer {
  if (rawAnswer === undefined) {
    return question.type === AssessmentQuestionType.MULTI_SELECT ? [] : "";
  }

  if (question.type === AssessmentQuestionType.SINGLE_SELECT) {
    if (typeof rawAnswer !== "string") {
      throw new AssessmentError(`Expected a single selection for ${question.key}`);
    }

    assertOptionValue(question, rawAnswer);

    return rawAnswer;
  }

  if (question.type === AssessmentQuestionType.MULTI_SELECT) {
    if (!Array.isArray(rawAnswer)) {
      throw new AssessmentError(`Expected multiple selections for ${question.key}`);
    }

    for (const value of rawAnswer) {
      assertOptionValue(question, value);
    }

    return rawAnswer;
  }

  if (question.type === AssessmentQuestionType.TEXT) {
    if (typeof rawAnswer !== "string") {
      throw new AssessmentError(`Expected text for ${question.key}`);
    }

    return rawAnswer.trim();
  }

  if (question.type === AssessmentQuestionType.NUMBER) {
    const value =
      typeof rawAnswer === "number"
        ? rawAnswer
        : typeof rawAnswer === "string" && rawAnswer.trim() !== ""
          ? Number(rawAnswer)
          : Number.NaN;

    if (!Number.isFinite(value)) {
      throw new AssessmentError(`Expected a number for ${question.key}`);
    }

    return value;
  }

  if (question.type === AssessmentQuestionType.BOOLEAN) {
    if (typeof rawAnswer !== "boolean") {
      throw new AssessmentError(`Expected yes or no for ${question.key}`);
    }

    return rawAnswer;
  }

  throw new AssessmentError(`Unsupported question type for ${question.key}`);
}

function assertOptionValue(
  question: AssessmentTemplateWithQuestions["questions"][number],
  value: string
) {
  const options = getQuestionOptions(question.options);

  if (!options.some((option) => option.value === value)) {
    throw new AssessmentError(`Invalid option for ${question.key}`);
  }
}

function getQuestionOptions(options: unknown) {
  if (!Array.isArray(options)) {
    return [];
  }

  return options.filter(
    (option): option is { label: string; value: string } =>
      Boolean(option) &&
      typeof option === "object" &&
      typeof (option as { label?: unknown }).label === "string" &&
      typeof (option as { value?: unknown }).value === "string"
  );
}

function isAnswered(value: NormalizedAssessmentAnswer) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "string") {
    return value.length > 0;
  }

  return true;
}
