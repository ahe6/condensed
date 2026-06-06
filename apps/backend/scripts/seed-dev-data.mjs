#!/usr/bin/env node
import { createPrismaClient } from "./database-url.mjs";

const prisma = await createPrismaClient();

const categories = [
  { slug: "daily-care", name: "Daily Care" },
  { slug: "hair", name: "Hair" },
  { slug: "skin", name: "Skin" },
  { slug: "sexual-wellness", name: "Sexual Wellness" },
  { slug: "weight-management", name: "Weight Management" },
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

const assessmentTemplates = [
  {
    productSlug: "hair-density-support-kit",
    slug: "hair-density-support",
    title: "Hair Support Assessment",
    description: "A short intake for hair routine goals and next steps.",
    questions: assessmentQuestions("hair support")
  },
  {
    productSlug: "skin-clarity-routine",
    slug: "skin-clarity-support",
    title: "Skin Care Assessment",
    description: "A short intake for skin goals and routine preferences.",
    questions: assessmentQuestions("skin care")
  },
  {
    productSlug: "bedroom-basics-kit",
    slug: "sexual-wellness-support",
    title: "Sexual Wellness Assessment",
    description: "A short intake for sexual wellness goals and next steps.",
    questions: assessmentQuestions("sexual wellness")
  },
  {
    productSlug: "weight-management-starter-kit",
    slug: "weight-management-support",
    title: "Weight Management Assessment",
    description: "A short intake for weight-management goals and support preferences.",
    questions: assessmentQuestions("weight management")
  },
  {
    productSlug: "sleep-stress-support-kit",
    slug: "sleep-stress-support",
    title: "Sleep & Stress Assessment",
    description: "A short intake for evening routine goals and support preferences.",
    questions: assessmentQuestions("sleep and stress support")
  },
  {
    productSlug: "at-home-wellness-labs-kit",
    slug: "wellness-labs-support",
    title: "Wellness Labs Assessment",
    description: "A short intake for lab-kit goals and follow-up preferences.",
    questions: assessmentQuestions("wellness labs")
  }
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

    await prisma.assessmentQuestion.deleteMany({
      where: {
        templateId: template.id
      }
    });

    await prisma.assessmentQuestion.createMany({
      data: templateInput.questions.map((question) => ({
        templateId: template.id,
        key: question.key,
        label: question.label,
        helpText: question.helpText,
        type: question.type,
        required: question.required ?? true,
        options: question.options,
        sortOrder: question.sortOrder
      }))
    });
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
