#!/usr/bin/env node
import { createPrismaClient } from "./database-url.mjs";

const prisma = await createPrismaClient();

const categories = [
  { slug: "daily-care", name: "Daily Care" },
  { slug: "hair", name: "Hair" },
  { slug: "skin", name: "Skin" },
  { slug: "sexual-wellness", name: "Sexual Wellness" },
  { slug: "weight-management", name: "Weight Management" },
  { slug: "hormone-health", name: "Hormone Health" },
  { slug: "womens-health", name: "Women's Health" },
  { slug: "mens-health", name: "Men's Health" },
  { slug: "heart-health", name: "Heart Health" },
  { slug: "digestive-health", name: "Digestive Health" },
  { slug: "allergy", name: "Allergy" },
  { slug: "smoking-cessation", name: "Smoking Cessation" },
  { slug: "mental-wellness", name: "Mental Wellness" },
  { slug: "labs", name: "Labs" },
  { slug: "supplements", name: "Supplements" },
  { slug: "drinkware", name: "Drinkware" }
];

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

function assessmentTemplate(productSlug, slug, title, topic) {
  return {
    productSlug,
    slug,
    title,
    description: `A short intake for ${topic} goals and support preferences.`,
    questions: assessmentQuestions(topic)
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
  assessmentTemplate("sleep-stress-support-kit", "sleep-stress-support", "Sleep & Stress Assessment", "sleep and stress support"),
  assessmentTemplate("anxiety-support-consult", "anxiety-support", "Anxiety Support Assessment", "anxiety support"),
  assessmentTemplate("focus-energy-consult", "focus-energy-support", "Focus & Energy Assessment", "focus and energy support"),
  assessmentTemplate("at-home-wellness-labs-kit", "wellness-labs-support", "Wellness Labs Assessment", "wellness labs"),
  assessmentTemplate("hormone-health-check-in", "hormone-health-check-in", "Hormone Health Assessment", "hormone health"),
  assessmentTemplate("menopause-support-consult", "menopause-support", "Menopause Support Assessment", "menopause support"),
  assessmentTemplate("cycle-support-consult", "cycle-support", "Cycle Support Assessment", "cycle support"),
  assessmentTemplate("fertility-planning-consult", "fertility-planning", "Fertility Planning Assessment", "fertility planning"),
  assessmentTemplate("heart-health-check-in", "heart-health-check-in", "Heart Health Assessment", "heart health"),
  assessmentTemplate("gut-health-consult", "gut-health-support", "Gut Health Assessment", "gut health"),
  assessmentTemplate("allergy-relief-consult", "allergy-relief-support", "Allergy Relief Assessment", "allergy support"),
  assessmentTemplate(
    "smoking-cessation-consult",
    "smoking-cessation-support",
    "Smoking Cessation Assessment",
    "smoking cessation support"
  )
];

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
        slug: templateInput.slug,
        title: templateInput.title,
        description: templateInput.description,
        status: "ACTIVE",
        version: 1
      },
      update: {
        productId: product.id,
        title: templateInput.title,
        description: templateInput.description,
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
  console.log(`Seeded assessment templates: ${assessmentTemplates.length}`);
  if (archivedLegacyProducts.count > 0) {
    console.log(`Archived legacy placeholder products: ${archivedLegacyProducts.count}`);
  }
} finally {
  await prisma.$disconnect();
}
