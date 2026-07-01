"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { CustomerBrand } from "../src/components/CustomerBrand";
import { CustomerNav } from "../src/components/CustomerNav";
import { TopicNav } from "../src/components/TopicNav";
import { reviewStartPaths } from "../src/lib/reviewStartPaths";

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
    href: "/message-team",
    cta: "Start review",
    icon: "review",
    chips: ["Labs", "Records", "Questions"]
  },
  {
    title: "Testing",
    detail: "Find lab and diagnostic options that match the question you are trying to answer.",
    href: "/message-team",
    cta: "Explore testing",
    icon: "testing",
    chips: ["Missing labs", "Follow-up tests", "Diagnostics"]
  },
  {
    title: "Preventive screening",
    detail: "Compare baseline checks, risk markers, and screening paths before choosing a next step.",
    href: "/message-team",
    cta: "View screenings",
    icon: "preventive",
    chips: ["Risk markers", "Family history", "Baseline checks"]
  },
  {
    title: "Follow-up",
    detail: "Turn results into organized questions, repeat testing ideas, and clinician discussion points.",
    href: "/library",
    cta: "Plan follow-up",
    icon: "follow-up",
    chips: ["Trends", "Repeat results", "Next steps"]
  }
];

const specificTestOptions = [
  {
    title: "General health panel",
    detail: "Get help choosing a baseline lab panel for energy, metabolism, inflammation, and organ function.",
    href: "/message-team",
    meta: "Testing"
  },
  {
    title: "Hormone testing",
    detail: "Explore hormone labs for fertility, cycles, testosterone, thyroid context, or menopause questions.",
    href: "/hormones",
    meta: "Labs"
  },
  {
    title: "STI testing",
    detail: "Find testing options based on exposure, symptoms, timing, and whether home collection makes sense.",
    href: "/message-team",
    meta: "Screening"
  },
  {
    title: "Genetic testing",
    detail: "Explore genetics options for inherited risk, carrier screening, and medication response.",
    href: "/genetic-testing",
    meta: "Genetics"
  },
  {
    title: "Thyroid testing",
    detail: "Look at thyroid labs and antibodies when symptoms, medication, or prior results need context.",
    href: "/message-team",
    meta: "Thyroid"
  },
  {
    title: "Fertility testing",
    detail: "Compare fertility and reproductive hormone labs based on timing, goals, and prior history.",
    href: "/message-team",
    meta: "Fertility"
  }
] as const;

const specificReviewServices = [
  {
    title: "Bloodwork analysis",
    detail: "Review bloodwork patterns, abnormal values, borderline markers, and what may need follow-up.",
    markers: "CBC, CMP, lipids, A1c, inflammation"
  },
  {
    title: "Hormone analysis",
    detail: "Make sense of reproductive, thyroid, adrenal, or sex hormone results with timing and context.",
    markers: "TSH, estradiol, progesterone, testosterone, cortisol"
  },
  {
    title: "Fertility analysis",
    detail: "Review fertility labs and reproductive history so the next testing or care question is clearer.",
    markers: "AMH, FSH, LH, estradiol, progesterone"
  },
  {
    title: "Genetic analysis",
    detail: "Understand genetic, carrier, risk, or medication-response reports without overinterpreting them.",
    markers: "APOE, PGx, carrier screening, specialty panels"
  },
  {
    title: "Nutrient analysis",
    detail: "Look at deficiency patterns that can relate to energy, hair, mood, recovery, or diet questions.",
    markers: "Ferritin, iron, B12, folate, vitamin D"
  },
  {
    title: "Metabolic analysis",
    detail: "Review blood sugar, insulin resistance, cholesterol, and weight-related risk markers together.",
    markers: "A1c, fasting glucose, insulin, ApoB, triglycerides"
  }
] as const;

const clinicianOptions = [
  {
    title: "Primary care",
    detail: "Find a general clinician for broad concerns, routine follow-up, and next-step planning.",
    href: "/message-team",
    meta: "Clinicians"
  },
  {
    title: "Women's health",
    detail: "Get routed toward support for fertility, hormones, cycles, menopause, or pelvic health questions.",
    href: "/message-team",
    meta: "Specialty"
  },
  {
    title: "Genetics guidance",
    detail: "Talk through genetics results, inherited risk, carrier screening, or medication-response questions.",
    href: "/message-team",
    meta: "Genetics"
  },
  {
    title: "Nutrition support",
    detail: "Find help connecting labs, symptoms, and diet questions to a practical plan.",
    href: "/message-team",
    meta: "Nutrition"
  },
  {
    title: "Mental health",
    detail: "Explore clinician options for mood, stress, sleep, focus, and related care needs.",
    href: "/message-team",
    meta: "Care"
  },
  {
    title: "Specialist routing",
    detail: "Get help figuring out what type of clinician or specialist may make sense next.",
    href: "/message-team",
    meta: "Referral"
  }
] as const;

const treatmentOptions = [
  {
    title: "Medication review",
    detail: "Talk through prescriptions, side effects, interactions, and questions to bring to a clinician.",
    href: "/message-team",
    meta: "Treatment"
  },
  {
    title: "Lifestyle plan",
    detail: "Connect testing, symptoms, and goals to practical nutrition, sleep, exercise, or habit ideas.",
    href: "/message-team",
    meta: "Planning"
  },
  {
    title: "Supplement review",
    detail: "Review supplements in the context of labs, safety, evidence, and clinician follow-up questions.",
    href: "/message-team",
    meta: "Supplements"
  },
  {
    title: "Care plan check",
    detail: "Get help understanding a care recommendation and what questions still need a decision.",
    href: "/message-team",
    meta: "Guidance"
  },
  {
    title: "Second opinion prep",
    detail: "Organize results, records, and questions before speaking with another clinician.",
    href: "/message-team",
    meta: "Review"
  },
  {
    title: "Follow-up timing",
    detail: "Think through when repeat testing, monitoring, or a care visit might be worth discussing.",
    href: "/message-team",
    meta: "Next steps"
  }
] as const;

const heroSearchCards = [
  { label: "Testing", icon: "testing" },
  { label: "Results review", icon: "results" },
  { label: "Clinicians", icon: "clinicians" },
  { label: "Treatments", icon: "treatments" },
  { label: "Health concern", icon: "concern" },
  { label: "Not sure", icon: "question" }
] as const;

function HeroSearchIcon({ icon }: { icon: (typeof heroSearchCards)[number]["icon"] }) {
  if (icon === "testing") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M9 3h6" />
        <path d="M10 3v6l-4 7a3 3 0 0 0 2.6 4.5h6.8A3 3 0 0 0 18 16l-4-7V3" />
        <path d="M8 15h8" />
      </svg>
    );
  }

  if (icon === "results") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M7 3h7l3 3v15H7z" />
        <path d="M14 3v4h4" />
        <path d="M10 12h5" />
        <path d="M10 16h4" />
      </svg>
    );
  }

  if (icon === "clinicians") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
        <path d="M5 21a7 7 0 0 1 14 0" />
        <path d="M12 15v4" />
        <path d="M10 17h4" />
      </svg>
    );
  }

  if (icon === "treatments") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" />
      </svg>
    );
  }

  if (icon === "concern") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
        <path d="M9 12h2l1-2 2 4 1-2h2" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 17h.01" />
      <path d="M9.5 9a2.7 2.7 0 0 1 5.1 1.2c0 2-2.6 2.1-2.6 4" />
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" />
    </svg>
  );
}

function nextCarouselIndex(currentIndex: number, itemCount: number, visibleCount = 3) {
  return Math.min(currentIndex + 1, Math.max(itemCount - visibleCount, 0));
}

function previousCarouselIndex(currentIndex: number) {
  return Math.max(currentIndex - 1, 0);
}

function visibleCarouselItems<T>(items: readonly T[], startIndex: number, visibleCount = 3) {
  return items.slice(startIndex, startIndex + visibleCount);
}

export type ServicesSectionVariant = "hidden" | "cards" | "alternating" | "carousel";
export type ReviewSectionVariant = "hidden" | "grid" | "list" | "bands" | "carousel";
export type SimpleCarouselSectionVariant = "hidden" | "carousel";
export type TrustRowVariant = "hidden" | "inline";
export type TopBarLineVariant = "gutter" | "full";
export type HeroCopyVariant =
  | "clinician-plan"
  | "start-review"
  | "consult-overlay"
  | "consult-search"
  | "consult-services"
  | "consult-explainer";
export type FaqSectionVariant = "hidden" | "accordion" | "compact" | "columns";
export type TypographyVariant = "default" | "soft" | "editorial";
export type ColorThemeVariant = "default" | "clinical" | "warm";

const servicesSectionVariantValues = ["hidden", "cards", "alternating", "carousel"] as const;
const reviewSectionVariantValues = ["hidden", "bands", "grid", "list", "carousel"] as const;
const simpleCarouselSectionVariantValues = ["hidden", "carousel"] as const;
const trustRowVariantValues = ["hidden", "inline"] as const;
const topBarLineVariantValues = ["gutter", "full"] as const;
const heroCopyVariantValues = [
  "consult-overlay",
  "consult-search",
  "clinician-plan",
  "start-review",
  "consult-services",
  "consult-explainer"
] as const;
const faqSectionVariantValues = ["hidden", "accordion", "compact", "columns"] as const;
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
    title: "Get an online health consult for your health questions.",
    subtitle:
      "Share your symptoms, labs, records, history, and prior care. We review the full picture and give you written next steps — what may matter, what may be missing, and what to ask or test next.",
    primaryCta: "Request a consult",
    secondaryCta: "See testing options"
  },
  "start-review": {
    title: "Start with your health question.",
    subtitle:
      "Choose the closest starting point. You can add symptoms, records, labs, history, and prior care in the next step.",
    primaryCta: "Start a review",
    secondaryCta: "See testing options"
  },
  "consult-overlay": {
    title: "Healthcare services without the guesswork.",
    subtitle:
      "Tell us what you're trying to figure out, or choose a service to start. We'll help you find the right option for testing, results, and next steps.",
    primaryCta: "Message our team",
    secondaryCta: "See testing options"
  },
  "consult-search": {
    title: "Healthcare services without the guesswork.",
    subtitle:
      "Tell us what you're trying to figure out, or choose a service to start. We'll help you find the right option for testing, results, and next steps.",
    primaryCta: "Message our team",
    secondaryCta: "See testing options"
  },
  "consult-services": {
    title: "Online care for questions that need a closer look.",
    subtitle:
      "Share your symptoms, health history, labs, records, and prior care. We review the full picture and help you understand what may matter, what may be missing, and what to ask or test next.",
    primaryCta: "Explore services",
    secondaryCta: "See testing options"
  },
  "consult-explainer": {
    title: "Online care that starts by reviewing the full picture.",
    subtitle:
      "Share what is going on, what you have already tried, and the records you already have. Your consult organizes the context, explains what stands out, and turns it into clear written next steps.",
    primaryCta: "",
    secondaryCta: ""
  }
};

const trustItems = ["Clinician-reviewed", "Written next steps", "Testing guidance", "Private upload"];

const consultExplainerItems = [
  {
    title: "Review your context",
    detail: "Symptoms, history, medications, labs, records, and prior care are looked at together."
  },
  {
    title: "Explain what may matter",
    detail: "The plan highlights patterns, abnormal results, risk factors, and findings worth discussing."
  },
  {
    title: "Show what may be missing",
    detail: "If important context is absent, the review calls out labs, records, or details that could clarify the next step."
  },
  {
    title: "Organize next steps",
    detail: "You get written guidance for what to ask, test, monitor, or follow up on when appropriate."
  }
];

const consultOverlayNavLinks = [
  { href: "/my-health", label: "My Health" },
  { href: "/#services", label: "Services" },
  { href: "/library", label: "Health library" }
];

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
  const [carouselIndex, setCarouselIndex] = useState(0);
  const visibleTests = visibleCarouselItems(specificTestOptions, carouselIndex, 4);
  const canGoPrevious = carouselIndex > 0;
  const canGoNext = carouselIndex < specificTestOptions.length - 4;

  return (
    <section className="home-content-section home-services-section" id="services" aria-labelledby="services-title">
      <div className="home-services-inner">
        <div className="home-services-header">
          <div className="home-section-header-copy">
            <h2 id="services-title">{variant === "carousel" ? "Tests" : "Services"}</h2>
            <p>
              {variant === "carousel"
                ? "Find testing paths based on what you want to understand."
                : "Start with the kind of support you need. Each path keeps records, testing, and follow-up organized around a clear next step."}
            </p>
          </div>
          {variant === "carousel" ? (
            <div className="home-section-header-action">
              <Link href="/message-team">
                View all tests
              </Link>
              <button
                aria-label="Previous tests"
                className="home-carousel-arrow"
                disabled={!canGoPrevious}
                type="button"
                onClick={() => setCarouselIndex((index) => previousCarouselIndex(index))}
              >
                ←
              </button>
              <button
                aria-label="Next tests"
                className="home-carousel-arrow"
                disabled={!canGoNext}
                type="button"
                onClick={() => setCarouselIndex((index) => nextCarouselIndex(index, specificTestOptions.length, 4))}
              >
                →
              </button>
            </div>
          ) : null}
        </div>

        {variant === "carousel" ? (
          <div className="home-arrow-carousel" aria-label="Testing options">
            <div className="home-specific-carousel">
              {visibleTests.map((service) => (
                <Link className="home-specific-service-card" href={service.href} key={service.title}>
                  <span>{service.meta}</span>
                  <h3>{service.title}</h3>
                  <p>{service.detail}</p>
                  <small>
                    Start here
                    <span aria-hidden="true">→</span>
                  </small>
                </Link>
              ))}
            </div>
          </div>
        ) : (
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
        )}
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
  const [carouselIndex, setCarouselIndex] = useState(0);
  const visibleAnalysis = visibleCarouselItems(specificReviewServices, carouselIndex, 4);
  const canGoPrevious = carouselIndex > 0;
  const canGoNext = carouselIndex < specificReviewServices.length - 4;

  return (
    <section
      className="home-content-section home-problem-section"
      id="what-we-review"
      aria-labelledby="lab-categories-title"
    >
      <div className="home-lab-category-section">
        <div className="home-lab-category-header">
          <div className="home-section-header-copy">
            <h3 id="lab-categories-title">{variant === "carousel" ? "Analysis" : "Areas we cover"}</h3>
            <p>
              {variant === "carousel"
                ? "Make sense of labs, genetics, hormones, and other results."
                : "Explore common health areas where records, testing, screening, and follow-up can be organized into a clearer next step."}
            </p>
          </div>
          <div className="home-section-header-action">
            <Link href="/message-team">
              {variant === "carousel" ? "View all analysis" : "View all areas"}
            </Link>
            {variant === "carousel" ? (
              <>
                <button
                  aria-label="Previous analysis categories"
                  className="home-carousel-arrow"
                  disabled={!canGoPrevious}
                  type="button"
                  onClick={() => setCarouselIndex((index) => previousCarouselIndex(index))}
                >
                  ←
                </button>
                <button
                  aria-label="Next analysis categories"
                  className="home-carousel-arrow"
                  disabled={!canGoNext}
                  type="button"
                  onClick={() =>
                    setCarouselIndex((index) => nextCarouselIndex(index, specificReviewServices.length, 4))
                  }
                >
                  →
                </button>
              </>
            ) : null}
          </div>
        </div>

        {variant === "carousel" ? (
          <div className="home-arrow-carousel" aria-label="Analysis categories">
            <div className="home-specific-carousel home-specific-carousel-review">
              {visibleAnalysis.map((service) => (
                <article className="home-specific-service-card home-specific-review-card" key={service.title}>
                  <span>{service.markers}</span>
                  <h4>{service.title}</h4>
                  <p>{service.detail}</p>
                </article>
              ))}
            </div>
          </div>
        ) : variant === "list" ? (
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

      </div>
    </section>
  );
}

function SimpleLandingCarouselSection({
  ariaLabel,
  footerHref,
  footerLabel,
  heading,
  id,
  items,
  nextLabel,
  previousLabel,
  subtitle
}: {
  ariaLabel: string;
  footerHref: string;
  footerLabel: string;
  heading: string;
  id: string;
  items: readonly {
    title: string;
    detail: string;
    href: string;
    meta: string;
  }[];
  nextLabel: string;
  previousLabel: string;
  subtitle: string;
}) {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const visibleItems = visibleCarouselItems(items, carouselIndex, 4);
  const canGoPrevious = carouselIndex > 0;
  const canGoNext = carouselIndex < items.length - 4;
  const titleId = `${id}-title`;

  return (
    <section className="home-content-section home-problem-section" id={id} aria-labelledby={titleId}>
      <div className="home-lab-category-section">
        <div className="home-lab-category-header">
          <div className="home-section-header-copy">
            <h3 id={titleId}>{heading}</h3>
            <p>{subtitle}</p>
          </div>
          <div className="home-section-header-action">
            <Link href={footerHref}>
              {footerLabel}
            </Link>
            <button
              aria-label={previousLabel}
              className="home-carousel-arrow"
              disabled={!canGoPrevious}
              type="button"
              onClick={() => setCarouselIndex((index) => previousCarouselIndex(index))}
            >
              ←
            </button>
            <button
              aria-label={nextLabel}
              className="home-carousel-arrow"
              disabled={!canGoNext}
              type="button"
              onClick={() => setCarouselIndex((index) => nextCarouselIndex(index, items.length, 4))}
            >
              →
            </button>
          </div>
        </div>

        <div className="home-arrow-carousel" aria-label={ariaLabel}>
          <div className="home-specific-carousel">
            {visibleItems.map((item) => (
              <Link className="home-specific-service-card" href={item.href} key={item.title}>
                <span>{item.meta}</span>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
                <small>
                  Ask us
                  <span aria-hidden="true">→</span>
                </small>
              </Link>
            ))}
          </div>
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

function StartReviewHero({ trustVariant }: { trustVariant: TrustRowVariant }) {
  const heroContent = heroContentByVariant["start-review"];

  return (
    <section className="home-hero home-hero-review-start" id="start-review" aria-labelledby="home-start-title">
      <div className="home-hero-review-start-inner">
        <div className="start-review-choice-panel">
          <div className="start-review-copy">
            <h1 id="home-start-title">{heroContent.title}</h1>
            <p>{heroContent.subtitle}</p>
          </div>

          <div className="start-review-option-grid">
            {reviewStartPaths.map((path) => (
              <Link className="start-review-option" href={`/my-health?start=${path.id}`} key={path.id}>
                <span>{path.title}</span>
                <p>{path.detail}</p>
                <small>
                  Start
                  <span aria-hidden="true">→</span>
                </small>
              </Link>
            ))}
          </div>

          <p className="start-review-note">
            Your review starts by collecting the context needed to produce a useful written plan.
          </p>

          {trustVariant !== "hidden" ? <HeroTrustRow variant={trustVariant} /> : null}
        </div>

        <aside className="start-review-visual" aria-hidden="true">
          <div className="start-review-abstract-card">
            <span />
            <span />
            <span />
            <span />
            <div>
              <i />
              <i />
              <i />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function ConsultOverlayHero() {
  const heroContent = heroContentByVariant["consult-overlay"];

  return (
    <section className="home-hero home-hero-consult-overlay" id="start-review" aria-labelledby="home-start-title">
      <div className="home-hero-consult-stage">
        <img
          className="home-hero-consult-background"
          src="/images/heroimage12.png"
          alt=""
          aria-hidden="true"
        />

        <div className="home-hero-consult-card">
          <h1 id="home-start-title">{heroContent.title}</h1>
          <p>{heroContent.subtitle}</p>
          <Link className="home-primary-cta" href="/message-team">
            {heroContent.primaryCta}
          </Link>
          <p className="home-hero-account-link">
            No appointment required{" "}
            <span className="home-hero-free-note">
              <span aria-hidden="true">·</span> Free to start
            </span>{" "}
            <span className="home-hero-account-prompt">
              <span aria-hidden="true">·</span> Already have an account? <Link href="/account">Sign in</Link>
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

function ConsultSearchHero() {
  const heroContent = heroContentByVariant["consult-search"];
  const [carouselIndex, setCarouselIndex] = useState(0);
  const visibleHeroCards = visibleCarouselItems(heroSearchCards, carouselIndex, 5);
  const canGoPrevious = carouselIndex > 0;
  const canGoNext = carouselIndex < heroSearchCards.length - 5;

  return (
    <section className="home-hero home-hero-consult-search" id="start-review" aria-labelledby="home-start-title">
      <div className="home-hero-consult-search-inner">
        <div className="home-hero-consult-search-copy">
          <h1 id="home-start-title">{heroContent.title}</h1>
        </div>

        <div className="home-hero-card-carousel" aria-label="Common starting points">
          <button
            aria-label="Previous starting points"
            className="home-carousel-arrow"
            disabled={!canGoPrevious}
            type="button"
            onClick={() => setCarouselIndex((current) => previousCarouselIndex(current))}
          >
            ‹
          </button>
          <div className="home-hero-search-card-row">
            {visibleHeroCards.map((card) => (
              <div className="home-hero-search-card" key={card.label}>
                <span className="home-hero-search-card-icon">
                  <HeroSearchIcon icon={card.icon} />
                </span>
                <strong>{card.label}</strong>
              </div>
            ))}
          </div>
          <button
            aria-label="Next starting points"
            className="home-carousel-arrow"
            disabled={!canGoNext}
            type="button"
            onClick={() => setCarouselIndex((current) => nextCarouselIndex(current, heroSearchCards.length, 5))}
          >
            ›
          </button>
        </div>

        <div className="home-hero-search-bar" aria-label="Message our team">
          <span>What are you trying to figure out?</span>
          <strong>{heroContent.primaryCta}</strong>
        </div>
      </div>
    </section>
  );
}

function ConsultServicesHero() {
  const heroContent = heroContentByVariant["consult-services"];

  return (
    <section className="home-hero home-hero-consult-services" id="start-review" aria-labelledby="home-start-title">
      <div className="home-hero-consult-services-inner">
        <div className="home-hero-consult-services-copy">
          <h1 id="home-start-title">{heroContent.title}</h1>
          <p>{heroContent.subtitle}</p>
          <Link className="home-primary-cta" href="#services">
            {heroContent.primaryCta}
          </Link>
        </div>

        <aside className="home-consult-services-panel" aria-labelledby="home-consult-services-title">
          <div className="home-consult-services-heading">
            <span>Choose a starting point</span>
            <h2 id="home-consult-services-title">Online health consult</h2>
          </div>

          <div className="home-consult-services-list">
            {services.map((service) => (
              <Link className="home-consult-service-card" href={service.href} key={service.title}>
                <span
                  className={`home-consult-service-icon home-consult-service-icon-${service.icon}`}
                  aria-hidden="true"
                />
                <span>
                  <strong>{service.title}</strong>
                  <small>{service.detail}</small>
                </span>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function ConsultExplainerHero() {
  const heroContent = heroContentByVariant["consult-explainer"];

  return (
    <section className="home-hero home-hero-consult-explainer" id="start-review" aria-labelledby="home-start-title">
      <div className="home-hero-consult-explainer-inner">
        <div className="home-hero-consult-explainer-copy">
          <h1 id="home-start-title">{heroContent.title}</h1>
          <p>{heroContent.subtitle}</p>
        </div>

        <aside className="home-consult-explainer-panel" aria-label="What the consult includes">
          <span>What your consult does</span>
          <div className="home-consult-explainer-list">
            {consultExplainerItems.map((item) => (
              <article className="home-consult-explainer-item" key={item.title}>
                <h2>{item.title}</h2>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function ConsultOverlayHeader({ lineVariant }: { lineVariant: TopBarLineVariant }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    function handleDocumentPointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (menuRef.current?.contains(target) || menuButtonRef.current?.contains(target)) {
        return;
      }

      setIsMenuOpen(false);
    }

    document.addEventListener("pointerdown", handleDocumentPointerDown);

    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
    };
  }, [isMenuOpen]);

  return (
    <header
      className={`consult-overlay-header consult-overlay-header-lines-${lineVariant} ${
        isMenuOpen ? "consult-overlay-header-menu-open" : ""
      }`}
      aria-label="Condensed Health navigation"
    >
      <div className="consult-overlay-primary-bar">
        <button
          ref={menuButtonRef}
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation menu"
          className="consult-overlay-menu-button"
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
        <CustomerBrand />
        <nav ref={menuRef} className="consult-overlay-service-bar" aria-label="Site sections">
          {consultOverlayNavLinks.map((link) => (
            <Link href={link.href} key={link.href} onClick={() => setIsMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>
        <Link className="consult-overlay-mobile-sign-in" href="/account">
          Sign in
        </Link>
      </div>
    </header>
  );
}

function LandingHeader() {
  return (
    <section className="topbar site-header" aria-label="Condensed Health navigation">
      <CustomerBrand />
      <TopicNav />
      <div className="nav-actions">
        <CustomerNav
          primaryHref="/my-health"
          primaryLabel="My Health"
        />
      </div>
    </section>
  );
}

function LandingPageContent({
  typographyVariant = "default",
  colorThemeVariant = "default"
}: {
  typographyVariant?: TypographyVariant;
  colorThemeVariant?: ColorThemeVariant;
}) {
  const searchParams = useSearchParams();
  const selectedTypographyVariant = pickVariant(searchParams.get("type"), typographyVariantValues, typographyVariant);
  const selectedColorThemeVariant = pickVariant(searchParams.get("theme"), colorThemeVariantValues, colorThemeVariant);

  return (
    <main
      className={`shell landing-page landing-type-${selectedTypographyVariant} landing-theme-${selectedColorThemeVariant}`}
    >
      <ConsultOverlayHeader lineVariant="gutter" />
      <ConsultSearchHero />
      <ServicesSection variant="carousel" />
      <ReviewTestingSection variant="carousel" />
      <SimpleLandingCarouselSection
        ariaLabel="Clinician options"
        footerHref="/message-team"
        footerLabel="View all clinicians"
        heading="Clinicians"
        id="clinicians"
        items={clinicianOptions}
        nextLabel="Next clinician options"
        previousLabel="Previous clinician options"
        subtitle="Find care support for the question you are trying to solve."
      />
      <SimpleLandingCarouselSection
        ariaLabel="Treatment options"
        footerHref="/message-team"
        footerLabel="View all treatments"
        heading="Treatments"
        id="treatments"
        items={treatmentOptions}
        nextLabel="Next treatment options"
        previousLabel="Previous treatment options"
        subtitle="Compare next steps after results, symptoms, or care guidance."
      />

    </main>
  );
}

export function LandingPage(props: {
  typographyVariant?: TypographyVariant;
  colorThemeVariant?: ColorThemeVariant;
}) {
  return (
    <Suspense fallback={null}>
      <LandingPageContent {...props} />
    </Suspense>
  );
}
