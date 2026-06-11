"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CustomerBrand } from "../../../src/components/CustomerBrand";
import { CustomerNav } from "../../../src/components/CustomerNav";
import {
  AssessmentQuestion,
  AssessmentSubmission,
  AssessmentTemplate,
  Product,
  addCartItem,
  getProduct,
  getProductAssessment,
  getMyCart,
  getReadiness,
  submitProductAssessment
} from "../../../src/lib/api";
import { getSession, isAuthConfigured, startLogin } from "../../../src/lib/auth";
import { isAssessmentProduct } from "../../../src/lib/productDisplay";

type AssessmentAnswer = string | string[] | boolean;
type AssessmentDraft = {
  answers: Record<string, AssessmentAnswer>;
  currentQuestionIndex?: number;
  pendingSubmit: boolean;
  updatedAt: string;
};

const assessmentDraftStoragePrefix = "health.assessmentDraft.";
const cartStorageKey = "health.cartId";

function defaultAnswer(question: AssessmentQuestion): AssessmentAnswer {
  if (question.type === "MULTI_SELECT") {
    return [];
  }

  return "";
}

function isAnswered(question: AssessmentQuestion, answer: AssessmentAnswer | undefined) {
  if (!question.required) {
    return true;
  }

  if (Array.isArray(answer)) {
    return answer.length > 0;
  }

  return answer !== undefined && answer !== "";
}

export default function IntakePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = decodeURIComponent(params.slug);
  const [product, setProduct] = useState<Product | null>(null);
  const [assessment, setAssessment] = useState<AssessmentTemplate | null>(null);
  const [answers, setAnswers] = useState<Record<string, AssessmentAnswer>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submission, setSubmission] = useState<AssessmentSubmission | null>(null);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [isStartingLogin, setIsStartingLogin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldSubmitAfterLogin, setShouldSubmitAfterLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        await getReadiness();
        const nextProduct = await getProduct(slug);
        const nextAssessment = isAssessmentProduct(nextProduct)
          ? await getProductAssessment(slug)
          : null;

        if (isMounted) {
          const defaultAnswers = Object.fromEntries(
            (nextAssessment?.questions ?? []).map((question) => [
              question.key,
              defaultAnswer(question)
            ])
          );
          const savedDraft = nextAssessment
            ? readAssessmentDraft(slug, defaultAnswers)
            : null;
          const restoredAnswers = savedDraft?.answers ?? defaultAnswers;
          const restoredQuestionIndex = nextAssessment
            ? getRestoredQuestionIndex(nextAssessment.questions, restoredAnswers, savedDraft)
            : 0;
          const restoredQuestionsComplete =
            nextAssessment?.questions.every((question) =>
              isAnswered(question, restoredAnswers[question.key])
            ) ?? false;

          setProduct(nextProduct);
          setAssessment(nextAssessment);
          setAnswers(restoredAnswers);
          setCurrentQuestionIndex(restoredQuestionIndex);
          setSubmission(null);
          setShowAuthGate(Boolean(savedDraft?.pendingSubmit && restoredQuestionsComplete && !getSession()));
          setShouldSubmitAfterLogin(Boolean(savedDraft?.pendingSubmit && restoredQuestionsComplete && getSession()));
          setSubmitError(null);
        }
      } catch (caught) {
        if (isMounted) {
          setError(caught instanceof Error ? caught.message : "Program not found");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const isProgram = product ? isAssessmentProduct(product) : false;
  const questions = assessment?.questions ?? [];
  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const currentQuestionAnswered = currentQuestion
    ? isAnswered(currentQuestion, answers[currentQuestion.key])
    : false;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const requiredQuestionsComplete =
    !assessment ||
    questions.every((question) => isAnswered(question, answers[question.key]));

  function updateAnswer(question: AssessmentQuestion, value: AssessmentAnswer) {
    setAnswers((current) => {
      const nextAnswers = {
        ...current,
        [question.key]: value
      };

      saveAssessmentDraft(slug, nextAnswers, false, currentQuestionIndex);

      return nextAnswers;
    });
    setSubmission(null);
    setShowAuthGate(false);
    setShouldSubmitAfterLogin(false);
    setSubmitError(null);
  }

  function toggleMultiSelectAnswer(question: AssessmentQuestion, value: string) {
    const currentAnswer = answers[question.key];
    const currentValues = Array.isArray(currentAnswer) ? currentAnswer : [];
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];

    updateAnswer(question, nextValues);
  }

  function goToPreviousQuestion() {
    setCurrentQuestionIndex((current) => {
      const nextIndex = Math.max(0, current - 1);
      saveAssessmentDraft(slug, answers, false, nextIndex);

      return nextIndex;
    });
    setShowAuthGate(false);
    setSubmitError(null);
  }

  function goToNextQuestion() {
    if (!currentQuestionAnswered) {
      return;
    }

    setCurrentQuestionIndex((current) => {
      const nextIndex = Math.min(questions.length - 1, current + 1);
      saveAssessmentDraft(slug, answers, false, nextIndex);

      return nextIndex;
    });
    setShowAuthGate(false);
    setSubmitError(null);
  }

  async function submitAssessment() {
    if (!requiredQuestionsComplete || isSubmitting || submission) {
      return;
    }

    if (!isAuthConfigured()) {
      setSubmitError("Sign in is not configured for this environment");
      return;
    }

    if (!getSession()) {
      saveAssessmentDraft(slug, answers, true, currentQuestionIndex);
      setShowAuthGate(true);
      setSubmitError(null);
      return;
    }

    setIsSubmitting(true);
    setShowAuthGate(false);
    setSubmitError(null);

    try {
      const nextSubmission = await submitProductAssessment(slug, {
        answers
      });
      setSubmission(nextSubmission);
      setShouldSubmitAfterLogin(false);
      clearAssessmentDraft(slug);
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : "Assessment could not be submitted");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAuthStart() {
    if (!requiredQuestionsComplete) {
      return;
    }

    setIsStartingLogin(true);
    setSubmitError(null);
    saveAssessmentDraft(slug, answers, true, currentQuestionIndex);

    try {
      await startLogin({
        returnTo: `${window.location.pathname}${window.location.search}`
      });
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : "Could not start sign in");
      setIsStartingLogin(false);
    }
  }

  async function handleApprovedCheckout() {
    const variant = product?.variants[0];

    if (!variant) {
      setSubmitError("This program does not have an available checkout option");
      return;
    }

    if (!getSession()) {
      setSubmitError("Sign in again to continue to checkout");
      return;
    }

    setIsStartingCheckout(true);
    setSubmitError(null);

    try {
      const savedCartId = window.localStorage.getItem(cartStorageKey);
      const cart = await getMyCart(savedCartId ?? undefined);
      const updatedCart = await addCartItem(cart.id, variant.id, 1);
      window.localStorage.setItem(cartStorageKey, updatedCart.id);
      router.push("/cart");
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : "Could not prepare checkout");
    } finally {
      setIsStartingCheckout(false);
    }
  }

  useEffect(() => {
    if (
      !shouldSubmitAfterLogin ||
      isLoading ||
      !requiredQuestionsComplete ||
      isSubmitting ||
      submission
    ) {
      return;
    }

    setShouldSubmitAfterLogin(false);
    void submitAssessment();
  }, [isLoading, isSubmitting, requiredQuestionsComplete, shouldSubmitAfterLogin, submission]);

  useEffect(() => {
    if (!questions.length) {
      setCurrentQuestionIndex(0);
      return;
    }

    setCurrentQuestionIndex((current) => Math.min(current, questions.length - 1));
  }, [questions.length]);

  return (
    <main className="shell narrow-shell">
      <section className="topbar" aria-label="Assessment navigation">
        <CustomerBrand />
        <CustomerNav />
      </section>

      {error ? <p className="error global-error">{error}</p> : null}

      {isLoading ? <section className="panel empty-state">Loading assessment</section> : null}

      {!isLoading && product && !isProgram ? (
        <section className="panel intake-panel">
          <p className="eyebrow">Direct purchase</p>
          <h1>{product.name}</h1>
          <p>This item can be purchased directly from the product page.</p>
          <Link className="nav-link primary-link" href={`/products/${product.slug}`}>
            View Product
          </Link>
        </section>
      ) : null}

      {!isLoading && product && isProgram && assessment ? (
        <section className="panel intake-panel" aria-label={`${product.name} assessment`}>
          <div className="intake-heading">
            <p className="eyebrow">Assessment</p>
            <h1>{assessment.title}</h1>
            {assessment.description ? <p>{assessment.description}</p> : null}
          </div>

          {currentQuestion ? (
            <form
              className="intake-form"
              onSubmit={(event) => {
                event.preventDefault();

                if (isLastQuestion) {
                  void submitAssessment();
                  return;
                }

                goToNextQuestion();
              }}
            >
              <div className="intake-progress" aria-label="Assessment progress">
                <span>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <div aria-hidden="true">
                  <span style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }} />
                </div>
              </div>

              <AssessmentQuestionField
                answer={answers[currentQuestion.key]}
                key={currentQuestion.id}
                question={currentQuestion}
                onChange={(value) => updateAnswer(currentQuestion, value)}
                onToggle={(value) => toggleMultiSelectAnswer(currentQuestion, value)}
              />

              <div className="intake-step-actions">
                <button
                  className="secondary"
                  type="button"
                  disabled={currentQuestionIndex === 0 || isSubmitting}
                  onClick={goToPreviousQuestion}
                >
                  Back
                </button>
                {isLastQuestion ? (
                  <button
                    type="submit"
                    disabled={!requiredQuestionsComplete || isSubmitting || Boolean(submission)}
                  >
                    {isSubmitting
                      ? "Submitting"
                      : submission
                        ? "Assessment Submitted"
                        : "Submit Assessment"}
                  </button>
                ) : (
                  <button type="submit" disabled={!currentQuestionAnswered || isSubmitting}>
                    Continue
                  </button>
                )}
              </div>
            </form>
          ) : null}

          {submitError ? <p className="error">{submitError}</p> : null}

          {showAuthGate && !submission ? (
            <section className="panel account-sign-in" aria-label="Sign in to submit assessment">
              <div>
                <p className="eyebrow">Account required</p>
                <h2>Save your assessment</h2>
                <p>Your answers are ready. Sign in or create an account to submit them.</p>
              </div>
              <div className="auth-actions">
                <button type="button" disabled={isStartingLogin} onClick={() => void handleAuthStart()}>
                  {isStartingLogin ? "Opening Sign In" : "Sign In / Create Account"}
                </button>
                <Link className="nav-link" href="/auth/confirm">
                  Confirm Account
                </Link>
              </div>
            </section>
          ) : null}

          {submission ? (
            <div className="success intake-next-step">
              <strong>{getSubmissionResultTitle(submission)}</strong>
              <p>{getSubmissionResultMessage(submission)}</p>
              <p>Submission {submission.id.slice(0, 8)}</p>
              {submission.status === "APPROVED" ? (
                <button
                  type="button"
                  disabled={isStartingCheckout}
                  onClick={() => void handleApprovedCheckout()}
                >
                  {isStartingCheckout ? "Preparing Cart" : "Continue to Cart"}
                </button>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}

function AssessmentQuestionField({
  answer,
  question,
  onChange,
  onToggle
}: {
  answer: AssessmentAnswer | undefined;
  question: AssessmentQuestion;
  onChange: (value: AssessmentAnswer) => void;
  onToggle: (value: string) => void;
}) {
  const options = question.options ?? [];

  if (question.type === "MULTI_SELECT") {
    const selectedValues = Array.isArray(answer) ? answer : [];

    return (
      <fieldset className="intake-question">
        <legend>{question.label}</legend>
        {question.helpText ? <p>{question.helpText}</p> : null}
        <div className="intake-choice-list">
          {options.map((option) => (
            <label className="checkbox-row" key={option.value}>
              <input
                checked={selectedValues.includes(option.value)}
                type="checkbox"
                onChange={() => onToggle(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (question.type === "TEXT") {
    return (
      <label className="intake-question">
        <span>{question.label}</span>
        {question.helpText ? <p>{question.helpText}</p> : null}
        <textarea
          required={question.required}
          value={typeof answer === "string" ? answer : ""}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    );
  }

  if (question.type === "NUMBER") {
    return (
      <label className="intake-question">
        <span>{question.label}</span>
        {question.helpText ? <p>{question.helpText}</p> : null}
        <input
          inputMode="numeric"
          required={question.required}
          type="number"
          value={typeof answer === "string" ? answer : ""}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    );
  }

  if (question.type === "BOOLEAN") {
    return (
      <label className="intake-question">
        <span>{question.label}</span>
        {question.helpText ? <p>{question.helpText}</p> : null}
        <select
          required={question.required}
          value={typeof answer === "boolean" ? String(answer) : ""}
          onChange={(event) =>
            onChange(event.target.value === "" ? "" : event.target.value === "true")
          }
        >
          <option value="">Choose one</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </label>
    );
  }

  return (
    <label className="intake-question">
      <span>{question.label}</span>
      {question.helpText ? <p>{question.helpText}</p> : null}
      <select
        required={question.required}
        value={typeof answer === "string" ? answer : ""}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{question.required ? "Choose one" : "No selection"}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function getAssessmentDraftStorageKey(slug: string) {
  return `${assessmentDraftStoragePrefix}${slug}`;
}

function getSubmissionResultTitle(submission: AssessmentSubmission) {
  if (submission.status === "APPROVED") {
    return "Eligible to continue";
  }

  if (submission.status === "REVIEW_REQUIRED") {
    return "Review required";
  }

  if (submission.status === "REJECTED") {
    return "Not eligible";
  }

  return "Assessment submitted";
}

function getSubmissionResultMessage(submission: AssessmentSubmission) {
  if (submission.status === "APPROVED") {
    return "Your answers passed the automated review. You can continue to checkout now.";
  }

  if (submission.status === "REVIEW_REQUIRED") {
    return "Your answers need manual review before checkout can open.";
  }

  if (submission.status === "REJECTED") {
    return "This program is not available based on the submitted answers.";
  }

  return "Your answers were saved.";
}

function readAssessmentDraft(slug: string, defaultAnswers: Record<string, AssessmentAnswer>) {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(getAssessmentDraftStorageKey(slug));

  if (!raw) {
    return null;
  }

  try {
    const draft = JSON.parse(raw) as AssessmentDraft;
    const answers = { ...defaultAnswers };

    for (const key of Object.keys(defaultAnswers)) {
      const value = draft.answers[key];

      if (
        typeof value === "string" ||
        typeof value === "boolean" ||
        (Array.isArray(value) && value.every((item) => typeof item === "string"))
      ) {
        answers[key] = value;
      }
    }

    return {
      ...draft,
      answers
    };
  } catch {
    clearAssessmentDraft(slug);
    return null;
  }
}

function getRestoredQuestionIndex(
  questions: AssessmentQuestion[],
  answers: Record<string, AssessmentAnswer>,
  draft: AssessmentDraft | null
) {
  if (!questions.length) {
    return 0;
  }

  if (
    draft?.currentQuestionIndex !== undefined &&
    draft.currentQuestionIndex >= 0 &&
    draft.currentQuestionIndex < questions.length
  ) {
    return draft.currentQuestionIndex;
  }

  const firstUnansweredIndex = questions.findIndex(
    (question) => !isAnswered(question, answers[question.key])
  );

  if (firstUnansweredIndex >= 0) {
    return firstUnansweredIndex;
  }

  return questions.length - 1;
}

function saveAssessmentDraft(
  slug: string,
  answers: Record<string, AssessmentAnswer>,
  pendingSubmit: boolean,
  currentQuestionIndex = 0
) {
  if (typeof window === "undefined") {
    return;
  }

  const draft: AssessmentDraft = {
    answers,
    currentQuestionIndex,
    pendingSubmit,
    updatedAt: new Date().toISOString()
  };

  window.localStorage.setItem(getAssessmentDraftStorageKey(slug), JSON.stringify(draft));
}

function clearAssessmentDraft(slug: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getAssessmentDraftStorageKey(slug));
}
