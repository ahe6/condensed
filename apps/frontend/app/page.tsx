"use client";

import Link from "next/link";
import { SiteHeader } from "../src/components/SiteHeader";

const startOptions = [
  {
    title: "I have symptoms or a concern",
    detail: "Start with what’s going on, what changed, or what you’re worried about.",
    href: "/my-health"
  },
  {
    title: "I want to get tested",
    detail: "Find relevant labs based on what you want to understand.",
    href: "/labs"
  },
  {
    title: "I want a second look at my case",
    detail: "Upload results, reports, symptoms, medications, supplements, and what you’ve tried.",
    href: "/my-health"
  }
];

const commonHealthQuestions = [
  {
    title: "Not sure why you’re tired?",
    detail: "Fatigue, thyroid, iron, B12, vitamin D, sleep, glucose.",
    cta: "Start",
    href: "/health-areas/energy-fatigue"
  },
  {
    title: "Checking metabolic health?",
    detail: "A1c, fasting insulin, lipids, CGM, weight, prevention.",
    cta: "Explore",
    href: "/health-areas/metabolic-health"
  },
  {
    title: "Have results you’re unsure about?",
    detail: "Upload results, reports, and context for a clearer next step.",
    cta: "Review",
    href: "/results"
  },
  {
    title: "Looking into genetic testing?",
    detail: "Compare testing types and understand when review may help.",
    cta: "Explore",
    href: "/genetics"
  }
];

const myHealthValueProps = [
  {
    title: "Save results and reports",
    detail: "Upload lab work, genetic reports, or other health documents."
  },
  {
    title: "Connect the context",
    detail: "Add symptoms, medications, supplements, and what you’ve tried."
  },
  {
    title: "See possible next steps",
    detail: "Find relevant labs, follow-up questions, and review options."
  }
];

const myHealthCase = {
  concern: "Energy crashes after meals",
  question: "What should I check?",
  context: [
    "Afternoon tiredness",
    "Cravings after lunch",
    "A1c in range",
    "Glucose in range",
    "Tried walking after meals"
  ],
  answer:
    "Your A1c and fasting glucose are in range, but they may not fully explain the post-meal crashes. Fasting insulin, ApoB, vitamin D, or optional CGM could add useful context.",
  nextStep: "Build a metabolic follow-up lab plan.",
  labs: ["Fasting insulin", "ApoB", "hs-CRP", "Vitamin D", "Optional CGM"],
  actions: ["Compare labs", "Find nearby labs", "Clinician review"]
};

const realUseCases = [
  {
    category: "Fatigue & energy",
    title: "Tired all the time, but basic labs look normal",
    detail:
      "Start with low energy, afternoon crashes, prior labs, and what you’ve already tried. Condensed helps organize what to review next.",
    nextStep: "Build a lab follow-up plan",
    cta: "Start with fatigue",
    href: "/health-areas/energy-fatigue"
  },
  {
    category: "Lab results",
    title: "Already tested, unsure what matters",
    detail:
      "Upload previous bloodwork and see what is out of range, what changed, and what may be worth asking a clinician about.",
    nextStep: "Organize results and review questions",
    cta: "Upload results",
    href: "/results"
  },
  {
    category: "Genetics",
    title: "Thinking about genetic testing",
    detail:
      "Compare screening tests, sequencing reports, and clinician-ordered genetic tests before deciding what makes sense.",
    nextStep: "Choose the right test before ordering",
    cta: "Compare test types",
    href: "/genetics"
  }
];

const faqs = [
  {
    question: "Do I need a doctor to order tests?",
    answer:
      "Some tests may be available directly, while others may require review, eligibility checks, or a clinician order depending on the test type and location."
  },
  {
    question: "Can I upload results I already have?",
    answer:
      "Yes. My Health is designed to keep outside lab results, reports, notes, and follow-up questions organized in one place."
  },
  {
    question: "Can Condensed Health diagnose me?",
    answer:
      "No. Condensed Health helps organize information and find relevant options, but it does not replace emergency care or a clinician's diagnosis."
  },
  {
    question: "How does clinician review work?",
    answer:
      "When review is available, you can prepare relevant history, goals, results, and questions so a clinician has better context for follow-up."
  },
  {
    question: "Are tests covered by insurance?",
    answer:
      "Coverage depends on the test, partner, plan, medical necessity, and location. Condensed Health should not be treated as a guarantee of reimbursement."
  },
  {
    question: "How is my health data protected?",
    answer:
      "Health data should be handled carefully. Account, privacy, and security details will be shown clearly as services become available."
  },
  {
    question: "What should I do if I have urgent symptoms?",
    answer:
      "Seek medical care directly. Condensed Health is not intended for emergencies, urgent symptoms, or situations where immediate care may be needed."
  }
];

export default function Home() {
  return (
    <main className="shell landing-page">
      <SiteHeader ariaLabel="Shop navigation" />

      <section className="home-hero" id="start-options" aria-labelledby="home-start-title">
        <div className="home-hero-inner">
          <div className="home-hero-card">
            <div className="home-hero-content">
              <div className="home-start-heading">
                <h1 id="home-start-title">Find answers for your health</h1>
                <p className="home-start-subtitle">
                  Start with symptoms, lab results, or what you’ve already tried.
                  We’ll help you find relevant labs, understand your options, and decide what to do next.
                </p>
              </div>

              <div className="home-start-grid">
                {startOptions.map((option, index) => (
                  <Link
                    href={option.href}
                    key={option.title}
                    className={`home-start-row${index === 0 ? " featured" : ""}`}
                  >
                    <span>{option.title}</span>
                    <span aria-hidden="true" className="home-start-row-arrow">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="home-hero-media" aria-hidden="true">
              <img src="/heroimage9.png" alt="" />
            </div>
          </div>

        </div>
      </section>

      <section className="home-content-section home-question-section" aria-labelledby="starting-points-title">
        <div className="home-section-header">
          <div>
            <p className="home-section-eyebrow">Guided starting points</p>
            <h2 id="starting-points-title">Common places to start</h2>
            <p>
              A few ways people use Condensed Health to choose labs, understand results, or get a
              second look at their case.
            </p>
          </div>
        </div>

        <div className="home-question-list">
          {commonHealthQuestions.map((question, index) => (
            <Link href={question.href} key={question.title} className="home-question-row">
              <span className="home-question-number">{String(index + 1).padStart(2, "0")}</span>
              <div className="home-question-copy">
                <h3>{question.title}</h3>
                <p>{question.detail}</p>
              </div>
              <span className="home-question-cta">
                {question.cta}
                <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-dashboard-section" aria-labelledby="my-health-preview-title">
        <div className="home-dashboard-copy">
          <h2 id="my-health-preview-title">
            One place for your health questions, results, and next steps.
          </h2>
          <p>
            Keep symptoms, lab results, reports, and what you’ve tried connected to what you’re
            trying to understand.
          </p>
          <div className="home-dashboard-values">
            {myHealthValueProps.map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
          <Link className="home-dashboard-cta" href="/my-health">
            Open My Health
          </Link>
        </div>

        <article className="home-dashboard-card" aria-label="My Health case example">
          <div className="home-dashboard-card-header">
            <span>My Health</span>
            <strong>Case answer</strong>
          </div>

          <div className="home-dashboard-question">
            <div>
              <h3>{myHealthCase.concern}</h3>
              <p>{myHealthCase.question}</p>
            </div>
            <div className="home-dashboard-context" aria-label="Context added">
              {myHealthCase.context.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>

          <div className="home-dashboard-answer">
            <p>{myHealthCase.answer}</p>
          </div>

          <section className="home-dashboard-next-step" aria-label="Suggested next step">
            <h4>Suggested next step</h4>
            <p>{myHealthCase.nextStep}</p>
            <div aria-label="Labs to consider">
              {myHealthCase.labs.map((lab) => (
                <span key={lab}>{lab}</span>
              ))}
            </div>
            <div className="home-dashboard-actions" aria-label="Next actions">
              {myHealthCase.actions.map((action) => (
                <span key={action}>{action}</span>
              ))}
            </div>
          </section>
        </article>
      </section>

      <section className="home-content-section home-use-cases-section" aria-labelledby="use-cases-title">
        <div className="home-section-header">
          <div>
            <p className="home-section-eyebrow">Example paths</p>
            <h2 id="use-cases-title">Ways people use Condensed Health</h2>
            <p>
              Start with a symptom, lab result, or testing question. Condensed helps turn
              scattered information into a clearer next step.
            </p>
          </div>
        </div>

        <div className="home-use-case-grid">
          {realUseCases.map((useCase) => (
            <article className="home-use-case-card" key={useCase.title}>
              <span className="home-use-case-label">{useCase.category}</span>
              <h3>{useCase.title}</h3>
              <p>{useCase.detail}</p>
              <div className="home-use-case-footer">
                <p>
                  <span>Next step</span>
                  {useCase.nextStep}
                </p>
                <Link href={useCase.href}>
                  {useCase.cta}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
        <p className="home-use-case-disclaimer">
          Examples only. Not diagnoses or medical advice.
        </p>
      </section>

      <section className="faq-section" aria-labelledby="faq-title">
        <div className="faq-heading">
          <h2 id="faq-title">Questions people ask before getting started</h2>
        </div>

        <div className="faq-list">
          {faqs.map((faq) => (
            <details key={faq.question} className="faq-item">
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

    </main>
  );
}
