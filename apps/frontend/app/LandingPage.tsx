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
    href: "/start-review",
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
export type TrustRowVariant = "hidden" | "inline";
export type HeroCopyVariant = "clinician-plan";
export type FaqSectionVariant = "accordion" | "compact" | "columns";
export type TypographyVariant = "default" | "soft" | "editorial";
export type ColorThemeVariant = "default" | "clinical" | "warm";

const servicesSectionVariantValues = ["hidden", "cards", "alternating"] as const;
const reviewSectionVariantValues = ["hidden", "bands", "grid", "list"] as const;
const trustRowVariantValues = ["hidden", "inline"] as const;
const heroCopyVariantValues = ["clinician-plan"] as const;
const faqSectionVariantValues = ["accordion", "compact", "columns"] as const;
const typographyVariantValues = ["default", "soft", "editorial"] as const;
const colorThemeVariantValues = ["default", "clinical", "warm"] as const;

function pickVariant<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

const reportViewerSections = [
  {
    id: "overview",
    label: "Overview",
    page: "Page 1 of 14",
    title: "Overview",
    eyebrow: "Sample written review",
    blocks: [
      { label: "Reason for review", value: "Ongoing fatigue, lower exercise tolerance, and questions about prior lab results." },
      { label: "Main takeaway", value: "Several findings are worth discussing together rather than viewing as isolated normal or abnormal values." },
      { label: "Highest-yield areas", value: "Lipid risk context, iron status, thyroid follow-up, and whether additional metabolic markers would clarify symptoms." },
      { label: "Important limitation", value: "This review can organize questions and next steps, but it does not diagnose a condition or replace medical care." }
    ]
  },
  {
    id: "what-reviewed",
    label: "What We Reviewed",
    page: "Page 2 of 14",
    title: "What We Reviewed",
    eyebrow: "Source material",
    blocks: [
      { label: "Uploads", value: "2 lab reports · 1 visit note · medication list · symptom timeline" },
      { label: "Date range", value: "March 2025 through June 2026" },
      { label: "Labs included", value: "CBC, CMP, lipid panel, TSH, ferritin, B12, vitamin D, and A1c." },
      { label: "Clinical context", value: "Symptoms, medication list, family history notes, and prior clinician comments were reviewed alongside the labs." },
      { label: "Not included", value: "No exam findings, blood pressure log, sleep history, or complete iron/thyroid follow-up panel was available." }
    ]
  },
  {
    id: "key-findings",
    label: "Key Findings",
    page: "Page 4 of 14",
    title: "Key Findings",
    eyebrow: "Synthesis",
    blocks: [
      { label: "Persistent lipid pattern", value: "LDL-C has been elevated on more than one test, while HDL and triglycerides are not the main concern." },
      { label: "Iron context", value: "Ferritin is low-normal, which may be relevant to fatigue for some people even when hemoglobin is normal." },
      { label: "Thyroid context", value: "TSH alone does not fully answer thyroid-related questions when symptoms persist." },
      { label: "Symptom fit", value: "The uploaded records do not point to one clear explanation; several follow-up areas may be reasonable to review." }
    ]
  },
  {
    id: "abnormal-results",
    label: "Abnormal Results",
    page: "Page 5 of 14",
    title: "Abnormal Results",
    eyebrow: "Finding detail",
    blocks: [
      { label: "LDL Cholesterol", value: "165 mg/dL · Above reference range" },
      { label: "Trend", value: "LDL was 151 mg/dL in 2025 and 165 mg/dL in 2026, suggesting a repeated pattern rather than a single outlier." },
      { label: "Related markers", value: "HDL: 62 · Triglycerides: 81 · A1c: 5.4" },
      { label: "Why it matters", value: "LDL interpretation depends on overall risk context, including family history, blood pressure, smoking status, and other markers." },
      { label: "Reasonable follow-up", value: "Ask whether ApoB, Lp(a), or a more complete cardiovascular risk review would add clarity." }
    ]
  },
  {
    id: "possible-conditions",
    label: "Possible Conditions",
    page: "Page 7 of 14",
    title: "Possible Conditions",
    eyebrow: "Differential to discuss",
    blocks: [
      { label: "Iron deficiency without anemia", value: "Can be considered when ferritin is low or low-normal and fatigue is present, but full iron studies are needed." },
      { label: "Thyroid dysfunction or autoimmunity", value: "Cannot be ruled in or out from TSH alone when symptoms persist." },
      { label: "Cardiometabolic risk", value: "Repeated LDL elevation may warrant a broader risk discussion even if glucose and triglycerides look reassuring." },
      { label: "Sleep, medication, or lifestyle contributors", value: "Symptoms may also relate to sleep quality, stress, medication effects, nutrition, or training load." }
    ]
  },
  {
    id: "treatment-options",
    label: "Treatment Options",
    page: "Page 8 of 14",
    title: "Treatment Options",
    eyebrow: "Options to discuss",
    blocks: [
      { label: "Clinician-directed care", value: "Medication, supplements, or referrals should be based on clinician assessment, medical history, and follow-up results." },
      { label: "Lifestyle foundations", value: "Sleep, nutrition, activity level, alcohol intake, and stress are practical areas to review before assuming one lab explains symptoms." },
      { label: "Lipid management", value: "Depending on risk, options may include dietary changes, exercise, additional risk testing, or medication discussion." },
      { label: "Iron follow-up", value: "If iron deficiency is suspected, the next step is usually confirming status and identifying possible causes before supplementing." },
      { label: "Symptom tracking", value: "A simple timeline of fatigue, sleep, exercise, medication changes, and cycle changes can make follow-up visits more useful." }
    ]
  },
  {
    id: "missing-context",
    label: "Missing Labs & Context",
    page: "Page 10 of 14",
    title: "Missing Labs & Context",
    eyebrow: "Potential gaps",
    blocks: [
      { label: "Cardiovascular context", value: "ApoB and Lp(a) were not included in the uploaded lipid panels." },
      { label: "Iron context", value: "Transferrin saturation, serum iron, and TIBC were not available with ferritin." },
      { label: "Thyroid context", value: "Free T4, free T3, TPO antibodies, and thyroglobulin antibodies were not included." },
      { label: "Inflammation context", value: "No hs-CRP or ESR result was available, so inflammation context could not be assessed from uploads alone." },
      { label: "History context", value: "Blood pressure, sleep quality, diet pattern, menstrual history if relevant, and family history would change interpretation." }
    ]
  },
  {
    id: "questions",
    label: "Questions to Discuss",
    page: "Page 12 of 14",
    title: "Questions to Discuss",
    eyebrow: "Visit prep",
    blocks: [
      { label: "Lipid follow-up", value: "Is additional lipid risk testing warranted given repeated LDL elevation?" },
      { label: "Iron status", value: "Would repeat ferritin or iron studies help explain fatigue symptoms?" },
      { label: "Thyroid context", value: "Should free T4, thyroid antibodies, or repeat TSH be considered given the symptom timeline?" },
      { label: "Metabolic follow-up", value: "Would fasting insulin, repeat A1c, or CGM data add context for afternoon crashes?" },
      { label: "Visit planning", value: "Which symptoms or timeline details would be most helpful to bring to the next appointment?" }
    ]
  },
  {
    id: "next-steps",
    label: "Suggested Next Steps",
    page: "Page 14 of 14",
    title: "Suggested Next Steps",
    eyebrow: "Action plan",
    blocks: [
      { label: "Prepare for review", value: "Bring the symptom timeline, prior labs, medication list, and the questions above to a clinician visit." },
      { label: "Consider targeted testing", value: "Discuss whether lipid risk markers, complete iron studies, thyroid follow-up, or inflammation markers are appropriate." },
      { label: "Track what changes", value: "Log fatigue severity, sleep, exercise tolerance, and any medication or supplement changes before repeating labs." },
      { label: "Avoid overinterpreting", value: "Do not start or stop treatment based only on this review; use it to support a clearer clinical conversation." },
      { label: "Escalate when needed", value: "Seek timely care for new chest pain, shortness of breath, fainting, neurological symptoms, severe weakness, or rapidly worsening symptoms." }
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

function HeroTrustRow({ variant }: { variant: Exclude<TrustRowVariant, "hidden"> }) {
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
  const [activeId, setActiveId] = useState(reportViewerSections[0].id);
  const activeSection =
    reportViewerSections.find((section) => section.id === activeId) ?? reportViewerSections[0];

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
          <span>Sample written review</span>
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
        {activeSection.id === "possible-conditions" ? (
          <p className="home-report-viewer-note">
            These possibilities depend on your full history, exam, and any follow-up testing.
          </p>
        ) : null}
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
  trustVariant = "hidden",
  heroVariant = "clinician-plan",
  faqVariant = "accordion",
  typographyVariant = "default",
  colorThemeVariant = "default"
}: {
  servicesVariant?: ServicesSectionVariant;
  reviewVariant?: ReviewSectionVariant;
  trustVariant?: TrustRowVariant;
  heroVariant?: HeroCopyVariant;
  faqVariant?: FaqSectionVariant;
  typographyVariant?: TypographyVariant;
  colorThemeVariant?: ColorThemeVariant;
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
  const selectedTypographyVariant = pickVariant(searchParams.get("type"), typographyVariantValues, typographyVariant);
  const selectedColorThemeVariant = pickVariant(searchParams.get("theme"), colorThemeVariantValues, colorThemeVariant);
  const heroContent = heroContentByVariant[selectedHeroVariant];

  return (
    <main
      className={`shell landing-page landing-type-${selectedTypographyVariant} landing-theme-${selectedColorThemeVariant}`}
    >
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
              <Link className="home-primary-cta" href="/start-review">
                {heroContent.primaryCta}
              </Link>
              <Link className="home-secondary-pill" href="/health-areas">
                {heroContent.secondaryCta}
              </Link>
            </div>

            {selectedTrustVariant !== "hidden" ? <HeroTrustRow variant={selectedTrustVariant} /> : null}
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
  typographyVariant?: TypographyVariant;
  colorThemeVariant?: ColorThemeVariant;
}) {
  return (
    <Suspense fallback={null}>
      <LandingPageContent {...props} />
    </Suspense>
  );
}
