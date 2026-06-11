"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CustomerBrand } from "../src/components/CustomerBrand";
import { CustomerNav } from "../src/components/CustomerNav";
import { TopicNav } from "../src/components/TopicNav";

const outcomes = [
  {
    title: "Weight and metabolic health",
    detail: "Explore GLP-1 consults, metabolic labs, and everyday support without starting from a product grid.",
    href: "/goals/weight-loss",
    keywords: ["weight", "metabolic", "glp1", "labs", "weight loss"],
    action: "Start weight intake",
    badge: "Most guided",
    proof: "Intake first"
  },
  {
    title: "Hair loss support",
    detail: "Match thinning, shedding, and routine goals to consult or direct-care options.",
    href: "/goals/hair-loss",
    keywords: ["hair", "hair loss", "thinning", "scalp"],
    action: "Start hair intake",
    badge: "Popular",
    proof: "Goal matched"
  },
  {
    title: "Skin and personal care",
    detail: "Start with acne, texture, redness, or daily routine goals, then see the relevant next step.",
    href: "/goals/skin-care",
    keywords: ["skin", "care", "personal", "clear", "routine", "acne"],
    action: "Start skin intake",
    badge: "Routine focused",
    proof: "Fast intake"
  },
  {
    title: "Labs and health checks",
    detail: "Find screening paths for metabolic, hormone, thyroid, and baseline wellness questions.",
    href: "/goals/wellness-labs",
    keywords: ["labs", "testing", "screening", "metabolic", "thyroid"],
    action: "Start labs intake",
    badge: "Data led",
    proof: "Labs available"
  }
];

const suggestions = ["Weight loss", "Hair loss", "Skin support", "Labs"];
const startOptions = [
  {
    title: "I have symptoms or a concern",
    detail: "Describe what changed or what feels off.",
    href: "/my-health"
  },
  {
    title: "I know what I want to test",
    detail: "Browse labs, genetics, hormones, and nutrients.",
    href: "/labs"
  },
  {
    title: "I already have results",
    detail: "Add labs or records to organize and review.",
    href: "/my-health"
  },
  {
    title: "I want clinician input",
    detail: "Prepare your information for review when appropriate.",
    href: "/my-health"
  }
];

const healthAreas = [
  {
    title: "Heart & metabolic",
    detail: "Cholesterol · ApoB · A1c · Insulin",
    href: "/metabolic"
  },
  {
    title: "Hormones & energy",
    detail: "Thyroid · Testosterone · Cortisol",
    href: "/hormones"
  },
  {
    title: "Genetics",
    detail: "WGS · Traits · Medication response",
    href: "/genetics"
  },
  {
    title: "Skin & hair",
    detail: "Hair · Skin · Nutrients · Hormones",
    href: "/skin-hair"
  },
  {
    title: "Nutrients & inflammation",
    detail: "Vitamin D · B12 · Iron · hs-CRP",
    href: "/nutrients"
  },
  {
    title: "Complete baseline",
    detail: "Core labs · Trends · Follow-up",
    href: "/baseline"
  }
];

const howItWorksSteps = [
  {
    title: "Start with a concern, goal, test, or result.",
    detail:
      "Tell us what you are trying to understand, or browse directly if you already know what you want."
  },
  {
    title: "Find relevant labs, products, or next steps.",
    detail:
      "Condensed Health helps organize possible options based on your goals and health information."
  },
  {
    title: "Get results in My Health.",
    detail:
      "Your dashboard brings together orders, lab results, genetics, uploaded records, and recommendations."
  },
  {
    title: "Review what may need follow-up.",
    detail:
      "See plain-English explanations, trends over time, and care options when clinician review may be appropriate."
  }
];

const dashboardFeatures = [
  "View lab results and genetic reports",
  "Track biomarkers over time",
  "Add previous labs or records",
  "See suggested next steps",
  "Prepare information for clinician review when appropriate"
];

const trustItems = [
  "Lab-based testing through qualified partners",
  "Secure account and results dashboard",
  "Clear explanations without replacing medical care",
  "Clinician review available where appropriate",
  "Services and availability may vary by location"
];

const popularProducts = [
  {
    title: "Complete Health Baseline",
    meta: "Broad lab starting point",
    href: "/labs"
  },
  {
    title: "Advanced Heart & Metabolic Panel",
    meta: "Cardio-metabolic markers",
    href: "/weight-loss"
  },
  {
    title: "Hormone Panel",
    meta: "Thyroid, sex hormones, stress",
    href: "/hormones"
  },
  {
    title: "Whole Genome Sequencing",
    meta: "Genetics review path",
    href: "/genetic-testing"
  },
  {
    title: "Hair & Skin Support",
    meta: "Products and follow-up",
    href: "/hair-loss"
  },
  {
    title: "Daily Nutrient Essentials",
    meta: "Wellness products",
    href: "/shop"
  }
];

const additionalOutcomes = [
  {
    title: "Genetics and inherited risk",
    detail: "Look at family history, carrier screening, and inherited risk questions in one starting path.",
    href: "/genetic-testing",
    label: "Genetics",
    meta: "Family context"
  },
  {
    title: "Hormone questions",
    detail: "Connect thyroid, testosterone, fertility, and cycle-related concerns to relevant testing.",
    href: "/hormones",
    label: "Hormones",
    meta: "Panel guided"
  },
  {
    title: "Medication fit",
    detail: "Compare care paths where clinician review matters before a product or treatment decision.",
    href: "/my-health",
    label: "Review",
    meta: "Clinician input"
  },
  {
    title: "Recent lab follow-up",
    detail: "Use existing results to decide whether to retest, monitor, or ask for a review.",
    href: "/labs",
    label: "Labs",
    meta: "Result led"
  },
  {
    title: "Routine products",
    detail: "Browse direct-purchase products after you have a clear support category in mind.",
    href: "/shop",
    label: "Products",
    meta: "Shop ready"
  },
  {
    title: "Ongoing tracking",
    detail: "Keep health goals, orders, tests, and next steps organized in one place.",
    href: "/my-health",
    label: "My Health",
    meta: "Dashboard"
  }
];

const outcomeSlides = [
  {
    title: "Metabolic reset",
    detail: "A focused path for weight, glucose, energy, and long-term risk questions.",
    href: "/weight-loss",
    label: "Featured path",
    stats: ["Labs", "Review", "Plan"]
  },
  {
    title: "Results check-in",
    detail: "Bring recent labs or outside results into a cleaner next-step view.",
    href: "/my-health",
    label: "Data first",
    stats: ["Upload", "Compare", "Decide"]
  },
  {
    title: "Skin and hair basics",
    detail: "A lower-friction entry point for routine concerns and product-supported care.",
    href: "/hair-loss",
    label: "Everyday care",
    stats: ["Concern", "Match", "Track"]
  }
];

const faqs = [
  {
    question: "Where should I start if I do not know what to test?",
    answer:
      "Start with your concern, symptoms, goals, or recent results. The review path can help narrow whether labs, imaging, genetics, products, or clinician input make sense."
  },
  {
    question: "Can I browse tests and products directly?",
    answer:
      "Yes. Labs and direct-purchase products can be browsed from the catalog areas. Some options, like imaging and genetics, start with review because eligibility, safety, and follow-up matter."
  },
  {
    question: "What is the difference between labs, imaging, and genetics?",
    answer:
      "Labs usually measure blood, urine, stool, or similar samples. Imaging includes CT, MRI, ultrasound, DEXA, and X-ray. Genetics looks at inherited variants, sequencing, carrier status, medication response, or longer-term risk."
  },
  {
    question: "Can I use results I already have?",
    answer:
      "Yes. Recent lab results, imaging reports, or genetic reports can be used as context for choosing a next step, deciding whether to retest, or asking for follow-up."
  },
  {
    question: "Do all options require clinician review?",
    answer:
      "No. Some products and lab options can be direct. Imaging, genetics, and care-program paths are review-first because the right next step depends on health history, risk, and safety details."
  }
];

function matchesQuery(outcome: (typeof outcomes)[number], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const haystack = [outcome.title, outcome.detail, ...outcome.keywords].join(" ").toLowerCase();

  return normalizedQuery
    .split(/\s+/)
    .filter(Boolean)
    .some((term) => haystack.includes(term));
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [activeOutcomeSlide, setActiveOutcomeSlide] = useState(0);
  const visibleOutcomes = useMemo(() => {
    const matches = outcomes.filter((outcome) => matchesQuery(outcome, query));

    return matches.length > 0 ? matches : outcomes;
  }, [query]);
  const featuredOutcomes = visibleOutcomes.slice(0, 2);
  const activeSlide = outcomeSlides[activeOutcomeSlide];

  return (
    <main className="shell">
      <section className="topbar" aria-label="Shop navigation">
        <CustomerBrand />
        <TopicNav />
        <div className="nav-actions">
          <CustomerNav />
        </div>
      </section>

      <section className="home-hero" id="start-options" aria-labelledby="home-start-title">
        <div className="home-hero-inner">
          <div className="home-hero-card">
            <div className="home-hero-content">
              <div className="home-start-heading">
                <h1 id="home-start-title">Find the right next step.</h1>
                <p className="home-start-subtitle">
                  Start with a concern, a goal, or existing results. We'll help you find relevant
                  tests, products, or clinician review.
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
              <img src="/home/health-hero.png" alt="" />
            </div>
          </div>

        </div>
      </section>

      <section className="home-search-band" aria-label="Search health topics">
        <form className="home-search" role="search" onSubmit={(event) => event.preventDefault()}>
          <div className="home-search-box">
            <input
              aria-label="Search care topics"
              id="home-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search symptoms, labs, products..."
            />
          </div>
          <div className="search-suggestions" aria-label="Suggested searches">
            {suggestions.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => setQuery(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
        </form>
      </section>

      <section className="home-health-areas" aria-labelledby="health-areas-title">
        <div className="home-section-header">
          <div>
            <h2 id="health-areas-title">Popular health areas</h2>
            <p>Testing, products, and follow-up organized around common health questions.</p>
          </div>
          <Link href="/shop" className="home-section-link">
            View all
          </Link>
        </div>

        <div className="home-health-area-grid">
          {healthAreas.map((area) => (
            <Link href={area.href} key={area.title} className="home-health-area-card">
              <div className="home-health-area-card-top">
                <span>{area.title}</span>
                <span aria-hidden="true" className="home-health-area-arrow">
                  →
                </span>
              </div>
              <p>{area.detail}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="how-it-works-section" aria-labelledby="how-it-works-title">
        <div className="how-it-works-heading">
          <p className="eyebrow">How Condensed Health works</p>
          <h2 id="how-it-works-title">From question to next step.</h2>
        </div>

        <div className="how-it-works-grid">
          {howItWorksSteps.map((step, index) => (
            <article key={step.title} className="how-it-works-card">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-preview-section" aria-labelledby="dashboard-preview-title">
        <div className="dashboard-preview-copy">
          <p className="eyebrow">My Health dashboard</p>
          <h2 id="dashboard-preview-title">Your health information, organized.</h2>
          <p>
            My Health helps you keep track of results, products, recommendations, and follow-up in
            one place.
          </p>
          <Link className="nav-link primary-link" href="/my-health">
            Open My Health
          </Link>
        </div>

        <div className="dashboard-preview-panel" aria-label="Dashboard features">
          {dashboardFeatures.map((feature) => (
            <article key={feature}>
              <span aria-hidden="true">✓</span>
              <p>{feature}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="trust-section" aria-labelledby="trust-title">
        <div className="trust-copy">
          <p className="eyebrow">Built for health decisions</p>
          <h2 id="trust-title">Built for health decisions, not just shopping.</h2>
        </div>

        <div className="trust-list">
          {trustItems.map((item) => (
            <div key={item}>
              <span aria-hidden="true">✓</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="popular-products-section" aria-labelledby="popular-products-title">
        <div className="popular-products-heading">
          <p className="eyebrow">Popular tests and products</p>
          <h2 id="popular-products-title">Frequently browsed starting points.</h2>
        </div>

        <div className="popular-products-grid">
          {popularProducts.map((product) => (
            <Link href={product.href} key={product.title} className="popular-product-card">
              <div>
                <span>{product.meta}</span>
                <h3>{product.title}</h3>
              </div>
              <strong>View</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="faq-section" aria-labelledby="faq-title">
        <div className="faq-heading">
          <p className="eyebrow">Frequently asked questions</p>
          <h2 id="faq-title">Common questions before you start.</h2>
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
