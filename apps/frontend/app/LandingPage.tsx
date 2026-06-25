"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { SiteHeader } from "../src/components/SiteHeader";

const labAnalysisCategories = [
  {
    title: "Metabolic and glucose",
    markers: "A1c, fasting glucose, insulin, CMP, triglycerides, weight-related markers",
    detail: "Blood sugar and metabolic markers reviewed together instead of one value at a time."
  },
  {
    title: "Cholesterol and heart risk",
    markers: "LDL-C, HDL, triglycerides, ApoB, Lp(a), hs-CRP",
    detail: "Lipid and cardiovascular risk markers organized into a clearer risk discussion."
  },
  {
    title: "Thyroid",
    markers: "TSH, free T4, free T3, TPO antibodies, thyroglobulin antibodies",
    detail: "Thyroid values reviewed with related markers, prior trends, and missing context."
  },
  {
    title: "Nutrients and deficiencies",
    markers: "Ferritin, iron, B12, folate, vitamin D, magnesium, zinc",
    detail: "Low, borderline, and missing nutrient markers explained in plain English."
  },
  {
    title: "Liver and kidney",
    markers: "ALT, AST, bilirubin, ALP, creatinine, eGFR, BUN",
    detail: "Organ-function markers grouped so abnormal or borderline values are easier to interpret."
  },
  {
    title: "Blood counts and inflammation",
    markers: "CBC, WBC, hemoglobin, platelets, hs-CRP, ESR",
    detail: "Blood count patterns and inflammation markers reviewed for trends and follow-up questions."
  },
  {
    title: "Hormones",
    markers: "Testosterone, estradiol, progesterone, LH, FSH, cortisol, DHEA-S",
    detail: "Hormone panels organized with timing, ranges, and related lab context when available."
  },
  {
    title: "Genetic and specialty markers",
    markers: "APOE, pharmacogenomics, carrier screening, specialty panels",
    detail: "Genetic and specialty results summarized carefully with limits and clinician questions."
  }
];

const services = [
  {
    title: "Health review",
    detail: "Upload existing labs, records, or reports and get a clear written analysis of what stands out.",
    href: "/my-health",
    cta: "Start review",
    chips: ["Labs", "Records", "Questions"]
  },
  {
    title: "Testing",
    detail: "Find lab and diagnostic options that match the question you are trying to answer.",
    href: "/labs",
    cta: "Explore testing",
    chips: ["Missing labs", "Follow-up tests", "Diagnostics"]
  },
  {
    title: "Preventive screening",
    detail: "Compare baseline checks, risk markers, and screening paths before choosing a next step.",
    href: "/health-areas",
    cta: "View screenings",
    chips: ["Risk markers", "Family history", "Baseline checks"]
  },
  {
    title: "Follow-up",
    detail: "Turn results into organized questions, repeat testing ideas, and clinician discussion points.",
    href: "/library",
    cta: "Plan follow-up",
    chips: ["Trends", "Repeat results", "Next steps"]
  }
];

export type ServicesSectionVariant = "hidden" | "cards" | "alternating";
export type ReviewSectionVariant = "hidden" | "grid" | "list" | "bands";
export type TrustRowVariant = "inline";
export type HeroCopyVariant = "clinician-plan";
export type FaqSectionVariant = "accordion" | "compact" | "columns";

const servicesSectionVariantValues = ["hidden", "cards", "alternating"] as const;
const reviewSectionVariantValues = ["hidden", "bands", "grid", "list"] as const;
const trustRowVariantValues = ["inline"] as const;
const heroCopyVariantValues = ["clinician-plan"] as const;
const faqSectionVariantValues = ["accordion", "compact", "columns"] as const;

function pickVariant<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

const reportViewerSections = [
  {
    id: "lab-summary",
    label: "Lab Summary",
    page: "Page 1 of 12",
    title: "Lab Summary",
    eyebrow: "Sample Report",
    blocks: [
      { label: "Records reviewed", value: "CBC · CMP · Lipid Panel · Iron Studies · Vitamin D" },
      { label: "Primary pattern", value: "Lipids and iron markers are the clearest areas for follow-up discussion." },
      { label: "Key observation", value: "LDL has been elevated across repeat testing while ferritin remains low-normal." },
      { label: "Recent change", value: "Vitamin D improved after supplementation, while fatigue symptoms and afternoon crashes are still noted." },
      { label: "Discussion points", value: "Ask whether ApoB, Lp(a), repeat ferritin, or a broader iron panel would add useful context." },
      { label: "Clinician summary", value: "Main follow-up areas: lipid risk context, iron stores, symptom timeline, and whether repeat testing is appropriate." }
    ]
  },
  {
    id: "results-reviewed",
    label: "Results Reviewed",
    page: "Page 2 of 12",
    title: "Results Reviewed",
    eyebrow: "Source Material",
    blocks: [
      { label: "Uploads", value: "2 lab reports · 1 visit note · medication list · symptom timeline" },
      { label: "Date range", value: "March 2025 through June 2026" },
      { label: "Included panels", value: "CBC, CMP, lipids, thyroid, iron studies, B12, and vitamin D." },
      { label: "Medication context", value: "Current medication list was reviewed for possible overlap with fatigue, lipid, and liver marker interpretation." },
      { label: "Symptoms included", value: "Afternoon tiredness, low energy with exercise, cold intolerance, and intermittent brain fog were included in the timeline." }
    ]
  },
  {
    id: "marker-groups",
    label: "Marker Groups",
    page: "Page 4 of 12",
    title: "Marker Groups",
    eyebrow: "Organization",
    blocks: [
      { label: "Metabolic", value: "A1c, fasting glucose, triglycerides, ALT, and weight history." },
      { label: "Cardiovascular", value: "LDL-C, HDL-C, triglycerides, non-HDL cholesterol, and family history." },
      { label: "Nutrient status", value: "Ferritin, B12, vitamin D, hemoglobin, and MCV reviewed together." },
      { label: "Thyroid context", value: "TSH was reviewed with symptoms and prior values; free T4 and thyroid antibodies were not present in the uploads." },
      { label: "Inflammation", value: "No hs-CRP or ESR result was available, so inflammation context could not be assessed from the uploaded records." }
    ]
  },
  {
    id: "abnormal-results",
    label: "Abnormal Results",
    page: "Page 6 of 12",
    title: "Abnormal Results",
    eyebrow: "Finding Detail",
    blocks: [
      { label: "LDL Cholesterol", value: "165 mg/dL · Above reference range" },
      { label: "Context", value: "Elevated across multiple tests." },
      { label: "Related markers", value: "HDL: 62 · Triglycerides: 81" },
      { label: "Trend", value: "LDL was 151 mg/dL in 2025 and 165 mg/dL in 2026, suggesting a persistent pattern rather than a one-off value." },
      { label: "Missing context", value: "ApoB, Lp(a), blood pressure, smoking status, and family history would affect how this result is discussed." },
      { label: "Discussion point", value: "Would ApoB or Lp(a) testing add clarity?" }
    ]
  },
  {
    id: "missing-labs",
    label: "Missing Labs",
    page: "Page 8 of 12",
    title: "Missing Labs",
    eyebrow: "Potential Gaps",
    blocks: [
      { label: "Cardiovascular context", value: "ApoB and Lp(a) were not included in the uploaded lipid panels." },
      { label: "Iron context", value: "Ferritin was checked, but transferrin saturation was not available." },
      { label: "Thyroid context", value: "Free T4, free T3, TPO antibodies, and thyroglobulin antibodies were not included with the uploaded TSH result." },
      { label: "Metabolic context", value: "Fasting insulin was not available, so insulin resistance cannot be evaluated from the uploaded labs alone." },
      { label: "Follow-up consideration", value: "Repeat testing may be useful if symptoms or medication changes continue." }
    ]
  },
  {
    id: "questions",
    label: "Questions to Discuss",
    page: "Page 10 of 12",
    title: "Questions to Discuss",
    eyebrow: "Visit Prep",
    blocks: [
      { label: "Lipid follow-up", value: "Is additional lipid risk testing warranted given repeated LDL elevation?" },
      { label: "Iron status", value: "Would repeat ferritin or iron studies help explain fatigue symptoms?" },
      { label: "Thyroid context", value: "Should free T4, thyroid antibodies, or repeat TSH be considered given the symptom timeline?" },
      { label: "Metabolic follow-up", value: "Would fasting insulin, repeat A1c, or CGM data add context for afternoon crashes?" },
      { label: "Trend review", value: "Which changes should be tracked before the next appointment?" }
    ]
  }
];

const heroContentByVariant: Record<
  HeroCopyVariant,
  {
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
  }
> = {
  "clinician-plan": {
    title: "Get a clinician-reviewed plan for your health questions.",
    subtitle:
      "Share your symptoms, labs, records, history, and prior care. We review the full picture and give you written next steps — what may matter, what may be missing, and what to ask or test next.",
    primaryCta: "Start a review",
    secondaryCta: "See testing options"
  }
};

const trustItems = ["Clinician-reviewed", "Written next steps", "Testing guidance", "Private upload"];

const faqs = [
  {
    question: "What if Condensed Health cannot produce a useful lab analysis from what I provide?",
    answer:
      "If we cannot produce a useful written lab analysis from the results you provide, we will refund you. In some cases, we may ask for a clearer report, reference ranges, dates, or related results first."
  },
  {
    question: "What does Condensed Health produce?",
    answer:
      "Condensed Health produces a written lab analysis report. It organizes your uploaded results, explains abnormal and borderline markers, groups related labs, and lists follow-up questions to discuss when needed."
  },
  {
    question: "Can I upload results I already have?",
    answer:
      "Yes. You can upload bloodwork PDFs, portal screenshots, lab result images, genetic reports, or other documents that include lab values and reference ranges."
  },
  {
    question: "What if I do not have recent labs?",
    answer:
      "You can still start with the records you have. If important context is missing, we may suggest follow-up labs or testing options that you can discuss with a clinician or order through available partners when supported."
  },
  {
    question: "Can Condensed Health diagnose me?",
    answer:
      "No. Condensed Health does not diagnose, prescribe, or replace medical care. It helps explain and organize lab information so you can have a better-informed conversation with a qualified clinician."
  },
  {
    question: "Is this useful if my labs were normal?",
    answer:
      "Often, yes. A lab analysis can help separate clearly normal results from borderline values, trends, related markers, or missing labs that may still be worth asking about."
  },
  {
    question: "Can I bring the report to my doctor?",
    answer:
      "Yes. The report is designed to be readable for you and concise enough to support a focused conversation about your lab results."
  },
  {
    question: "Does this replace urgent care or emergency care?",
    answer:
      "No. Condensed Health is not for emergencies or urgent medical situations. If you have symptoms that may need immediate attention, seek medical care directly."
  }
];

function ServicesSection({ variant }: { variant: Exclude<ServicesSectionVariant, "hidden"> }) {
  return (
    <section className="home-content-section home-services-section" id="services" aria-labelledby="services-title">
      <div className="home-services-inner">
        <div className="home-services-header">
          <h2 id="services-title">Services</h2>
          <p>
            Start with the kind of support you need. Each path keeps records, testing, and follow-up
            organized around a clear next step.
          </p>
        </div>

        <div className={`home-services-grid home-services-grid-${variant}`}>
          {services.map((service) => (
            <Link className="home-service-card" href={service.href} key={service.title}>
              <div>
                <h3>{service.title}</h3>
                <p>{service.detail}</p>
                <span className="home-service-chips" aria-label={`${service.title} topics`}>
                  {service.chips.map((chip) => (
                    <span key={chip}>{chip}</span>
                  ))}
                </span>
                <span className="home-service-cta">
                  {service.cta}
                  <span aria-hidden="true">→</span>
                </span>
              </div>
              <span className="home-service-visual" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroTrustRow({ variant }: { variant: TrustRowVariant }) {
  return (
    <ul className={`home-hero-trust-row home-hero-trust-row-${variant}`} aria-label="Trust and review details">
      {trustItems.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function ReviewTestingSection({ variant }: { variant: Exclude<ReviewSectionVariant, "hidden"> }) {
  return (
    <section
      className="home-content-section home-problem-section"
      id="what-we-review"
      aria-labelledby="lab-categories-title"
    >
      <div className="home-lab-category-section">
        <div className="home-lab-category-header">
          <h3 id="lab-categories-title">Areas we cover</h3>
          <p>
            Explore common health areas where records, testing, screening, and follow-up can be
            organized into a clearer next step.
          </p>
        </div>

        {variant === "list" ? (
          <div className="home-lab-category-list">
            {labAnalysisCategories.map((category, index) => (
              <article className="home-lab-category-row" key={category.title}>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h4>{category.title}</h4>
                  <p>{category.detail}</p>
                </div>
                <strong>{category.markers}</strong>
              </article>
            ))}
          </div>
        ) : variant === "bands" ? (
          <div className="home-lab-category-bands">
            {labAnalysisCategories.map((category) => (
              <article className="home-lab-category-band" key={category.title}>
                <div>
                  <h4>{category.title}</h4>
                  <p>{category.detail}</p>
                </div>
                <span>{category.markers}</span>
              </article>
            ))}
          </div>
        ) : (
          <div className="home-lab-category-grid">
            {labAnalysisCategories.map((category) => (
              <article className="home-lab-category-card" key={category.title}>
                <div>
                  <h4>{category.title}</h4>
                  <p>{category.detail}</p>
                </div>
                <span>{category.markers}</span>
              </article>
            ))}
          </div>
        )}

        <div className="home-lab-category-footer">
          <Link href="/labs">
            View all health areas
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function ReportPreviewVariantA() {
  const [activeId, setActiveId] = useState(reportViewerSections[3].id);
  const activeSection =
    reportViewerSections.find((section) => section.id === activeId) ?? reportViewerSections[3];

  return (
    <div className="home-report-viewer" aria-label="Interactive sample report viewer">
      <aside className="home-report-viewer-nav" aria-label="Report sections">
        {reportViewerSections.map((section) => (
          <button
            aria-pressed={activeSection.id === section.id}
            key={section.id}
            type="button"
            onClick={() => setActiveId(section.id)}
          >
            {section.label}
          </button>
        ))}
      </aside>

      <article className="home-report-viewer-page">
        <div className="home-report-page-meta">
          <span>{activeSection.eyebrow}</span>
          <p>{activeSection.page}</p>
        </div>
        <h3>{activeSection.title}</h3>
        <div className="home-report-viewer-blocks">
          {activeSection.blocks.map((block) => (
            <section key={block.label}>
              <h4>{block.label}</h4>
              <p>{block.value}</p>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}

function FaqSection({ variant }: { variant: FaqSectionVariant }) {
  return (
    <section className="faq-section" id="faq" aria-labelledby="faq-title">
      <div className="faq-heading">
        <h2 id="faq-title">Questions people ask before getting started</h2>
      </div>

      {variant === "compact" ? (
        <div className="faq-list-compact">
          {faqs.map((faq) => (
            <article className="faq-compact-item" key={faq.question}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </article>
          ))}
        </div>
      ) : variant === "columns" ? (
        <div className="faq-list-columns">
          {faqs.map((faq) => (
            <article className="faq-card" key={faq.question}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="faq-list">
          {faqs.map((faq) => (
            <details key={faq.question} className="faq-item">
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}

function LandingPageContent({
  servicesVariant = "cards",
  reviewVariant = "bands",
  trustVariant = "inline",
  heroVariant = "clinician-plan",
  faqVariant = "accordion"
}: {
  servicesVariant?: ServicesSectionVariant;
  reviewVariant?: ReviewSectionVariant;
  trustVariant?: TrustRowVariant;
  heroVariant?: HeroCopyVariant;
  faqVariant?: FaqSectionVariant;
}) {
  const searchParams = useSearchParams();
  const selectedHeroVariant = pickVariant(searchParams.get("hero"), heroCopyVariantValues, heroVariant);
  const selectedServicesVariant = pickVariant(
    searchParams.get("services"),
    servicesSectionVariantValues,
    servicesVariant
  );
  const selectedReviewVariant = pickVariant(
    searchParams.get("review"),
    reviewSectionVariantValues,
    reviewVariant
  );
  const selectedTrustVariant = pickVariant(searchParams.get("trust"), trustRowVariantValues, trustVariant);
  const selectedFaqVariant = pickVariant(searchParams.get("faq"), faqSectionVariantValues, faqVariant);
  const heroContent = heroContentByVariant[selectedHeroVariant];

  return (
    <main className="shell landing-page">
      <SiteHeader ariaLabel="Condensed Health navigation" actionHref="/my-health" actionLabel="My Health" />

      <section
        className="home-hero home-hero-centered"
        id="start-review"
        aria-labelledby="home-start-title"
      >
        <div className="home-hero-centered-inner">
          <div className="home-hero-centered-copy">
            <h1 id="home-start-title">{heroContent.title}</h1>
            <p className="home-start-subtitle">{heroContent.subtitle}</p>

            <div className="home-hero-actions home-hero-centered-actions">
              <Link className="home-primary-cta" href="/my-health">
                {heroContent.primaryCta}
              </Link>
              <Link className="home-secondary-pill" href="/health-areas">
                {heroContent.secondaryCta}
              </Link>
            </div>

            <HeroTrustRow variant={selectedTrustVariant} />
          </div>

          <div className="home-hero-centered-report">
            <ReportPreviewVariantA />
          </div>
        </div>
      </section>

      {selectedServicesVariant !== "hidden" ? <ServicesSection variant={selectedServicesVariant} /> : null}

      {selectedReviewVariant !== "hidden" ? <ReviewTestingSection variant={selectedReviewVariant} /> : null}

      <FaqSection variant={selectedFaqVariant} />
    </main>
  );
}

export function LandingPage(props: {
  servicesVariant?: ServicesSectionVariant;
  reviewVariant?: ReviewSectionVariant;
  trustVariant?: TrustRowVariant;
  heroVariant?: HeroCopyVariant;
  faqVariant?: FaqSectionVariant;
}) {
  return (
    <Suspense fallback={null}>
      <LandingPageContent {...props} />
    </Suspense>
  );
}
