#!/usr/bin/env node
import fs from "node:fs";

import { createPrismaClient } from "./database-url.mjs";

const prisma = await createPrismaClient();

const categories = [
  { slug: "daily-care", name: "Daily Care" },
  { slug: "hair", name: "Hair" },
  { slug: "skin", name: "Skin" },
  { slug: "sexual-wellness", name: "Sexual Wellness" },
  { slug: "weight-management", name: "Weight Management" },
  { slug: "glp1", name: "GLP-1" },
  { slug: "hormone-health", name: "Hormone Health" },
  { slug: "testosterone", name: "Testosterone" },
  { slug: "womens-health", name: "Women's Health" },
  { slug: "mens-health", name: "Men's Health" },
  { slug: "heart-health", name: "Heart Health" },
  { slug: "digestive-health", name: "Digestive Health" },
  { slug: "allergy", name: "Allergy" },
  { slug: "smoking-cessation", name: "Smoking Cessation" },
  { slug: "mental-wellness", name: "Mental Wellness" },
  { slug: "labs", name: "Labs" },
  { slug: "imaging", name: "Imaging" },
  { slug: "genetics", name: "Genetics" },
  { slug: "health-checks", name: "Health Checks" },
  { slug: "lab-core-health", name: "Core Health Labs" },
  { slug: "lab-metabolic-heart", name: "Metabolic & Heart Labs" },
  { slug: "lab-hormones-thyroid", name: "Hormone & Thyroid Labs" },
  { slug: "lab-sexual-infectious", name: "Sexual Health & Infectious Disease Labs" },
  { slug: "lab-allergy-immune", name: "Allergy & Immune Labs" },
  { slug: "lab-nutrition-deficiency", name: "Nutrition & Deficiency Labs" },
  { slug: "lab-digestive-urinary", name: "Digestive, Kidney & Urinary Labs" },
  { slug: "lab-toxicology-environmental", name: "Toxicology & Environmental Labs" },
  { slug: "lab-cancer-screening", name: "Cancer Screening Labs" },
  { slug: "lab-fitness-services", name: "Fitness & Body Composition Services" },
  { slug: "imaging-ct", name: "CT Imaging" },
  { slug: "imaging-mri", name: "MRI" },
  { slug: "imaging-ultrasound", name: "Ultrasound" },
  { slug: "imaging-dexa", name: "DEXA" },
  { slug: "imaging-xray", name: "X-ray" },
  { slug: "imaging-breast", name: "Breast Imaging" },
  { slug: "genetic-wgs", name: "Whole Genome Sequencing" },
  { slug: "genetic-wes", name: "Whole Exome Sequencing" },
  { slug: "genetic-panels", name: "Genetic Panels" },
  { slug: "genetic-carrier", name: "Carrier Screening" },
  { slug: "genetic-pharmacogenomics", name: "Pharmacogenomics" },
  { slug: "genetic-cancer-risk", name: "Hereditary Cancer Genetics" },
  { slug: "genetic-cardiovascular", name: "Cardiovascular Genetics" },
  { slug: "genetic-chromosomal", name: "Chromosomal Testing" },
  { slug: "genetic-familial-variant", name: "Familial Variant Testing" },
  { slug: "genetic-mitochondrial", name: "Mitochondrial Genetics" },
  { slug: "genetic-traits", name: "Traits & Wellness Genetics" },
  { slug: "supplements", name: "Supplements" },
  { slug: "drinkware", name: "Drinkware" }
];

const questCatalogPath = new URL("../../../docs/research/questhealth-catalog.md", import.meta.url);

const questLabGroupCategoryByHeading = new Map([
  ["Core health, blood & wellness panels", "lab-core-health"],
  ["Metabolic, weight & heart health", "lab-metabolic-heart"],
  ["Hormones, fertility & thyroid", "lab-hormones-thyroid"],
  ["Sexual & reproductive health / infectious disease", "lab-sexual-infectious"],
  ["Allergy, food & immune response", "lab-allergy-immune"],
  ["Nutrition & deficiencies", "lab-nutrition-deficiency"],
  ["Digestive, kidney, liver & urinary", "lab-digestive-urinary"],
  ["Drug, toxicology & environmental exposure", "lab-toxicology-environmental"],
  ["Cancer screening & inherited risk", "lab-cancer-screening"],
  ["Fitness, body composition & services", "lab-fitness-services"]
]);

const questLabImage = {
  url: "https://images.unsplash.com/photo-1581093458791-9f3c3900df7b?auto=format&fit=crop&w=1200&q=80",
  altText: "Laboratory sample tubes and testing equipment"
};

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 84);
}

function questSku(questId) {
  return `QH-${questId.replace(/[^a-z0-9]+/gi, "-").toUpperCase()}`;
}

function parseQuestHealthCatalog() {
  const markdown = fs.readFileSync(questCatalogPath, "utf8");
  const products = [];
  let currentGroup = null;
  let inInventory = false;

  for (const line of markdown.split("\n")) {
    if (line === "## Inventory") {
      inInventory = true;
      continue;
    }

    if (!inInventory) {
      continue;
    }

    const headingMatch = line.match(/^### (.+)$/);

    if (headingMatch) {
      currentGroup = headingMatch[1];
      continue;
    }

    const productMatch = line.match(/^\| \[([^\]]+)\]\((https:\/\/www\.questhealth\.com\/product\/[^)]+)\) \| \$?([0-9.]+) \| ([^ |]+) \|$/);

    if (!productMatch || !currentGroup) {
      continue;
    }

    const [, name, sourceUrl, price, questId] = productMatch;
    const groupCategorySlug = questLabGroupCategoryByHeading.get(currentGroup);

    if (!groupCategorySlug) {
      throw new Error(`Missing Quest lab category mapping for group: ${currentGroup}`);
    }

    products.push({
      slug: `quest-${slugify(name)}-${slugify(questId)}`,
      name,
      description: `Quest Health listing. Quest ID: ${questId}. Source: ${sourceUrl}`,
      purchaseMode: "DIRECT",
      categorySlugs: ["labs", groupCategorySlug],
      image: questLabImage,
      variants: [
        {
          sku: questSku(questId),
          title: "Quest Health listing",
          price,
          inventoryQuantity: 1000
        }
      ]
    });
  }

  return products;
}

const questHealthLabProducts = parseQuestHealthCatalog();

const imagingImage = {
  url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80",
  altText: "Clinical imaging room"
};

const imagingDiagnosticProducts = [
  {
    slug: "heart-ct-calcium-score-review",
    name: "Heart CT Calcium Score Review",
    description:
      "Imaging request path for coronary artery calcium scoring. Use review to confirm fit, risk context, and follow-up needs before scheduling.",
    categorySlugs: ["imaging", "imaging-ct", "heart-health", "lab-metabolic-heart"]
  },
  {
    slug: "low-dose-lung-ct-screening-review",
    name: "Low-Dose Lung CT Screening Review",
    description:
      "Imaging request path for low-dose lung CT screening. Intended for eligibility review around smoking history, age, symptoms, and follow-up planning.",
    categorySlugs: ["imaging", "imaging-ct"]
  },
  {
    slug: "brain-mri-review",
    name: "Brain MRI Review",
    description:
      "Imaging request path for brain MRI questions. Review should cover symptoms, urgency, prior imaging, implants, contrast considerations, and follow-up.",
    categorySlugs: ["imaging", "imaging-mri"]
  },
  {
    slug: "spine-mri-review",
    name: "Spine MRI Review",
    description:
      "Imaging request path for cervical, thoracic, or lumbar spine MRI questions with clinical review before scheduling.",
    categorySlugs: ["imaging", "imaging-mri"]
  },
  {
    slug: "joint-mri-review",
    name: "Joint MRI Review",
    description:
      "Imaging request path for knee, shoulder, hip, ankle, elbow, or wrist MRI questions with review of injury history and prior care.",
    categorySlugs: ["imaging", "imaging-mri"]
  },
  {
    slug: "abdomen-pelvis-mri-review",
    name: "Abdomen & Pelvis MRI Review",
    description:
      "Imaging request path for abdomen or pelvis MRI questions with review of indication, contrast needs, and appropriate modality.",
    categorySlugs: ["imaging", "imaging-mri", "digestive-health"]
  },
  {
    slug: "thyroid-ultrasound-review",
    name: "Thyroid Ultrasound Review",
    description:
      "Imaging request path for thyroid ultrasound questions, commonly tied to nodules, enlargement, abnormal exam, or follow-up imaging.",
    categorySlugs: ["imaging", "imaging-ultrasound", "hormone-health"]
  },
  {
    slug: "abdominal-ultrasound-review",
    name: "Abdominal Ultrasound Review",
    description:
      "Imaging request path for liver, gallbladder, kidney, spleen, or abdominal symptom questions with review before scheduling.",
    categorySlugs: ["imaging", "imaging-ultrasound", "digestive-health"]
  },
  {
    slug: "pelvic-ultrasound-review",
    name: "Pelvic Ultrasound Review",
    description:
      "Imaging request path for pelvic ultrasound questions with review of symptoms, pregnancy status, cycle context, and urgency.",
    categorySlugs: ["imaging", "imaging-ultrasound", "womens-health"]
  },
  {
    slug: "vascular-ultrasound-review",
    name: "Vascular Ultrasound Review",
    description:
      "Imaging request path for carotid, venous, or arterial ultrasound questions with review of symptoms and clinical indication.",
    categorySlugs: ["imaging", "imaging-ultrasound", "heart-health"]
  },
  {
    slug: "dexa-bone-density-review",
    name: "DEXA Bone Density Review",
    description:
      "Imaging request path for bone density screening or monitoring, often relevant to menopause, fracture risk, and long-term bone health.",
    categorySlugs: ["imaging", "imaging-dexa", "hormone-health", "womens-health"]
  },
  {
    slug: "dexa-body-composition-review",
    name: "DEXA Body Composition Review",
    description:
      "Imaging request path for body composition measurement with review of goals, limitations, and follow-up context.",
    categorySlugs: ["imaging", "imaging-dexa", "weight-management"]
  },
  {
    slug: "screening-mammogram-review",
    name: "Screening Mammogram Review",
    description:
      "Imaging request path for breast screening questions with review of age, symptoms, history, prior imaging, and appropriate next step.",
    categorySlugs: ["imaging", "imaging-breast", "womens-health"]
  },
  {
    slug: "xray-imaging-review",
    name: "X-ray Imaging Review",
    description:
      "Imaging request path for simple X-ray questions, generally for focused concerns where an imaging order is clinically appropriate.",
    categorySlugs: ["imaging", "imaging-xray"]
  }
].map((product, index) => ({
  ...product,
  purchaseMode: "ASSESSMENT_REQUIRED",
  image: imagingImage,
  variants: [
    {
      sku: `IMG-${String(index + 1).padStart(3, "0")}`,
      title: "Review request",
      price: "0.00",
      inventoryQuantity: 1000
    }
  ]
}));

const geneticTestingImage = {
  url: "https://images.unsplash.com/photo-1530026186672-2cd00ffc50fe?auto=format&fit=crop&w=1200&q=80",
  altText: "DNA sequencing and lab analysis"
};

const geneticTestingProducts = [
  {
    slug: "whole-genome-sequencing-30x-review",
    name: "30x Whole Genome Sequencing Review",
    description:
      "Review path for clinical-grade whole genome sequencing discussion, including scope, secondary findings, privacy, and confirmatory follow-up.",
    categorySlugs: ["genetics", "genetic-wgs"]
  },
  {
    slug: "whole-genome-sequencing-15x-review",
    name: "15x Whole Genome Sequencing Review",
    description:
      "Review path for lower-coverage whole genome sequencing options, limitations, and whether genome-wide testing is appropriate.",
    categorySlugs: ["genetics", "genetic-wgs"]
  },
  {
    slug: "whole-exome-sequencing-review",
    name: "Whole Exome Sequencing Review",
    description:
      "Review path for exome sequencing, which focuses on protein-coding regions and is often considered when a specific cause is unclear.",
    categorySlugs: ["genetics", "genetic-wes"]
  },
  {
    slug: "rare-disease-genetics-review",
    name: "Rare Disease Genetics Review",
    description:
      "Review path for selecting an appropriate rare-disease genetics approach, such as a targeted panel, exome, or genome sequencing.",
    categorySlugs: ["genetics", "genetic-panels", "genetic-wes", "genetic-wgs"]
  },
  {
    slug: "targeted-gene-panel-review",
    name: "Targeted Gene Panel Review",
    description:
      "Review path for focused gene panels where the health question points to a specific condition area or gene set.",
    categorySlugs: ["genetics", "genetic-panels"]
  },
  {
    slug: "hereditary-cancer-risk-panel-review",
    name: "Hereditary Cancer Risk Panel Review",
    description:
      "Review path for inherited cancer risk testing, including family history, prior testing, counseling, and confirmatory clinical follow-up.",
    categorySlugs: ["genetics", "genetic-cancer-risk", "genetic-panels"]
  },
  {
    slug: "cardiovascular-genetics-panel-review",
    name: "Cardiovascular Genetics Panel Review",
    description:
      "Review path for inherited cardiovascular risk questions such as cardiomyopathy, arrhythmia, familial hypercholesterolemia, or a strong family history.",
    categorySlugs: ["genetics", "genetic-cardiovascular", "heart-health", "genetic-panels"]
  },
  {
    slug: "expanded-carrier-screening-review",
    name: "Expanded Carrier Screening Review",
    description:
      "Review path for carrier screening before or during family planning, including partner testing and result interpretation.",
    categorySlugs: ["genetics", "genetic-carrier", "womens-health"]
  },
  {
    slug: "pharmacogenomics-review",
    name: "Pharmacogenomics Review",
    description:
      "Review path for medication-response genetics, focused on whether results may support a clinician discussion about drug metabolism or dosing.",
    categorySlugs: ["genetics", "genetic-pharmacogenomics"]
  },
  {
    slug: "familial-variant-testing-review",
    name: "Known Familial Variant Testing Review",
    description:
      "Review path for testing a specific variant already identified in a family member, with attention to documentation and clinical confirmation.",
    categorySlugs: ["genetics", "genetic-familial-variant"]
  },
  {
    slug: "chromosomal-microarray-review",
    name: "Chromosomal Microarray Review",
    description:
      "Review path for copy-number and chromosomal imbalance questions where microarray may be more appropriate than sequencing alone.",
    categorySlugs: ["genetics", "genetic-chromosomal"]
  },
  {
    slug: "karyotype-testing-review",
    name: "Karyotype Testing Review",
    description:
      "Review path for chromosome-level questions such as aneuploidy, large rearrangements, infertility workups, or recurrent pregnancy loss context.",
    categorySlugs: ["genetics", "genetic-chromosomal"]
  },
  {
    slug: "mitochondrial-dna-testing-review",
    name: "Mitochondrial DNA Testing Review",
    description:
      "Review path for mitochondrial genetics questions, including whether targeted mitochondrial testing, panel testing, exome, or genome sequencing is a better fit.",
    categorySlugs: ["genetics", "genetic-mitochondrial", "genetic-panels"]
  },
  {
    slug: "nutrigenomics-wellness-genetics-review",
    name: "Nutrigenomics & Wellness Genetics Review",
    description:
      "Review path for lower-acuity wellness genetics questions, with clear limits around clinical actionability and need for confirmatory testing.",
    categorySlugs: ["genetics", "genetic-traits"]
  },
  {
    slug: "ancestry-traits-genetics-review",
    name: "Ancestry & Traits Genetics Review",
    description:
      "Review path for non-diagnostic genetics interests such as ancestry and traits, separated from clinical risk or diagnostic testing.",
    categorySlugs: ["genetics", "genetic-traits"]
  }
].map((product, index) => ({
  ...product,
  purchaseMode: "ASSESSMENT_REQUIRED",
  image: geneticTestingImage,
  variants: [
    {
      sku: `GEN-${String(index + 1).padStart(3, "0")}`,
      title: "Review request",
      price: "0.00",
      inventoryQuantity: 1000
    }
  ]
}));

const products = [
  {
    slug: "hair-density-support-kit",
    name: "Hair Density Support Kit",
    description: "A demo hair routine with simple daily-use essentials for catalog testing.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["hair", "daily-care"],
    image: {
      url: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
      altText: "Hair care bottles on a counter"
    },
    variants: [
      {
        sku: "HAIR-DENSITY-30",
        title: "30 Day Kit",
        price: "29.00",
        inventoryQuantity: 32
      },
      {
        sku: "HAIR-DENSITY-90",
        title: "90 Day Kit",
        price: "75.00",
        inventoryQuantity: 18
      }
    ]
  },
  {
    slug: "scalp-care-shampoo",
    name: "Scalp Care Shampoo",
    description: "A lightweight shampoo placeholder for hair and scalp care merchandising.",
    purchaseMode: "DIRECT",
    categorySlugs: ["hair"],
    image: {
      url: "https://images.unsplash.com/photo-1626784215021-2e39ccf971cd?auto=format&fit=crop&w=1200&q=80",
      altText: "Neutral shampoo bottles"
    },
    variants: [
      {
        sku: "SCALP-SHAMPOO-8OZ",
        title: "8 oz Bottle",
        price: "18.00",
        inventoryQuantity: 45
      }
    ]
  },
  {
    slug: "hair-thinning-consult",
    name: "Hair Thinning Consult",
    description: "A guided hair-support consult placeholder for assessment-first flows.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["hair", "mens-health"],
    image: {
      url: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=1200&q=80",
      altText: "Hair styling tools on a counter"
    },
    variants: [
      {
        sku: "HAIR-CONSULT-BASE",
        title: "Consult",
        price: "20.00",
        inventoryQuantity: 30
      }
    ]
  },
  {
    slug: "skin-clarity-routine",
    name: "Skin Clarity Routine",
    description: "A sample cleanser and moisturizer routine for skin care storefront flows.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["skin", "daily-care"],
    image: {
      url: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=1200&q=80",
      altText: "Skin care containers on a light background"
    },
    variants: [
      {
        sku: "SKIN-CLARITY-BASE",
        title: "Base Routine",
        price: "34.00",
        inventoryQuantity: 28
      },
      {
        sku: "SKIN-CLARITY-PLUS",
        title: "Routine Plus Refill",
        price: "52.00",
        inventoryQuantity: 20
      }
    ]
  },
  {
    slug: "acne-care-consult",
    name: "Acne Care Consult",
    description: "An assessment-first skin consult placeholder for acne-prone routine planning.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["skin"],
    image: {
      url: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1200&q=80",
      altText: "Skin care serum and dropper"
    },
    variants: [
      {
        sku: "ACNE-CONSULT-BASE",
        title: "Consult",
        price: "25.00",
        inventoryQuantity: 34
      }
    ]
  },
  {
    slug: "age-support-skin-consult",
    name: "Age Support Skin Consult",
    description: "A guided skin-routine consult placeholder for texture and aging concerns.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["skin", "daily-care"],
    image: {
      url: "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=1200&q=80",
      altText: "Serum bottles on a bathroom shelf"
    },
    variants: [
      {
        sku: "AGE-SKIN-CONSULT",
        title: "Consult",
        price: "25.00",
        inventoryQuantity: 30
      }
    ]
  },
  {
    slug: "redness-support-consult",
    name: "Redness Support Consult",
    description: "An assessment-first skin support placeholder for redness and sensitivity goals.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["skin"],
    image: {
      url: "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?auto=format&fit=crop&w=1200&q=80",
      altText: "Minimal skin care bottles"
    },
    variants: [
      {
        sku: "REDNESS-CONSULT",
        title: "Consult",
        price: "25.00",
        inventoryQuantity: 24
      }
    ]
  },
  {
    slug: "daily-face-moisturizer",
    name: "Daily Face Moisturizer",
    description: "A simple daily moisturizer demo product for customer catalog testing.",
    purchaseMode: "DIRECT",
    categorySlugs: ["skin", "daily-care"],
    image: {
      url: "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?auto=format&fit=crop&w=1200&q=80",
      altText: "Face moisturizer jar"
    },
    variants: [
      {
        sku: "FACE-MOISTURIZER-2OZ",
        title: "2 oz Jar",
        price: "22.00",
        inventoryQuantity: 36
      }
    ]
  },
  {
    slug: "mineral-sunscreen",
    name: "Mineral Sunscreen",
    description: "A direct-purchase SPF placeholder for daily-care catalog browsing.",
    purchaseMode: "DIRECT",
    categorySlugs: ["skin", "daily-care"],
    image: {
      url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1200&q=80",
      altText: "Sunscreen and skin care tube"
    },
    variants: [
      {
        sku: "MINERAL-SPF-50",
        title: "SPF 50",
        price: "24.00",
        inventoryQuantity: 48
      }
    ]
  },
  {
    slug: "gentle-cleanser",
    name: "Gentle Cleanser",
    description: "A direct-purchase cleanser placeholder for routine-building and checkout testing.",
    purchaseMode: "DIRECT",
    categorySlugs: ["skin", "daily-care"],
    image: {
      url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80",
      altText: "Cleanser bottle on a bathroom counter"
    },
    variants: [
      {
        sku: "GENTLE-CLEANSER-6OZ",
        title: "6 oz Bottle",
        price: "16.00",
        inventoryQuantity: 42
      }
    ]
  },
  {
    slug: "bedroom-basics-kit",
    name: "Bedroom Basics Kit",
    description: "A non-prescription sexual wellness kit for testing product browsing and checkout.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["sexual-wellness"],
    image: {
      url: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=1200&q=80",
      altText: "Minimal personal care kit"
    },
    variants: [
      {
        sku: "BEDROOM-BASICS-STANDARD",
        title: "Standard Kit",
        price: "35.00",
        inventoryQuantity: 24
      }
    ]
  },
  {
    slug: "ed-wellness-consult",
    name: "ED Wellness Consult",
    description: "An assessment-first sexual wellness consult placeholder for customer intake flows.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["sexual-wellness", "mens-health"],
    image: {
      url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80",
      altText: "Private wellness consult desk"
    },
    variants: [
      {
        sku: "ED-WELLNESS-CONSULT",
        title: "Consult",
        price: "25.00",
        inventoryQuantity: 25
      }
    ]
  },
  {
    slug: "early-finish-support-consult",
    name: "Early Finish Support Consult",
    description: "A guided sexual wellness consult placeholder for assessment-first browsing.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["sexual-wellness", "mens-health"],
    image: {
      url: "https://images.unsplash.com/photo-1511174511562-5f7f18b874f8?auto=format&fit=crop&w=1200&q=80",
      altText: "Wellness notes and phone on a desk"
    },
    variants: [
      {
        sku: "EARLY-FINISH-CONSULT",
        title: "Consult",
        price: "25.00",
        inventoryQuantity: 22
      }
    ]
  },
  {
    slug: "weight-management-starter-kit",
    name: "Weight Management Starter Kit",
    description: "A demo lifestyle kit with tracking tools and routine basics, no medication included.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["weight-management", "daily-care"],
    image: {
      url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
      altText: "Fitness and nutrition items"
    },
    variants: [
      {
        sku: "WEIGHT-STARTER-KIT",
        title: "Starter Kit",
        price: "39.00",
        inventoryQuantity: 22
      }
    ]
  },
  {
    slug: "metabolic-health-consult",
    name: "Metabolic Health Consult",
    description: "An assessment-first program placeholder for weight and metabolic health goals.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["weight-management", "heart-health"],
    image: {
      url: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=1200&q=80",
      altText: "Healthy meal ingredients on a table"
    },
    variants: [
      {
        sku: "METABOLIC-CONSULT",
        title: "Consult",
        price: "30.00",
        inventoryQuantity: 28
      }
    ]
  },
  {
    slug: "weight-care-program",
    name: "Weight Care Program",
    description: "A care-program placeholder for assessment, planning, and follow-up workflows.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["weight-management"],
    image: {
      url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80",
      altText: "Balanced meal and tracking notebook"
    },
    variants: [
      {
        sku: "WEIGHT-CARE-PROGRAM",
        title: "Program Intake",
        price: "39.00",
        inventoryQuantity: 20
      }
    ]
  },
  {
    slug: "glp1-weight-care-consult",
    name: "GLP-1 Weight Care Consult",
    description: "An assessment-first weight-care placeholder for GLP-1 access and follow-up workflows.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["weight-management", "glp1"],
    image: {
      url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80",
      altText: "Wellness path and planning"
    },
    variants: [
      {
        sku: "GLP1-WEIGHT-CONSULT",
        title: "Consult",
        price: "49.00",
        inventoryQuantity: 18
      }
    ]
  },
  {
    slug: "glp1-injection-support-program",
    name: "GLP-1 Injection Support Program",
    description: "A gated program placeholder for injection training, check-ins, and weight-care support.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["weight-management", "glp1"],
    image: {
      url: "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80",
      altText: "Clinical support supplies on a desk"
    },
    variants: [
      {
        sku: "GLP1-INJECTION-SUPPORT",
        title: "Program Intake",
        price: "59.00",
        inventoryQuantity: 16
      }
    ]
  },
  {
    slug: "oral-weight-loss-consult",
    name: "Oral Weight Loss Consult",
    description: "An assessment-first consult placeholder for non-injectable weight-care options.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["weight-management"],
    image: {
      url: "https://images.unsplash.com/photo-1494390248081-4e521a5940db?auto=format&fit=crop&w=1200&q=80",
      altText: "Nutrition planning table"
    },
    variants: [
      {
        sku: "ORAL-WEIGHT-LOSS-CONSULT",
        title: "Consult",
        price: "35.00",
        inventoryQuantity: 24
      }
    ]
  },
  {
    slug: "weight-loss-labs-panel",
    name: "Weight Loss Labs Panel",
    description: "A gated lab-panel placeholder for weight-care baseline and follow-up workflows.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["weight-management", "glp1", "labs"],
    image: {
      url: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80",
      altText: "Lab sample tubes on a tray"
    },
    variants: [
      {
        sku: "WEIGHT-LOSS-LABS-PANEL",
        title: "Baseline Panel",
        price: "89.00",
        inventoryQuantity: 14
      }
    ]
  },
  {
    slug: "sleep-stress-support-kit",
    name: "Sleep & Stress Support Kit",
    description: "A gentle evening routine placeholder for mental wellness merchandising.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["mental-wellness", "supplements"],
    image: {
      url: "https://images.unsplash.com/photo-1511295742362-92c96b1cf484?auto=format&fit=crop&w=1200&q=80",
      altText: "Bedside evening routine"
    },
    variants: [
      {
        sku: "SLEEP-STRESS-30",
        title: "30 Day Kit",
        price: "27.00",
        inventoryQuantity: 40
      }
    ]
  },
  {
    slug: "anxiety-support-consult",
    name: "Anxiety Support Consult",
    description: "A guided mental wellness consult placeholder for support preferences and next steps.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["mental-wellness"],
    image: {
      url: "https://images.unsplash.com/photo-1493836512294-502baa1986e2?auto=format&fit=crop&w=1200&q=80",
      altText: "Journal and tea for a calm routine"
    },
    variants: [
      {
        sku: "ANXIETY-SUPPORT-CONSULT",
        title: "Consult",
        price: "25.00",
        inventoryQuantity: 26
      }
    ]
  },
  {
    slug: "focus-energy-consult",
    name: "Focus & Energy Consult",
    description: "An assessment-first wellness consult placeholder for routine and energy goals.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["mental-wellness", "daily-care"],
    image: {
      url: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
      altText: "Notebook and coffee on a work desk"
    },
    variants: [
      {
        sku: "FOCUS-ENERGY-CONSULT",
        title: "Consult",
        price: "25.00",
        inventoryQuantity: 24
      }
    ]
  },
  {
    slug: "daily-multivitamin-pack",
    name: "Daily Multivitamin Pack",
    description: "A daily supplement placeholder with simple monthly pack variants.",
    purchaseMode: "DIRECT",
    categorySlugs: ["supplements", "daily-care"],
    image: {
      url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80",
      altText: "Supplement capsules"
    },
    variants: [
      {
        sku: "MULTI-PACK-30",
        title: "30 Day Pack",
        price: "24.00",
        inventoryQuantity: 55
      },
      {
        sku: "MULTI-PACK-90",
        title: "90 Day Pack",
        price: "60.00",
        inventoryQuantity: 25
      }
    ]
  },
  {
    slug: "electrolyte-hydration-pack",
    name: "Electrolyte Hydration Pack",
    description: "A direct-purchase hydration placeholder for everyday wellness merchandising.",
    purchaseMode: "DIRECT",
    categorySlugs: ["supplements", "daily-care"],
    image: {
      url: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1200&q=80",
      altText: "Hydration drink with citrus"
    },
    variants: [
      {
        sku: "ELECTROLYTE-30",
        title: "30 Stick Pack",
        price: "28.00",
        inventoryQuantity: 50
      }
    ]
  },
  {
    slug: "fiber-daily-pack",
    name: "Fiber Daily Pack",
    description: "A direct-purchase fiber supplement placeholder for digestive-health browsing.",
    purchaseMode: "DIRECT",
    categorySlugs: ["supplements", "digestive-health"],
    image: {
      url: "https://images.unsplash.com/photo-1505577058444-a3dab90d4253?auto=format&fit=crop&w=1200&q=80",
      altText: "Breakfast bowl with fruit and grains"
    },
    variants: [
      {
        sku: "FIBER-DAILY-30",
        title: "30 Day Pack",
        price: "26.00",
        inventoryQuantity: 44
      }
    ]
  },
  {
    slug: "at-home-wellness-labs-kit",
    name: "At-Home Wellness Labs Kit",
    description: "A sample lab-kit product for testing nonstandard catalog items and fulfillment.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["labs"],
    image: {
      url: "https://images.unsplash.com/photo-1581093458791-9d15482442f6?auto=format&fit=crop&w=1200&q=80",
      altText: "Lab testing supplies"
    },
    variants: [
      {
        sku: "WELLNESS-LABS-BASE",
        title: "Core Panel Kit",
        price: "79.00",
        inventoryQuantity: 16
      },
      {
        sku: "WELLNESS-LABS-PLUS",
        title: "Expanded Panel Kit",
        price: "129.00",
        inventoryQuantity: 10
      }
    ]
  },
  {
    slug: "hormone-health-check-in",
    name: "Hormone Health Check-In",
    description: "A guided lab-and-symptom intake placeholder for hormone health workflows.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["hormone-health", "labs"],
    image: {
      url: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80",
      altText: "Lab sample tubes on a tray"
    },
    variants: [
      {
        sku: "HORMONE-CHECK-IN",
        title: "Check-In",
        price: "49.00",
        inventoryQuantity: 18
      }
    ]
  },
  {
    slug: "testosterone-health-check-in",
    name: "Testosterone Health Check-In",
    description: "A guided men's hormone health check-in placeholder for symptom and lab workflows.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["testosterone", "mens-health", "hormone-health"],
    image: {
      url: "https://images.unsplash.com/photo-1581093458791-9d15482442f6?auto=format&fit=crop&w=1200&q=80",
      altText: "Lab testing supplies"
    },
    variants: [
      {
        sku: "TESTOSTERONE-CHECK-IN",
        title: "Check-In",
        price: "49.00",
        inventoryQuantity: 18
      }
    ]
  },
  {
    slug: "testosterone-labs-panel",
    name: "Testosterone Labs Panel",
    description: "A gated lab-panel placeholder for testosterone and hormone health follow-up.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["testosterone", "hormone-health", "labs"],
    image: {
      url: "https://images.unsplash.com/photo-1614935151651-0bea6508db6b?auto=format&fit=crop&w=1200&q=80",
      altText: "Clinical lab testing vials"
    },
    variants: [
      {
        sku: "TESTOSTERONE-LABS-PANEL",
        title: "Lab Panel",
        price: "99.00",
        inventoryQuantity: 14
      }
    ]
  },
  {
    slug: "menopause-support-consult",
    name: "Menopause Support Consult",
    description: "An assessment-first consult placeholder for symptom tracking and care preferences.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["womens-health", "hormone-health"],
    image: {
      url: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80",
      altText: "Wellness journal and flowers"
    },
    variants: [
      {
        sku: "MENOPAUSE-SUPPORT-CONSULT",
        title: "Consult",
        price: "30.00",
        inventoryQuantity: 24
      }
    ]
  },
  {
    slug: "cycle-support-consult",
    name: "Cycle Support Consult",
    description: "A guided women's health consult placeholder for cycle-related support goals.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["womens-health"],
    image: {
      url: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80",
      altText: "Personal care items and journal"
    },
    variants: [
      {
        sku: "CYCLE-SUPPORT-CONSULT",
        title: "Consult",
        price: "25.00",
        inventoryQuantity: 22
      }
    ]
  },
  {
    slug: "fertility-planning-consult",
    name: "Fertility Planning Consult",
    description: "An assessment-first planning placeholder for fertility goals and lab follow-up.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["womens-health", "labs"],
    image: {
      url: "https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&w=1200&q=80",
      altText: "Calendar and health planning notebook"
    },
    variants: [
      {
        sku: "FERTILITY-PLANNING-CONSULT",
        title: "Consult",
        price: "35.00",
        inventoryQuantity: 18
      }
    ]
  },
  {
    slug: "heart-health-check-in",
    name: "Heart Health Check-In",
    description: "A guided check-in placeholder for heart-health goals and monitoring preferences.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["heart-health", "labs"],
    image: {
      url: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80",
      altText: "Stethoscope on a desk"
    },
    variants: [
      {
        sku: "HEART-HEALTH-CHECK-IN",
        title: "Check-In",
        price: "35.00",
        inventoryQuantity: 20
      }
    ]
  },
  {
    slug: "metabolic-labs-panel",
    name: "Metabolic Labs Panel",
    description: "A gated lab-panel placeholder for metabolic markers and care-plan follow-up.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["labs", "health-checks", "heart-health", "weight-management"],
    image: {
      url: "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1200&q=80",
      altText: "Laboratory testing equipment"
    },
    variants: [
      {
        sku: "METABOLIC-LABS-PANEL",
        title: "Metabolic Panel",
        price: "89.00",
        inventoryQuantity: 15
      }
    ]
  },
  {
    slug: "thyroid-labs-panel",
    name: "Thyroid Labs Panel",
    description: "A gated lab-panel placeholder for thyroid health screening and support workflows.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["labs", "health-checks", "hormone-health"],
    image: {
      url: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=1200&q=80",
      altText: "Clinical lab sample analysis"
    },
    variants: [
      {
        sku: "THYROID-LABS-PANEL",
        title: "Thyroid Panel",
        price: "79.00",
        inventoryQuantity: 18
      }
    ]
  },
  {
    slug: "sexual-health-screening-kit",
    name: "Sexual Health Screening Kit",
    description: "A gated lab-kit placeholder for sexual health screening and follow-up flows.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["sexual-wellness", "labs", "health-checks"],
    image: {
      url: "https://images.unsplash.com/photo-1579154341098-e4e158cc7f55?auto=format&fit=crop&w=1200&q=80",
      altText: "At-home health testing package"
    },
    variants: [
      {
        sku: "SEXUAL-HEALTH-SCREENING",
        title: "Screening Kit",
        price: "99.00",
        inventoryQuantity: 16
      }
    ]
  },
  {
    slug: "general-health-check-labs",
    name: "General Health Check Labs",
    description: "A gated health-check lab placeholder for broad screening and result-review workflows.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["labs", "health-checks"],
    image: {
      url: "https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=1200&q=80",
      altText: "Health testing kit on a desk"
    },
    variants: [
      {
        sku: "GENERAL-HEALTH-CHECK-LABS",
        title: "Core Health Check",
        price: "119.00",
        inventoryQuantity: 14
      }
    ]
  },
  {
    slug: "gut-health-consult",
    name: "Gut Health Consult",
    description: "An assessment-first digestive health consult placeholder for routine goals.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["digestive-health", "supplements"],
    image: {
      url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
      altText: "Vegetable bowl and wellness ingredients"
    },
    variants: [
      {
        sku: "GUT-HEALTH-CONSULT",
        title: "Consult",
        price: "25.00",
        inventoryQuantity: 26
      }
    ]
  },
  {
    slug: "allergy-relief-consult",
    name: "Allergy Relief Consult",
    description: "A guided allergy-support consult placeholder for symptoms and care preferences.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["allergy"],
    image: {
      url: "https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=1200&q=80",
      altText: "Spring flowers and tissues"
    },
    variants: [
      {
        sku: "ALLERGY-RELIEF-CONSULT",
        title: "Consult",
        price: "20.00",
        inventoryQuantity: 32
      }
    ]
  },
  {
    slug: "smoking-cessation-consult",
    name: "Smoking Cessation Consult",
    description: "An assessment-first support consult placeholder for quit goals and follow-up.",
    purchaseMode: "ASSESSMENT_REQUIRED",
    categorySlugs: ["smoking-cessation", "mental-wellness"],
    image: {
      url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80",
      altText: "Calm outdoor path"
    },
    variants: [
      {
        sku: "SMOKING-CESSATION-CONSULT",
        title: "Consult",
        price: "25.00",
        inventoryQuantity: 22
      }
    ]
  },
  {
    slug: "pill-organizer",
    name: "Pill Organizer",
    description: "A direct-purchase organizer placeholder for fulfillment and account-flow testing.",
    purchaseMode: "DIRECT",
    categorySlugs: ["daily-care"],
    image: {
      url: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=1200&q=80",
      altText: "Daily medication organizer"
    },
    variants: [
      {
        sku: "PILL-ORGANIZER-WEEKLY",
        title: "Weekly Organizer",
        price: "12.00",
        inventoryQuantity: 60
      }
    ]
  },
  {
    slug: "sleep-mask",
    name: "Sleep Mask",
    description: "A direct-purchase sleep accessory placeholder for simple checkout flows.",
    purchaseMode: "DIRECT",
    categorySlugs: ["mental-wellness", "daily-care"],
    image: {
      url: "https://images.unsplash.com/photo-1511295742362-92c96b1cf484?auto=format&fit=crop&w=1200&q=80",
      altText: "Bedside sleep routine"
    },
    variants: [
      {
        sku: "SLEEP-MASK-SOFT",
        title: "Soft Mask",
        price: "14.00",
        inventoryQuantity: 40
      }
    ]
  },
  {
    slug: "dev-mug",
    name: "Dev Mug",
    description: "A sturdy mug for checkout and fulfillment testing.",
    purchaseMode: "DIRECT",
    categorySlugs: ["drinkware"],
    image: {
      url: "https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?auto=format&fit=crop&w=1200&q=80",
      altText: "White ceramic mug on a table"
    },
    variants: [
      {
        sku: "DEV-MUG-001",
        title: "Default",
        price: "19.99",
        inventoryQuantity: 25
      }
    ]
  }
];

products.push(...questHealthLabProducts);
products.push(...imagingDiagnosticProducts);
products.push(...geneticTestingProducts);

const legacyPlaceholderProductSlugs = ["test-product"];

const standardOptions = {
  goals: [
    { label: "Explore options", value: "explore-options" },
    { label: "Compare plans", value: "compare-plans" },
    { label: "Start as soon as possible", value: "start-soon" }
  ],
  experience: [
    { label: "New to this", value: "new" },
    { label: "Used similar support before", value: "used-before" },
    { label: "Currently using a routine", value: "current-routine" }
  ],
  followUp: [
    { label: "Online follow-up", value: "online-follow-up" },
    { label: "Review plan details", value: "review-plan-details" },
    { label: "Talk to support first", value: "support-first" }
  ],
  timeframe: [
    { label: "This week", value: "this-week" },
    { label: "This month", value: "this-month" },
    { label: "Just researching", value: "researching" }
  ]
};

const goalPriorityOptions = [
  { label: "Understand my options", value: "understand-options" },
  { label: "Find a likely next step", value: "find-next-step" },
  { label: "Check if labs make sense", value: "consider-labs" }
];

const goalKeys = [
  {
    goalKey: "weight-loss",
    slug: "goal-weight-loss",
    title: "Weight Goal Intake",
    topic: "weight and metabolic health"
  },
  {
    goalKey: "hair-loss",
    slug: "goal-hair-loss",
    title: "Hair Goal Intake",
    topic: "hair loss and scalp support"
  },
  {
    goalKey: "sexual-health",
    slug: "goal-sexual-health",
    title: "Sexual Health Goal Intake",
    topic: "sexual wellness"
  },
  {
    goalKey: "skin-care",
    slug: "goal-skin-care",
    title: "Skin Care Goal Intake",
    topic: "skin care"
  },
  {
    goalKey: "hormone-health",
    slug: "goal-hormone-health",
    title: "Hormone Health Goal Intake",
    topic: "hormone health"
  },
  {
    goalKey: "wellness-labs",
    slug: "goal-wellness-labs",
    title: "Wellness Labs Goal Intake",
    topic: "wellness labs and health checks"
  }
];

function assessmentQuestions(topic) {
  return [
    {
      key: "main_goal",
      label: `What brings you to ${topic}?`,
      type: "SINGLE_SELECT",
      options: standardOptions.goals,
      sortOrder: 0
    },
    {
      key: "prior_experience",
      label: "Have you used similar support before?",
      type: "SINGLE_SELECT",
      options: standardOptions.experience,
      sortOrder: 1
    },
    {
      key: "timeframe",
      label: "When would you like to take the next step?",
      type: "SINGLE_SELECT",
      options: standardOptions.timeframe,
      sortOrder: 2
    },
    {
      key: "preferred_follow_up",
      label: "Preferred follow-up",
      type: "SINGLE_SELECT",
      options: standardOptions.followUp,
      sortOrder: 3
    },
    {
      key: "notes",
      label: "Anything else you want to mention?",
      type: "TEXT",
      required: false,
      sortOrder: 4
    }
  ];
}

function goalAssessmentQuestions(topic) {
  return [
    {
      key: "main_goal",
      label: `What are you hoping to improve with ${topic}?`,
      type: "TEXT",
      sortOrder: 0
    },
    {
      key: "priority",
      label: "What would help most right now?",
      type: "SINGLE_SELECT",
      options: goalPriorityOptions,
      sortOrder: 1
    },
    {
      key: "timeframe",
      label: "When would you like to take the next step?",
      type: "SINGLE_SELECT",
      options: standardOptions.timeframe,
      sortOrder: 2
    },
    {
      key: "prior_experience",
      label: "Have you used similar support before?",
      type: "SINGLE_SELECT",
      options: standardOptions.experience,
      sortOrder: 3
    },
    {
      key: "notes",
      label: "Anything else you want to mention?",
      type: "TEXT",
      required: false,
      sortOrder: 4
    }
  ];
}

function assessmentTemplate(productSlug, slug, title, topic) {
  return {
    productSlug,
    slug,
    title,
    description: `A short intake for ${topic} goals and support preferences.`,
    questions: assessmentQuestions(topic)
  };
}

function goalAssessmentTemplate(input) {
  return {
    goalKey: input.goalKey,
    slug: input.slug,
    title: input.title,
    description: `A short intake to match ${input.topic} goals with recommended next steps.`,
    questions: goalAssessmentQuestions(input.topic)
  };
}

const assessmentTemplates = [
  assessmentTemplate("hair-density-support-kit", "hair-density-support", "Hair Support Assessment", "hair support"),
  assessmentTemplate("hair-thinning-consult", "hair-thinning-support", "Hair Thinning Assessment", "hair thinning support"),
  assessmentTemplate("skin-clarity-routine", "skin-clarity-support", "Skin Care Assessment", "skin care"),
  assessmentTemplate("acne-care-consult", "acne-care-support", "Acne Care Assessment", "acne care"),
  assessmentTemplate("age-support-skin-consult", "age-support-skin", "Age Support Skin Assessment", "skin age support"),
  assessmentTemplate("redness-support-consult", "redness-support", "Redness Support Assessment", "redness support"),
  assessmentTemplate("bedroom-basics-kit", "sexual-wellness-support", "Sexual Wellness Assessment", "sexual wellness"),
  assessmentTemplate("ed-wellness-consult", "ed-wellness-support", "ED Wellness Assessment", "ED wellness"),
  assessmentTemplate(
    "early-finish-support-consult",
    "early-finish-support",
    "Early Finish Support Assessment",
    "sexual wellness timing"
  ),
  assessmentTemplate(
    "weight-management-starter-kit",
    "weight-management-support",
    "Weight Management Assessment",
    "weight management"
  ),
  assessmentTemplate(
    "metabolic-health-consult",
    "metabolic-health-support",
    "Metabolic Health Assessment",
    "metabolic health"
  ),
  assessmentTemplate("weight-care-program", "weight-care-program", "Weight Care Assessment", "weight care"),
  assessmentTemplate("glp1-weight-care-consult", "glp1-weight-care", "GLP-1 Weight Care Assessment", "GLP-1 weight care"),
  assessmentTemplate(
    "glp1-injection-support-program",
    "glp1-injection-support",
    "GLP-1 Injection Support Assessment",
    "GLP-1 injection support"
  ),
  assessmentTemplate(
    "oral-weight-loss-consult",
    "oral-weight-loss-support",
    "Oral Weight Loss Assessment",
    "oral weight loss support"
  ),
  assessmentTemplate(
    "weight-loss-labs-panel",
    "weight-loss-labs",
    "Weight Loss Labs Assessment",
    "weight loss labs"
  ),
  assessmentTemplate("sleep-stress-support-kit", "sleep-stress-support", "Sleep & Stress Assessment", "sleep and stress support"),
  assessmentTemplate("anxiety-support-consult", "anxiety-support", "Anxiety Support Assessment", "anxiety support"),
  assessmentTemplate("focus-energy-consult", "focus-energy-support", "Focus & Energy Assessment", "focus and energy support"),
  assessmentTemplate("at-home-wellness-labs-kit", "wellness-labs-support", "Wellness Labs Assessment", "wellness labs"),
  assessmentTemplate("hormone-health-check-in", "hormone-health-check-in", "Hormone Health Assessment", "hormone health"),
  assessmentTemplate(
    "testosterone-health-check-in",
    "testosterone-health-check-in",
    "Testosterone Health Assessment",
    "testosterone health"
  ),
  assessmentTemplate("testosterone-labs-panel", "testosterone-labs", "Testosterone Labs Assessment", "testosterone labs"),
  assessmentTemplate("menopause-support-consult", "menopause-support", "Menopause Support Assessment", "menopause support"),
  assessmentTemplate("cycle-support-consult", "cycle-support", "Cycle Support Assessment", "cycle support"),
  assessmentTemplate("fertility-planning-consult", "fertility-planning", "Fertility Planning Assessment", "fertility planning"),
  assessmentTemplate("heart-health-check-in", "heart-health-check-in", "Heart Health Assessment", "heart health"),
  assessmentTemplate("metabolic-labs-panel", "metabolic-labs", "Metabolic Labs Assessment", "metabolic labs"),
  assessmentTemplate("thyroid-labs-panel", "thyroid-labs", "Thyroid Labs Assessment", "thyroid labs"),
  assessmentTemplate(
    "sexual-health-screening-kit",
    "sexual-health-screening",
    "Sexual Health Screening Assessment",
    "sexual health screening"
  ),
  assessmentTemplate(
    "general-health-check-labs",
    "general-health-check-labs",
    "General Health Check Assessment",
    "general health checks"
  ),
  assessmentTemplate("gut-health-consult", "gut-health-support", "Gut Health Assessment", "gut health"),
  assessmentTemplate("allergy-relief-consult", "allergy-relief-support", "Allergy Relief Assessment", "allergy support"),
  assessmentTemplate(
    "smoking-cessation-consult",
    "smoking-cessation-support",
    "Smoking Cessation Assessment",
    "smoking cessation support"
  )
];

assessmentTemplates.push(
  ...imagingDiagnosticProducts.map((product) =>
    assessmentTemplate(product.slug, `${product.slug}-assessment`, `${product.name} Assessment`, "imaging review")
  ),
  ...geneticTestingProducts.map((product) =>
    assessmentTemplate(product.slug, `${product.slug}-assessment`, `${product.name} Assessment`, "genetics review")
  )
);

const goalAssessmentTemplates = goalKeys.map(goalAssessmentTemplate);

try {
  const categoryBySlug = new Map();
  const productBySlug = new Map();

  for (const categoryInput of categories) {
    const category = await prisma.category.upsert({
      where: {
        slug: categoryInput.slug
      },
      create: categoryInput,
      update: {
        name: categoryInput.name
      }
    });

    categoryBySlug.set(category.slug, category);
  }

  for (const productInput of products) {
    const product = await prisma.product.upsert({
      where: {
        slug: productInput.slug
      },
      create: {
        slug: productInput.slug,
        name: productInput.name,
        description: productInput.description,
        status: "ACTIVE",
        purchaseMode: productInput.purchaseMode
      },
      update: {
        name: productInput.name,
        description: productInput.description,
        status: "ACTIVE",
        purchaseMode: productInput.purchaseMode
      }
    });
    productBySlug.set(product.slug, product);

    const categoryIds = [];

    for (const categorySlug of productInput.categorySlugs) {
      const category = categoryBySlug.get(categorySlug);

      if (!category) {
        throw new Error(`Missing category for product ${productInput.slug}: ${categorySlug}`);
      }

      categoryIds.push(category.id);

      await prisma.productCategory.upsert({
        where: {
          productId_categoryId: {
            productId: product.id,
            categoryId: category.id
          }
        },
        create: {
          productId: product.id,
          categoryId: category.id
        },
        update: {}
      });
    }

    await prisma.productCategory.deleteMany({
      where: {
        productId: product.id,
        categoryId: {
          notIn: categoryIds
        }
      }
    });

    for (const variantInput of productInput.variants) {
      await prisma.productVariant.upsert({
        where: {
          sku: variantInput.sku
        },
        create: {
          productId: product.id,
          sku: variantInput.sku,
          title: variantInput.title,
          price: variantInput.price,
          currency: "USD",
          inventoryQuantity: variantInput.inventoryQuantity
        },
        update: {
          productId: product.id,
          title: variantInput.title,
          price: variantInput.price,
          currency: "USD",
          inventoryQuantity: variantInput.inventoryQuantity
        }
      });
    }

    await prisma.productImage.deleteMany({
      where: {
        productId: product.id
      }
    });

    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: productInput.image.url,
        altText: productInput.image.altText,
        sortOrder: 0
      }
    });
  }

  for (const templateInput of assessmentTemplates) {
    const product = productBySlug.get(templateInput.productSlug);

    if (!product) {
      throw new Error(`Missing assessment product: ${templateInput.productSlug}`);
    }

    const template = await prisma.assessmentTemplate.upsert({
      where: {
        slug_version: {
          slug: templateInput.slug,
          version: 1
        }
      },
      create: {
        productId: product.id,
        goalKey: null,
        slug: templateInput.slug,
        title: templateInput.title,
        description: templateInput.description,
        type: "PRODUCT_INTAKE",
        status: "ACTIVE",
        version: 1
      },
      update: {
        productId: product.id,
        goalKey: null,
        title: templateInput.title,
        description: templateInput.description,
        type: "PRODUCT_INTAKE",
        status: "ACTIVE"
      }
    });

    for (const question of templateInput.questions) {
      await prisma.assessmentQuestion.upsert({
        where: {
          templateId_key: {
            templateId: template.id,
            key: question.key
          }
        },
        create: {
          templateId: template.id,
          key: question.key,
          label: question.label,
          helpText: question.helpText,
          type: question.type,
          required: question.required ?? true,
          options: question.options,
          sortOrder: question.sortOrder
        },
        update: {
          label: question.label,
          helpText: question.helpText,
          type: question.type,
          required: question.required ?? true,
          options: question.options,
          sortOrder: question.sortOrder
        }
      });
    }
  }

  for (const templateInput of goalAssessmentTemplates) {
    const template = await prisma.assessmentTemplate.upsert({
      where: {
        slug_version: {
          slug: templateInput.slug,
          version: 1
        }
      },
      create: {
        goalKey: templateInput.goalKey,
        productId: null,
        slug: templateInput.slug,
        title: templateInput.title,
        description: templateInput.description,
        type: "GOAL_INTAKE",
        status: "ACTIVE",
        version: 1
      },
      update: {
        goalKey: templateInput.goalKey,
        productId: null,
        title: templateInput.title,
        description: templateInput.description,
        type: "GOAL_INTAKE",
        status: "ACTIVE"
      }
    });

    for (const question of templateInput.questions) {
      await prisma.assessmentQuestion.upsert({
        where: {
          templateId_key: {
            templateId: template.id,
            key: question.key
          }
        },
        create: {
          templateId: template.id,
          key: question.key,
          label: question.label,
          helpText: question.helpText,
          type: question.type,
          required: question.required ?? true,
          options: question.options,
          sortOrder: question.sortOrder
        },
        update: {
          label: question.label,
          helpText: question.helpText,
          type: question.type,
          required: question.required ?? true,
          options: question.options,
          sortOrder: question.sortOrder
        }
      });
    }
  }

  const archivedLegacyProducts = await prisma.product.updateMany({
    where: {
      slug: {
        in: legacyPlaceholderProductSlugs
      }
    },
    data: {
      status: "ARCHIVED"
    }
  });

  console.log(`Seeded dev catalog: ${products.length} products, ${categories.length} categories`);
  console.log(
    `Seeded assessment templates: ${assessmentTemplates.length} product, ${goalAssessmentTemplates.length} goal`
  );
  if (archivedLegacyProducts.count > 0) {
    console.log(`Archived legacy placeholder products: ${archivedLegacyProducts.count}`);
  }
} finally {
  await prisma.$disconnect();
}
