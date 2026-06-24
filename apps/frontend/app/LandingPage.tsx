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

export type LabSectionVariant = "hidden" | "grid" | "list" | "bands";
type ActiveReportSectionVariant = "viewer" | "toc" | "spread" | "explorer";
type ReportSectionDisplayVariant = ActiveReportSectionVariant | "hidden";
export type ReportSectionVariant =
  | ReportSectionDisplayVariant
  | "document"
  | "cards"
  | "outline";
export type FaqSectionVariant = "accordion" | "compact" | "columns";

const labSectionVariantValues = ["hidden", "bands", "grid", "list"] as const;
const reportSectionVariantValues = ["hidden", "viewer", "toc", "spread", "explorer"] as const;
const faqSectionVariantValues = ["accordion", "compact", "columns"] as const;

function pickVariant<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function normalizeReportVariant(variant: ReportSectionVariant): ReportSectionDisplayVariant {
  if (variant === "viewer" || variant === "toc" || variant === "spread" || variant === "explorer") {
    return variant;
  }

  if (variant === "hidden") {
    return variant;
  }

  if (variant === "outline") {
    return "toc";
  }

  if (variant === "cards") {
    return "explorer";
  }

  return "viewer";
}

const reportMockupSections = [
  {
    title: "Lab Summary",
    detail: "A plain-English overview of what was reviewed and which results deserve attention."
  },
  {
    title: "Results Reviewed",
    detail: "Uploaded lab reports, portal screenshots, PDF results, dates, ranges, and available trends."
  },
  {
    title: "Marker Groups",
    detail: "Related labs organized by category, such as metabolic, thyroid, lipid, nutrient, liver, kidney, and blood count markers."
  },
  {
    title: "Abnormal and Borderline Results",
    detail: "Out-of-range and near-range values explained in context instead of one marker at a time."
  },
  {
    title: "Missing or Follow-up Labs",
    detail: "Markers that may be worth asking about when the uploaded results do not fully answer the question."
  },
  {
    title: "Questions to Discuss",
    detail: "A concise list of follow-up questions to bring to a clinician when interpretation or next steps are unclear."
  }
];

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

const reportTocRows = [
  ["01", "Lab Summary", "1"],
  ["02", "Results Reviewed", "2"],
  ["03", "Marker Groups", "4"],
  ["04", "Abnormal Results", "6"],
  ["05", "Missing Labs", "8"],
  ["06", "Questions to Discuss", "10"],
  ["Appendix A", "Reference Ranges", "11"]
];

const heroContent = {
  title: "Upload your records. Get a clear written analysis.",
  primaryCta: "Get started"
};

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

function LabCategoriesSection({ variant }: { variant: LabSectionVariant }) {
  return (
    <section
      className="home-content-section home-problem-section"
      id="what-we-review"
      aria-labelledby="lab-categories-title"
    >
      <div className="home-lab-category-section">
        <div className="home-lab-category-header">
          <h3 id="lab-categories-title">Health review & testing</h3>
          <p>
            Upload the results you already have. Condensed Health organizes related markers,
            explains what stands out, and shows what may be missing or worth asking about.
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
            View all review areas
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

export function ReportPreviewVariantB() {
  return (
    <div className="home-report-toc-layout" aria-label="Sample report table of contents">
      <article className="home-report-toc-page">
        <div className="home-report-toc-heading">
          <span>Condensed Health</span>
          <h3>Health Data Analysis</h3>
        </div>

        <ol className="home-report-toc-list">
          {reportTocRows.map(([number, label, page]) => (
            <li key={label}>
              <span>{number}</span>
              <strong>{label}</strong>
              <i aria-hidden="true" />
              <b>{page}</b>
            </li>
          ))}
        </ol>
      </article>

      <aside className="home-report-toc-summary" aria-label="Report summary">
        <dl>
          <div>
            <dt>Pages</dt>
            <dd>12</dd>
          </div>
          <div>
            <dt>Records Reviewed</dt>
            <dd>8</dd>
          </div>
          <div>
            <dt>Key Findings</dt>
            <dd>7</dd>
          </div>
          <div>
            <dt>Open Questions</dt>
            <dd>3</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}

export function ReportPreviewVariantC() {
  return (
    <div className="home-report-spread" aria-label="Two-page sample report spread">
      <article className="home-report-spread-page">
        <div className="home-report-page-meta">
          <span>Page 1</span>
          <p>Lab Summary</p>
        </div>
        <h3>Lab Summary</h3>
        <section>
          <h4>Records Reviewed</h4>
          <ul>
            <li>CBC</li>
            <li>CMP</li>
            <li>Lipid Panel</li>
            <li>Iron Studies</li>
          </ul>
        </section>
        <section>
          <h4>Key observations</h4>
          <p>LDL cholesterol is elevated across repeat testing. Ferritin is low-normal while hemoglobin remains normal.</p>
        </section>
      </article>

      <article className="home-report-spread-page">
        <div className="home-report-page-meta">
          <span>Page 10</span>
          <p>Visit Prep</p>
        </div>
        <h3>Questions to Discuss</h3>
        <ul className="home-report-question-list">
          <li>Would repeat ferritin testing be helpful?</li>
          <li>Is additional lipid testing warranted?</li>
          <li>Are symptoms consistent with lab findings?</li>
          <li>Which markers should be tracked over time?</li>
        </ul>
      </article>
    </div>
  );
}

export function ReportPreviewVariantD() {
  const [expandedId, setExpandedId] = useState(reportViewerSections[3].id);
  const expandedSection =
    reportViewerSections.find((section) => section.id === expandedId) ?? reportViewerSections[3];

  return (
    <div className="home-report-explorer" aria-label="Expandable sample report section explorer">
      <div className="home-report-explorer-grid">
        {reportViewerSections.map((section) => (
          <button
            aria-expanded={expandedSection.id === section.id}
            className="home-report-explorer-tile"
            key={section.id}
            type="button"
            onClick={() => setExpandedId(section.id)}
          >
            <span>{section.label}</span>
            <p>{section.blocks[0].value}</p>
            <small>{section.blocks[0].label}</small>
          </button>
        ))}
      </div>

      <article className="home-report-explorer-preview">
        <div className="home-report-page-meta">
          <span>{expandedSection.eyebrow}</span>
          <p>{expandedSection.page}</p>
        </div>
        <h3>{expandedSection.title}</h3>
        {expandedSection.blocks.map((block) => (
          <section key={block.label}>
            <h4>{block.label}</h4>
            <p>{block.value}</p>
          </section>
        ))}
      </article>
    </div>
  );
}

function ReportSection({ variant }: { variant: ActiveReportSectionVariant }) {
  return (
    <section
      className="home-content-section home-report-artifact-section"
      id="whats-included"
      aria-labelledby="features-title"
    >
      <span id="sample-report" className="home-section-anchor" aria-hidden="true" />
      <div className="home-artifact-header">
        <h2 id="features-title">See what’s inside a report</h2>
        <p>
          Explore a lightweight preview of how the written report is organized: reviewed records,
          findings, missing context, and the questions that can help make the next visit more
          focused.
        </p>
      </div>

      {variant === "toc" ? <ReportPreviewVariantB /> : null}
      {variant === "spread" ? <ReportPreviewVariantC /> : null}
      {variant === "explorer" ? <ReportPreviewVariantD /> : null}
      {variant === "viewer" ? <ReportPreviewVariantA /> : null}
    </section>
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
  labVariant = "bands",
  reportVariant = "hidden",
  faqVariant = "accordion"
}: {
  labVariant?: LabSectionVariant;
  reportVariant?: ReportSectionVariant;
  faqVariant?: FaqSectionVariant;
}) {
  const searchParams = useSearchParams();
  const selectedLabVariant = pickVariant(searchParams.get("labs"), labSectionVariantValues, labVariant);
  const selectedReportVariant = pickVariant(
    searchParams.get("report"),
    reportSectionVariantValues,
    normalizeReportVariant(reportVariant)
  );
  const selectedFaqVariant = pickVariant(searchParams.get("faq"), faqSectionVariantValues, faqVariant);

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

            <div className="home-hero-actions home-hero-centered-actions">
              <Link className="home-primary-cta" href="/my-health">
                {heroContent.primaryCta}
              </Link>
              <Link className="home-secondary-pill" href="/health-areas">
                Explore care
              </Link>
            </div>
          </div>

          <div className="home-hero-centered-report">
            <ReportPreviewVariantA />
          </div>
        </div>
      </section>

      {selectedLabVariant !== "hidden" ? <LabCategoriesSection variant={selectedLabVariant} /> : null}

      {selectedReportVariant !== "hidden" ? <ReportSection variant={selectedReportVariant} /> : null}

      <FaqSection variant={selectedFaqVariant} />
    </main>
  );
}

export function LandingPage(props: {
  labVariant?: LabSectionVariant;
  reportVariant?: ReportSectionVariant;
  faqVariant?: FaqSectionVariant;
}) {
  return (
    <Suspense fallback={null}>
      <LandingPageContent {...props} />
    </Suspense>
  );
}
