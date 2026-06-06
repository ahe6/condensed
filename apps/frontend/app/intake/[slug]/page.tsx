"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CustomerBrand } from "../../../src/components/CustomerBrand";
import { CustomerNav } from "../../../src/components/CustomerNav";
import {
  AssessmentQuestion,
  AssessmentSubmission,
  AssessmentTemplate,
  Product,
  getProduct,
  getProductAssessment,
  getReadiness,
  submitProductAssessment
} from "../../../src/lib/api";
import { getSession, isAuthConfigured, startLogin } from "../../../src/lib/auth";
import { isAssessmentProduct } from "../../../src/lib/productDisplay";

type AssessmentAnswer = string | string[] | boolean;
type AssessmentDraft = {
  answers: Record<string, AssessmentAnswer>;
  pendingSubmit: boolean;
  updatedAt: string;
};

const assessmentDraftStoragePrefix = "health.assessmentDraft.";

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
  const slug = decodeURIComponent(params.slug);
  const [product, setProduct] = useState<Product | null>(null);
  const [assessment, setAssessment] = useState<AssessmentTemplate | null>(null);
  const [answers, setAnswers] = useState<Record<string, AssessmentAnswer>>({});
  const [submission, setSubmission] = useState<AssessmentSubmission | null>(null);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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

          setProduct(nextProduct);
          setAssessment(nextAssessment);
          setAnswers(savedDraft?.answers ?? defaultAnswers);
          setSubmission(null);
          setShowAuthGate(Boolean(savedDraft?.pendingSubmit && !getSession()));
          setShouldSubmitAfterLogin(Boolean(savedDraft?.pendingSubmit && getSession()));
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
  const requiredQuestionsComplete =
    !assessment ||
    assessment.questions.every((question) => isAnswered(question, answers[question.key]));

  function updateAnswer(question: AssessmentQuestion, value: AssessmentAnswer) {
    setAnswers((current) => ({
      ...current,
      [question.key]: value
    }));
    setSubmission(null);
    setShowAuthGate(false);
    setShouldSubmitAfterLogin(false);
    setSubmitError(null);

    const nextAnswers = {
      ...answers,
      [question.key]: value
    };
    saveAssessmentDraft(slug, nextAnswers, false);
  }

  function toggleMultiSelectAnswer(question: AssessmentQuestion, value: string) {
    const currentAnswer = answers[question.key];
    const currentValues = Array.isArray(currentAnswer) ? currentAnswer : [];
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];

    updateAnswer(question, nextValues);
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
      saveAssessmentDraft(slug, answers, true);
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
    saveAssessmentDraft(slug, answers, true);

    try {
      await startLogin({
        returnTo: `${window.location.pathname}${window.location.search}`
      });
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : "Could not start sign in");
      setIsStartingLogin(false);
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

          <form
            className="intake-form"
            onSubmit={(event) => {
              event.preventDefault();
              void submitAssessment();
            }}
          >
            {assessment.questions.map((question) => (
              <AssessmentQuestionField
                answer={answers[question.key]}
                key={question.id}
                question={question}
                onChange={(value) => updateAnswer(question, value)}
                onToggle={(value) => toggleMultiSelectAnswer(question, value)}
              />
            ))}

            <button
              type="submit"
              disabled={!requiredQuestionsComplete || isSubmitting || Boolean(submission)}
            >
              {isSubmitting ? "Submitting" : submission ? "Assessment Submitted" : "Submit Assessment"}
            </button>
          </form>

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
              <strong>Assessment submitted</strong>
              <p>
                Your answers were saved. Checkout stays locked until this flow is connected to
                review.
              </p>
              <p>Submission {submission.id.slice(0, 8)}</p>
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
          onChange={(event) => onChange(event.target.value === "true")}
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

function saveAssessmentDraft(
  slug: string,
  answers: Record<string, AssessmentAnswer>,
  pendingSubmit: boolean
) {
  if (typeof window === "undefined") {
    return;
  }

  const draft: AssessmentDraft = {
    answers,
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
