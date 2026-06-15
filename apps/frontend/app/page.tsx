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

const dashboardPreviewItems = [
  "Recent results",
  "Saved tests",
  "Follow-up questions",
  "Health areas",
  "Clinician notes"
];

const libraryArticles = [
  {
    category: "Iron status",
    title: "What ferritin can and can't tell you",
    excerpt: "How ferritin relates to iron stores, inflammation, fatigue, and follow-up testing.",
    href: "/library/ferritin"
  },
  {
    category: "Metabolic health",
    title: "A1c vs fasting glucose vs fasting insulin",
    excerpt: "What each marker measures, where they differ, and why context matters.",
    href: "/library/a1c-glucose-insulin"
  },
  {
    category: "Nutrients",
    title: "When vitamin D testing is useful",
    excerpt: "Common reasons to test, what results can suggest, and what they cannot prove.",
    href: "/library/vitamin-d-testing"
  },
  {
    category: "Genetics",
    title: "What to know before ordering genetic testing",
    excerpt: "The differences between screening, sequencing, reports, and clinical interpretation.",
    href: "/library/genetic-testing"
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
            Your health information, organized around what you're trying to understand.
          </h2>
          <p>
            Keep results, saved tests, products, and follow-up questions connected to the same
            health areas.
          </p>
          <Link className="home-dashboard-cta" href="/my-health">
            Open My Health
          </Link>
        </div>

        <div className="home-dashboard-card" aria-label="My Health preview">
          <div className="home-dashboard-card-header">
            <span>My Health</span>
            <strong>Active review</strong>
          </div>
          <div className="home-dashboard-card-main">
            <p>Energy & fatigue</p>
            <strong>3 recent results saved</strong>
          </div>
          <div className="home-dashboard-list">
            {dashboardPreviewItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="home-content-section" aria-labelledby="library-preview-title">
        <div className="home-section-header">
          <div>
            <h2 id="library-preview-title">Learn before you test</h2>
            <p>Plain-language guides to common labs, biomarkers, and health questions.</p>
          </div>
        </div>

        <div className="home-library-grid">
          {libraryArticles.map((article) => (
            <Link href={article.href} key={article.title} className="home-library-card">
              <span>{article.category}</span>
              <h3>{article.title}</h3>
              <p>{article.excerpt}</p>
            </Link>
          ))}
        </div>
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
