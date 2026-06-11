export type TopicPage = {
  slug: string;
  label: string;
  eyebrow: string;
  title: string;
  summary: string;
  imageClass: string;
  intakeHref?: string;
  intakeLabel?: string;
  secondaryHref: string;
  secondaryLabel: string;
  highlights: string[];
  sections: Array<{
    title: string;
    detail: string;
  }>;
};

export const topicPages = {
  "genetic-testing": {
    slug: "genetic-testing",
    label: "Genetics",
    eyebrow: "Precision health",
    title: "Genetic testing with the right scope.",
    summary:
      "Compare whole genome sequencing, exome sequencing, focused panels, carrier screening, and pharmacogenomics before starting review.",
    imageClass: "genetic",
    secondaryHref: "/shop",
    secondaryLabel: "Browse products",
    highlights: ["30x WGS and exome", "Carrier and risk panels", "Medication response genetics"],
    sections: [
      {
        title: "Choose the test scope",
        detail:
          "Genome, exome, panel, chromosomal, and single-variant tests answer different questions and are not interchangeable."
      },
      {
        title: "Review before ordering",
        detail:
          "Clinical genetics can involve secondary findings, family implications, privacy choices, and confirmatory follow-up."
      },
      {
        title: "Where it fits",
        detail:
          "Genetic testing should support care decisions and family planning discussions, not replace provider review."
      }
    ]
  },
  "weight-loss": {
    slug: "weight-loss",
    label: "Metabolic Health",
    eyebrow: "Metabolic care",
    title: "Weight loss support that starts with context.",
    summary:
      "Learn about metabolic health paths before beginning an intake for GLP-1 care, labs, or non-medication support.",
    imageClass: "weight",
    intakeHref: "/goals/weight-loss",
    intakeLabel: "Start weight intake",
    secondaryHref: "/shop",
    secondaryLabel: "View shop",
    highlights: ["GLP-1 consult paths", "Metabolic lab support", "Lifestyle and follow-up planning"],
    sections: [
      {
        title: "Care fit",
        detail:
          "The intake should collect health history, medication goals, contraindications, and prior weight-management context."
      },
      {
        title: "Labs and monitoring",
        detail:
          "Some paths may include baseline metabolic labs or follow-up checks before a recommendation is made."
      },
      {
        title: "Next step",
        detail:
          "When ready, the intake route can collect the details needed to match the right care or checkout path."
      }
    ]
  },
  "hair-loss": {
    slug: "hair-loss",
    label: "Skin & Hair Health",
    eyebrow: "Hair health",
    title: "Hair loss care for shedding, thinning, and scalp goals.",
    summary:
      "A dedicated overview for hair concerns before routing into the focused hair-loss intake.",
    imageClass: "hair",
    intakeHref: "/goals/hair-loss",
    intakeLabel: "Start hair intake",
    secondaryHref: "/shop",
    secondaryLabel: "Browse products",
    highlights: ["Pattern and timeline", "Scalp and routine context", "Treatment fit"],
    sections: [
      {
        title: "What the path should ask",
        detail:
          "Hair loss support needs timeline, pattern, triggers, medications, scalp symptoms, and prior treatments."
      },
      {
        title: "Why context matters",
        detail:
          "Different hair concerns can point to different causes, so the page should separate education from the intake decision."
      },
      {
        title: "Next step",
        detail:
          "The intake can then collect enough detail to recommend an appropriate consult or product path."
      }
    ]
  },
  "labs": {
    slug: "labs",
    label: "Labs & Diagnostics",
    eyebrow: "Diagnostics",
    title: "Labs and imaging with a clearer reason.",
    summary:
      "Use this page to compare lab and imaging paths before users begin wellness, metabolic, thyroid, hormone, CT, MRI, ultrasound, or DEXA review.",
    imageClass: "labs",
    intakeHref: "/goals/wellness-labs",
    intakeLabel: "Start review",
    secondaryHref: "/catalog",
    secondaryLabel: "View catalog",
    highlights: ["Lab panels", "CT, MRI, ultrasound", "Result review"],
    sections: [
      {
        title: "Choose the question first",
        detail:
          "Diagnostics are most useful when tied to a care question, symptom pattern, risk factor, or monitoring need."
      },
      {
        title: "Imaging needs context",
        detail:
          "CT, MRI, ultrasound, mammography, and DEXA paths should include eligibility, safety, and follow-up review before scheduling."
      },
      {
        title: "Next step",
        detail:
          "The current review path can route users toward available lab panels, imaging requests, or clinician input."
      }
    ]
  },
  "skin-care": {
    slug: "skin-care",
    label: "Skin Care",
    eyebrow: "Skin support",
    title: "Skin care paths for acne, texture, redness, and routine goals.",
    summary:
      "A full page for skin concerns before starting a focused intake or browsing care options.",
    imageClass: "skin",
    intakeHref: "/goals/skin-care",
    intakeLabel: "Start skin intake",
    secondaryHref: "/shop",
    secondaryLabel: "Browse products",
    highlights: ["Acne and texture", "Redness and sensitivity", "Routine planning"],
    sections: [
      {
        title: "What the page should clarify",
        detail:
          "Skin care should distinguish everyday routine goals from concerns that need provider review."
      },
      {
        title: "Intake context",
        detail:
          "Photos, medication history, sensitivity, pregnancy status, and prior treatments may change the recommendation."
      },
      {
        title: "Next step",
        detail:
          "The skin intake can collect the information needed to route users to the right care path."
      }
    ]
  },
  "hormones": {
    slug: "hormones",
    label: "Hormones",
    eyebrow: "Hormone health",
    title: "Hormone health pages for symptoms, labs, and follow-up.",
    summary:
      "A future overview for hormone-related questions, screening options, and provider-guided interpretation.",
    imageClass: "hormones",
    intakeHref: "/goals/hormone-health",
    intakeLabel: "Start hormone intake",
    secondaryHref: "/goals/wellness-labs",
    secondaryLabel: "Explore labs",
    highlights: ["Symptom context", "Hormone lab options", "Provider interpretation"],
    sections: [
      {
        title: "Start with symptoms",
        detail:
          "Hormone questions usually need symptom history, medication context, cycle or age context, and relevant risk factors."
      },
      {
        title: "Labs are not standalone",
        detail:
          "Hormone labs should be interpreted with timing, symptoms, and clinical history."
      },
      {
        title: "Next step",
        detail:
          "This page can later connect hormone education, labs, and follow-up care into one path."
      }
    ]
  },
  "library": {
    slug: "library",
    label: "Health Library",
    eyebrow: "Health library",
    title: "Plain-language health guides, coming soon.",
    summary:
      "A future home for explainers on labs, biomarkers, symptoms, genetics, products, and follow-up decisions.",
    imageClass: "labs",
    secondaryHref: "/",
    secondaryLabel: "Back home",
    highlights: ["Lab explainers", "Health area guides", "Result follow-up"],
    sections: [
      {
        title: "What will live here",
        detail:
          "Short, practical guides that help users understand common health questions before choosing a test, product, or review path."
      },
      {
        title: "How it connects",
        detail:
          "Library content can link into labs, genetics, products, My Health records, and clinician review options."
      },
      {
        title: "Next step",
        detail:
          "We can add articles and collections here as the content model takes shape."
      }
    ]
  },
  "health-areas": {
    slug: "health-areas",
    label: "Health Areas",
    eyebrow: "Health areas",
    title: "Browse common health starting points.",
    summary:
      "A grouped path for metabolic health, hormones, skin and hair, nutrients, baseline testing, and other common health questions.",
    imageClass: "weight",
    secondaryHref: "/shop",
    secondaryLabel: "View products",
    highlights: ["Metabolic health", "Hormones and energy", "Skin and hair"],
    sections: [
      {
        title: "Metabolic health",
        detail:
          "Weight, glucose, cholesterol, insulin, inflammation, and related lab or product paths."
      },
      {
        title: "Hormones and energy",
        detail:
          "Thyroid, testosterone, cortisol, reproductive hormones, fatigue, recovery, and follow-up questions."
      },
      {
        title: "Skin, hair, and nutrients",
        detail:
          "Everyday care, nutrient status, inflammation markers, and product-supported health goals."
      }
    ]
  }
} satisfies Record<string, TopicPage>;

export const topicNavLinks = [
  { href: "/labs", label: topicPages.labs.label },
  { href: "/genetic-testing", label: topicPages["genetic-testing"].label },
  { href: "/health-areas", label: topicPages["health-areas"].label },
  { href: "/shop", label: "Products" },
  { href: "/library", label: "Library" }
];
