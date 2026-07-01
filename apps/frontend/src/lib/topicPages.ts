export type TopicPage = {
  slug: string;
  label: string;
  eyebrow: string;
  title: string;
  summary: string;
  imageClass: string;
  visualLabel: string;
  visualTitle: string;
  visualItems: string[];
  highlights: string[];
  startingPointTitle: string;
  startingPointSummary: string;
  startingPoints: Array<{
    title: string;
    detail: string;
  }>;
  sections: Array<{
    title: string;
    detail: string;
    href: string;
    cta: string;
  }>;
  finalTitle: string;
  finalSummary: string;
};

export const topicPages = {
  "genetic-testing": {
    slug: "genetic-testing",
    label: "Genetics",
    eyebrow: "Genetic testing",
    title: "Thinking about genetic testing? Start with the question it needs to answer.",
    summary:
      "Carrier screening, inherited risk panels, pharmacogenomics, exome, and genome tests are built for different jobs. Compare the paths before buying the wrong kind of answer.",
    imageClass: "genetic",
    visualLabel: "Testing scope",
    visualTitle: "Different genetics tests answer different questions.",
    visualItems: ["Carrier and family planning", "Medication response", "Inherited risk", "Existing report review"],
    highlights: ["Carrier screening", "Medication response", "Result interpretation"],
    startingPointTitle: "Start with the reason you are considering genetics.",
    startingPointSummary:
      "A genetics test can be useful, but the best choice depends on whether you are screening, confirming, planning, or reviewing existing data.",
    startingPoints: [
      {
        title: "I want to know inherited risk",
        detail: "Compare focused panels, broader sequencing, and what may need clinician or genetic counselor follow-up."
      },
      {
        title: "I have genetic results",
        detail: "Understand what a report says, what it does not prove, and what questions to bring next."
      },
      {
        title: "I am planning for family or medication decisions",
        detail: "Look at carrier screening, pharmacogenomics, and limitations before choosing a path."
      }
    ],
    sections: [
      {
        title: "Testing options",
        detail: "Compare genetics tests by purpose, scope, and result type.",
        href: "/#services",
        cta: "View testing"
      },
      {
        title: "Records and results",
        detail: "Prepare existing genetics reports or lab files for review.",
        href: "/my-health",
        cta: "Open workspace"
      },
      {
        title: "Clinician follow-up",
        detail: "Identify when genetics results may need specialist discussion.",
        href: "/#clinicians",
        cta: "View clinicians"
      }
    ],
    finalTitle: "Use genetics as a targeted tool, not a guessing game.",
    finalSummary: "Start by comparing the testing path to the actual question you want answered."
  },
  "weight-loss": {
    slug: "weight-loss",
    label: "Weight Loss",
    eyebrow: "Weight loss",
    title: "Trying to lose weight? Compare the medical, lab, and follow-up paths first.",
    summary:
      "Medication, metabolic labs, nutrition support, and follow-up are not the same path. Start by sorting what information you need before choosing what to do next.",
    imageClass: "weight",
    visualLabel: "Metabolic context",
    visualTitle: "Weight questions often overlap with labs, medications, and follow-up.",
    visualItems: ["A1c and glucose", "Lipids and liver markers", "GLP-1 questions", "Lifestyle and monitoring"],
    highlights: ["Medication questions", "Metabolic labs", "Follow-up planning"],
    startingPointTitle: "Start with what you are trying to change.",
    startingPointSummary:
      "The right next step may be testing, medication discussion, nutrition support, or a review of prior results.",
    startingPoints: [
      {
        title: "I am considering medication",
        detail: "Compare GLP-1 and non-GLP-1 questions with safety, eligibility, and follow-up in mind."
      },
      {
        title: "I want labs before deciding",
        detail: "Look at metabolic markers that can shape a more informed discussion."
      },
      {
        title: "I have tried things already",
        detail: "Organize what changed, what did not, and what information is still missing."
      }
    ],
    sections: [
      {
        title: "Testing",
        detail: "Explore metabolic, thyroid, cholesterol, and general health lab paths.",
        href: "/#services",
        cta: "View tests"
      },
      {
        title: "Analysis",
        detail: "Review bloodwork patterns and markers related to metabolic health.",
        href: "/#services",
        cta: "View analysis"
      },
      {
        title: "Treatments",
        detail: "Compare care and treatment questions before choosing a next step.",
        href: "/#treatments",
        cta: "View treatments"
      }
    ],
    finalTitle: "Make the next weight-loss step more specific.",
    finalSummary: "Use testing, result review, and care navigation to narrow what is worth pursuing."
  },
  "hair-loss": {
    slug: "hair-loss",
    label: "Hair Loss",
    eyebrow: "Hair loss",
    title: "Losing hair? Start with the pattern, not another random product.",
    summary:
      "Sudden shedding, gradual thinning, scalp irritation, and nutrient or hormone questions can point to different next steps. Compare the likely paths before you spend more.",
    imageClass: "hair",
    visualLabel: "Hair health",
    visualTitle: "Timeline, pattern, scalp symptoms, and labs can point to different next steps.",
    visualItems: ["Sudden shedding", "Gradual thinning", "Scalp irritation", "Iron, thyroid, and hormone questions"],
    highlights: ["Pattern and timeline", "Lab questions", "Treatment fit"],
    startingPointTitle: "Start with what changed.",
    startingPointSummary:
      "Hair loss can come from different causes, so useful next steps depend on the timeline, pattern, symptoms, and prior treatments.",
    startingPoints: [
      {
        title: "Sudden shedding",
        detail: "Think through timing, illness, stress, medications, nutrition, and whether labs may help."
      },
      {
        title: "Gradual thinning",
        detail: "Compare treatment questions, family history, scalp findings, and follow-up options."
      },
      {
        title: "Scalp symptoms",
        detail: "Itching, scaling, redness, pain, or patches may need a different care path."
      }
    ],
    sections: [
      {
        title: "Testing",
        detail: "Look at lab paths that may be relevant to hair changes.",
        href: "/#services",
        cta: "View tests"
      },
      {
        title: "Clinicians",
        detail: "Find care support when symptoms or treatment questions need review.",
        href: "/#clinicians",
        cta: "View clinicians"
      },
      {
        title: "Treatments",
        detail: "Compare medication, supplement, and routine questions.",
        href: "/#treatments",
        cta: "View treatments"
      }
    ],
    finalTitle: "Match the hair-loss path to the pattern.",
    finalSummary: "Start by comparing testing, clinician review, and treatment options around what changed."
  },
  "skin-care": {
    slug: "skin-care",
    label: "Skin Care",
    eyebrow: "Skin care",
    title: "Skin acting up? Separate routine problems from care questions.",
    summary:
      "Acne, redness, sensitivity, texture, medication questions, and reactions do not all need the same next step. Start by sorting the concern.",
    imageClass: "skin",
    visualLabel: "Skin context",
    visualTitle: "Routine questions and medical questions should not be mixed together.",
    visualItems: ["Acne and texture", "Redness and sensitivity", "Medication history", "Clinician follow-up"],
    highlights: ["Acne and texture", "Routine questions", "Clinician follow-up"],
    startingPointTitle: "Start with the type of skin question.",
    startingPointSummary:
      "A routine question, a medication question, and a symptom flare can each point to a different path.",
    startingPoints: [
      {
        title: "I want a better routine",
        detail: "Organize current products, reactions, goals, and what has or has not helped."
      },
      {
        title: "I have acne, redness, or irritation",
        detail: "Separate everyday skin care from concerns that may need medical review."
      },
      {
        title: "I have results or triggers",
        detail: "Connect timing, medications, labs, or lifestyle changes to the next question."
      }
    ],
    sections: [
      {
        title: "Clinicians",
        detail: "Find care support when symptoms, prescriptions, or photos need review.",
        href: "/#clinicians",
        cta: "View clinicians"
      },
      {
        title: "Treatments",
        detail: "Compare medication, supplement, and routine-related questions.",
        href: "/#treatments",
        cta: "View treatments"
      },
      {
        title: "Records",
        detail: "Keep notes, photos, prior treatments, and follow-up steps organized.",
        href: "/my-health",
        cta: "Open workspace"
      }
    ],
    finalTitle: "Make the skin-care next step less random.",
    finalSummary: "Start by sorting the concern into routine, testing, clinician review, or treatment follow-up."
  },
  "hormones": {
    slug: "hormones",
    label: "Hormones",
    eyebrow: "Hormones",
    title: "Considering hormone testing? Timing and symptoms matter.",
    summary:
      "Hormone labs can be useful, but the wrong timing or missing context can create more confusion. Compare testing, results, and follow-up paths before ordering blindly.",
    imageClass: "hormones",
    visualLabel: "Hormone context",
    visualTitle: "The same lab can mean different things depending on timing and symptoms.",
    visualItems: ["Cycle timing", "Thyroid context", "Fertility questions", "Medication and life stage"],
    highlights: ["Symptoms and timing", "Hormone labs", "Result follow-up"],
    startingPointTitle: "Start with the hormone question you are trying to answer.",
    startingPointSummary:
      "Hormone testing is most useful when symptoms, timing, medications, and prior results are considered together.",
    startingPoints: [
      {
        title: "I want to choose labs",
        detail: "Compare hormone, thyroid, fertility, and related testing options with timing in mind."
      },
      {
        title: "I have abnormal results",
        detail: "Review what is out of range, what may need repeat testing, and what to ask next."
      },
      {
        title: "I have symptoms but no plan",
        detail: "Organize symptoms, cycle or age context, medications, and relevant prior testing."
      }
    ],
    sections: [
      {
        title: "Testing",
        detail: "Explore hormone, thyroid, fertility, and general lab paths.",
        href: "/#services",
        cta: "View tests"
      },
      {
        title: "Analysis",
        detail: "Review hormone and bloodwork patterns with timing and symptoms in mind.",
        href: "/#services",
        cta: "View analysis"
      },
      {
        title: "Follow-up",
        detail: "Plan what to do after testing, a result, or a care recommendation.",
        href: "/my-health",
        cta: "Open workspace"
      }
    ],
    finalTitle: "Choose hormone testing with more context.",
    finalSummary: "Start by comparing the test, result, and follow-up paths connected to your question."
  }
} satisfies Record<string, TopicPage>;

export const topicNavLinks = [
  { href: "/#services", label: "Services" },
  { href: "/library", label: "Health library" }
];
