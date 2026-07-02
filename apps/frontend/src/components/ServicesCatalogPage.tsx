"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ConsultOverlayHeader } from "./ConsultOverlayHeader";

const categories = [
  "All",
  "Tests",
  "Analysis",
  "Wellness",
  "Care",
  "Treatments",
  "Advanced Health"
] as const;

type ServiceCategory = (typeof categories)[number];

function pickInitialCategory(value: string | null): ServiceCategory {
  if (value === "Clinicians") {
    return "Care";
  }

  return categories.includes(value as ServiceCategory) ? (value as ServiceCategory) : "All";
}

const serviceCards = [
  {
    title: "General health panel",
    detail: "Baseline labs for energy, metabolism, inflammation, and organ function.",
    category: "Tests",
    meta: "Testing",
    href: "/message-team",
    cta: "Start here",
    price: "From $129"
  },
  {
    title: "Hormone testing",
    detail: "Hormone labs for fertility, cycles, testosterone, thyroid context, or menopause questions.",
    category: "Tests",
    meta: "Labs",
    href: "/hormones",
    cta: "Explore",
    price: "From $149"
  },
  {
    title: "Genetic testing",
    detail: "Genetics options for inherited risk, carrier screening, and medication response.",
    category: "Tests",
    meta: "Genetics",
    href: "/genetic-testing",
    cta: "Explore",
    price: "From $199"
  },
  {
    title: "Bloodwork analysis",
    detail: "Review abnormal values, borderline markers, trends, and follow-up questions.",
    category: "Analysis",
    meta: "Bloodwork",
    href: "/message-team",
    cta: "Review results",
    price: "From $49"
  },
  {
    title: "Hormone analysis",
    detail: "Make sense of reproductive, thyroid, adrenal, or sex hormone results with timing and context.",
    category: "Analysis",
    meta: "Hormones",
    href: "/message-team",
    cta: "Review results",
    price: "From $49"
  },
  {
    title: "Daily supplement packs",
    detail: "Daily supplement options for routine wellness, nutrient questions, and general support.",
    category: "Wellness",
    meta: "Supplements",
    href: "/products/daily-multivitamin-pack",
    cta: "View wellness",
    price: "From $29"
  },
  {
    title: "Skin care routines",
    detail: "Cleanser, moisturizer, sunscreen, and skin-support products for everyday routines.",
    category: "Wellness",
    meta: "Skin care",
    href: "/products/skin-clarity-routine",
    cta: "View wellness",
    price: "From $39"
  },
  {
    title: "Hair support kits",
    detail: "Hair and scalp support options that can sit alongside testing, analysis, or care guidance.",
    category: "Wellness",
    meta: "Hair",
    href: "/products/hair-density-support-kit",
    cta: "View wellness",
    price: "From $49"
  },
  {
    title: "Primary care",
    detail: "General clinician routing for broad concerns, routine follow-up, and next-step planning.",
    category: "Care",
    meta: "Care",
    href: "/message-team",
    cta: "Ask us",
    price: "Free to ask"
  },
  {
    title: "Genetics guidance",
    detail: "Talk through genetics results, inherited risk, carrier screening, or medication-response questions.",
    category: "Care",
    meta: "Genetics",
    href: "/message-team",
    cta: "Ask us",
    price: "Free to ask"
  },
  {
    title: "Weight loss treatment",
    detail: "Review GLP-1, oral medication, lab, and follow-up questions before routing to care.",
    category: "Treatments",
    meta: "Prescription",
    href: "/message-team",
    cta: "Review options",
    price: "Free to ask"
  },
  {
    title: "Hair loss treatment",
    detail: "Compare topical, oral, lab, and scalp-care questions for thinning, shedding, or pattern hair loss.",
    category: "Treatments",
    meta: "Hair",
    href: "/message-team",
    cta: "Review options",
    price: "Free to ask"
  },
  {
    title: "Acne treatment",
    detail: "Explore prescription and non-prescription acne paths, routine fit, photos, and follow-up needs.",
    category: "Treatments",
    meta: "Skin",
    href: "/message-team",
    cta: "Review options",
    price: "Free to ask"
  },
  {
    title: "PRP Therapy",
    detail: "Platelet-rich plasma questions for joint pain, tendon issues, hair loss, skin, and recovery.",
    category: "Advanced Health",
    meta: "PRP",
    href: "/message-team",
    cta: "Explore PRP",
    price: "Free to ask"
  },
  {
    title: "Stem Cell Therapy Review",
    detail: "Review stem-cell clinic claims for joints, injury recovery, aging, and advanced-care questions.",
    category: "Advanced Health",
    meta: "Regenerative",
    href: "/message-team",
    cta: "Check options",
    price: "Free to ask"
  },
  {
    title: "Hyperbaric Oxygen Therapy",
    detail: "Check HBOT questions for wound healing, recovery, inflammation, and brain-injury-adjacent interest.",
    category: "Advanced Health",
    meta: "HBOT",
    href: "/message-team",
    cta: "Check options",
    price: "Free to ask"
  }
] as const;

export function ServicesCatalogPage() {
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>(() =>
    pickInitialCategory(searchParams.get("category"))
  );
  const [query, setQuery] = useState("");

  const filteredCards = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return serviceCards.filter((card) => {
      const matchesCategory = activeCategory === "All" || card.category === activeCategory;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [card.title, card.detail, card.category, card.meta].some((value) =>
          value.toLowerCase().includes(normalizedQuery)
        );

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  return (
    <main className="shell services-catalog-page overlay-header-page">
      <ConsultOverlayHeader lineVariant="full" />

      <section className="services-catalog-hero" aria-labelledby="services-catalog-title">
        <div>
          <h1 id="services-catalog-title">Services</h1>
          <p>
            Find the right place to start across testing, analysis, wellness, care, treatments, and advanced health.
          </p>
        </div>
      </section>

      <section className="services-catalog-controls" aria-label="Search and filter services">
        <label className="services-catalog-search">
          <span>Search</span>
          <input
            aria-label="Search services or describe what you need"
            type="search"
            value={query}
            placeholder="Search services or describe what you need..."
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className="services-catalog-category-row" aria-label="Service categories">
          {categories.map((category) => (
            <button
              aria-pressed={activeCategory === category}
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="services-catalog-results" aria-label="Service results">
        <div className="services-catalog-results-heading">
          <h2>{activeCategory === "All" ? "All services" : activeCategory}</h2>
          <span>{filteredCards.length} options</span>
        </div>

        <div className="services-catalog-grid">
          {filteredCards.map((card) => (
            <Link className="services-catalog-card" href={card.href} key={`${card.category}-${card.title}`}>
              <span>{card.meta}</span>
              <h3>{card.title}</h3>
              <p>{card.detail}</p>
              <strong className="services-catalog-price">{card.price}</strong>
              <small>
                {card.cta}
                <span aria-hidden="true">→</span>
              </small>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
