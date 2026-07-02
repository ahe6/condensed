import Link from "next/link";
import { ConsultOverlayHeader } from "../../src/components/ConsultOverlayHeader";

export const metadata = {
  title: "Health Q&A | Condensed Health"
};

const qaCategories = [
  "Product Q&A",
  "Protocols & stacks",
  "Request board",
  "Case examples"
] as const;

const productQuestions = [
  {
    question: "Do I need this if I already take Vitamin D?",
    category: "Supplement Q&A",
    status: "Team answered",
    context: "Vitamin D test page",
    answer:
      "It depends on your recent 25(OH)D level, dose, consistency, and whether you are trying to confirm deficiency, monitor treatment, or avoid over-supplementing."
  },
  {
    question: "How often should I retest after a low Vitamin D result?",
    category: "Test Q&A",
    status: "Team answered",
    context: "Vitamin D retest plan",
    answer:
      "Many people discuss retesting after a consistent supplement period, but timing depends on the starting level, dose, symptoms, and clinician guidance."
  },
  {
    question: "What pairs well with a sleep support plan?",
    category: "Product Q&A",
    status: "Curated answer",
    context: "Sleep basics",
    answer:
      "Start with habits and medication context first. Common discussion points include magnesium, Vitamin D, iron, thyroid, hormones, stress, and sleep apnea screening."
  },
  {
    question: "Can this kind of panel explain fatigue?",
    category: "Test Q&A",
    status: "Team answered",
    context: "Energy and fatigue",
    answer:
      "A panel can sometimes identify useful clues, but fatigue is broad. We usually look at symptoms, sleep, medications, CBC, thyroid, iron, B12, Vitamin D, and metabolic markers together."
  }
] as const;

const protocolStacks = [
  {
    title: "Low energy stack",
    category: "Stack",
    status: "Draft protocol",
    answer:
      "Common starting points people ask about: CBC, ferritin, thyroid markers, Vitamin D, B12, sleep quality, medication review, and basic nutrition support."
  },
  {
    title: "Vitamin D deficiency retest plan",
    category: "Protocol",
    status: "Team template",
    answer:
      "A simple plan can include the original result, current supplement dose, adherence, calcium context, symptoms, and a retest timing question."
  },
  {
    title: "Sleep optimization basics",
    category: "Stack",
    status: "Popular",
    answer:
      "Users commonly compare sleep routine, magnesium questions, stress, caffeine timing, wearable data, and whether testing or clinician review is needed."
  },
  {
    title: "Fertility prep checklist",
    category: "Checklist",
    status: "Planning",
    answer:
      "Questions often include cycle history, prior labs, thyroid, Vitamin D, iron status, hormone timing, semen analysis, and what to discuss with a clinician."
  },
  {
    title: "Longevity baseline panel",
    category: "Panel idea",
    status: "Requested",
    answer:
      "A practical baseline usually starts with risk factors and goals before choosing labs. Users often ask about lipids, A1c, inflammation, hormones, and genetics."
  }
] as const;

const requestBoard = [
  {
    title: "Request a test",
    detail: "Ask us to add or compare a lab, genetics option, at-home kit, or screening panel."
  },
  {
    title: "Request a supplement",
    detail: "Tell us what product, ingredient, dose, or goal you want help evaluating."
  },
  {
    title: "Review this lab marker",
    detail: "Suggest markers that need plain-language explainers, reference context, or follow-up questions."
  },
  {
    title: "What should we add next?",
    detail: "Vote for new guides, services, Q&A topics, product pages, or care-navigation templates."
  }
] as const;

const caseExamples = [
  {
    title: "Low Vitamin D plus magnesium question",
    category: "Anonymized example",
    answer:
      "A user with low Vitamin D wanted to know whether magnesium testing or supplementation should be considered before retesting."
  },
  {
    title: "Inflammation panel plus omega-3 question",
    category: "Anonymized example",
    answer:
      "A user comparing inflammation testing also asked whether omega-3 status, lipids, and lifestyle context should be reviewed together."
  },
  {
    title: "Fatigue panel plus thyroid follow-up",
    category: "Anonymized example",
    answer:
      "A user asking about fatigue wanted help deciding whether borderline thyroid markers, ferritin, Vitamin D, and B12 belonged in one follow-up plan."
  }
];

const qaSidebarItems = [
  "Product Q&A can live under tests, supplements, services, and guides.",
  "Team answers should stay practical, sourced, and non-urgent.",
  "Private records, uploads, and personal plans should stay in My Health."
] as const;

const qaUseCases = [
  "Make product and service pages feel alive.",
  "Surface real buying and testing questions.",
  "Learn what users want added next.",
  "Create SEO pages without turning this into an open forum."
] as const;

export default function QaPage() {
  return (
    <main className="shell overlay-header-page library-page qa-page">
      <ConsultOverlayHeader lineVariant="full" />

      <section className="qa-hero" aria-labelledby="qa-title">
        <div>
          <p className="eyebrow">Health Q&A</p>
          <h1 id="qa-title">Questions, examples, and team answers around health services.</h1>
          <p>
            Browse seeded examples for product-page Q&A, protocols, request ideas, and anonymized cases.
          </p>
        </div>
        <Link className="qa-ask-link" href="/message-team">
          Ask a question
        </Link>
      </section>

      <section className="qa-layout" aria-label="Health Q&A">
        <div className="qa-main-column">
          <div className="qa-category-row" aria-label="Q&A categories">
            {qaCategories.map((category) => (
              <Link href={`/qa?category=${encodeURIComponent(category)}`} key={category}>
                {category}
              </Link>
            ))}
          </div>

          <section className="qa-content-section" aria-labelledby="qa-product-title">
            <div className="qa-section-heading">
              <h2 id="qa-product-title">Product-page Q&A</h2>
              <p>Questions that can sit directly under tests, supplements, services, or product detail pages.</p>
            </div>
            <div className="qa-thread-list" aria-label="Product Q&A examples">
              {productQuestions.map((thread) => (
                <article key={thread.question}>
                  <div className="qa-thread-meta">
                    <span>{thread.category}</span>
                    <small>{thread.status}</small>
                  </div>
                  <h2>{thread.question}</h2>
                  <p>{thread.answer}</p>
                  <footer>
                    <span>{thread.context}</span>
                    <span>Team answer</span>
                  </footer>
                </article>
              ))}
            </div>
          </section>

          <section className="qa-content-section" aria-labelledby="qa-protocols-title">
            <div className="qa-section-heading">
              <h2 id="qa-protocols-title">Protocols and stacks</h2>
              <p>Community-ish templates people can browse without turning the page into open-ended threads.</p>
            </div>
            <div className="qa-thread-list qa-card-grid" aria-label="Protocol and stack examples">
              {protocolStacks.map((stack) => (
                <article key={stack.title}>
                  <div className="qa-thread-meta">
                    <span>{stack.category}</span>
                    <small>{stack.status}</small>
                  </div>
                  <h2>{stack.title}</h2>
                  <p>{stack.answer}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="qa-content-section" aria-labelledby="qa-requests-title">
            <div className="qa-section-heading">
              <h2 id="qa-requests-title">Request board</h2>
              <p>Prompts that let users tell us what to add, review, explain, or compare next.</p>
            </div>
            <div className="qa-request-grid" aria-label="Request board prompts">
              {requestBoard.map((request) => (
                <Link href="/message-team" key={request.title}>
                  <h3>{request.title}</h3>
                  <p>{request.detail}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="qa-content-section" aria-labelledby="qa-cases-title">
            <div className="qa-section-heading">
              <h2 id="qa-cases-title">Case-library examples</h2>
              <p>Anonymized examples that show common next-step logic without making medical claims.</p>
            </div>
            <div className="qa-thread-list" aria-label="Case library examples">
              {caseExamples.map((example) => (
                <article key={example.title}>
                  <div className="qa-thread-meta">
                    <span>{example.category}</span>
                    <small>Example</small>
                  </div>
                  <h2>{example.title}</h2>
                  <p>{example.answer}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="qa-sidebar" aria-label="Q&A guidance">
          <section>
            <h2>What this page is for</h2>
            <p>
              This is a seeded public Q&A surface for products, tests, guides, requests, and anonymized examples.
            </p>
          </section>
          <section>
            <h2>Why it helps</h2>
            <ul>
              {qaUseCases.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2>Guardrails</h2>
            <ul>
              {qaSidebarItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </aside>
      </section>
    </main>
  );
}
