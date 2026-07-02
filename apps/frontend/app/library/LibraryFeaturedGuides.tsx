"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

const featuredGuides = [
  {
    title: "How to choose a starting lab panel",
    detail: "A practical way to think about baseline testing, missing context, and follow-up questions.",
    topic: "Testing",
    href: "/services?category=Tests"
  },
  {
    title: "What to do with confusing bloodwork",
    detail: "How to organize abnormal, borderline, and trending markers before asking for review.",
    topic: "Results",
    href: "/services?category=Analysis"
  },
  {
    title: "When a health question needs follow-up",
    detail: "Ways to turn symptoms, results, or care recommendations into clear next steps.",
    topic: "Care",
    href: "/my-health"
  },
  {
    title: "How to prepare records for review",
    detail: "What to gather before asking the team to look at labs, reports, notes, or screenshots.",
    topic: "Records",
    href: "/my-health?layout=record-log"
  },
  {
    title: "How to compare wellness products",
    detail: "A calmer way to think about supplements, skin care, hair support, and daily routines.",
    topic: "Wellness",
    href: "/services?category=Wellness"
  },
  {
    title: "Questions to ask about advanced options",
    detail: "What to clarify before looking into PRP, peptides, IV therapy, exosomes, or stem cell claims.",
    topic: "Advanced health",
    href: "/services?category=Advanced%20Health"
  },
  {
    title: "How to decide what to do next",
    detail: "Turn a broad health concern into a clearer path for testing, records review, products, or care.",
    topic: "Next steps",
    href: "/message-team"
  }
] as const;

function getVisibleGuideCount() {
  if (typeof window === "undefined") {
    return 4;
  }

  if (window.innerWidth < 720) {
    return 1;
  }

  if (window.innerWidth < 1040) {
    return 2;
  }

  return 4;
}

export function LibraryFeaturedGuides() {
  const [visibleCount, setVisibleCount] = useState(4);
  const [startIndex, setStartIndex] = useState(0);
  const maxStartIndex = Math.max(featuredGuides.length - visibleCount, 0);
  const visibleGuides = featuredGuides.slice(startIndex, startIndex + visibleCount);
  const canGoPrevious = startIndex > 0;
  const canGoNext = startIndex < maxStartIndex;

  useEffect(() => {
    function updateVisibleCount() {
      setVisibleCount(getVisibleGuideCount());
    }

    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);

    return () => {
      window.removeEventListener("resize", updateVisibleCount);
    };
  }, []);

  useEffect(() => {
    setStartIndex((current) => Math.min(current, maxStartIndex));
  }, [maxStartIndex]);

  return (
    <section className="library-section library-featured-section" aria-labelledby="library-featured-title">
      <div className="library-section-heading library-featured-heading">
        <div>
          <h2 id="library-featured-title">Featured guides</h2>
          <p>Good starting points for common testing, result-review, and follow-up questions.</p>
        </div>
        <div className="library-featured-nav" aria-label="Featured guide navigation">
          <button
            aria-label="Previous featured guides"
            className="home-carousel-arrow"
            disabled={!canGoPrevious}
            type="button"
            onClick={() => setStartIndex((current) => Math.max(current - visibleCount, 0))}
          >
            ‹
          </button>
          <button
            aria-label="Next featured guides"
            className="home-carousel-arrow"
            disabled={!canGoNext}
            type="button"
            onClick={() => setStartIndex((current) => Math.min(current + visibleCount, maxStartIndex))}
          >
            ›
          </button>
        </div>
      </div>
      <div className="library-guide-grid" style={{ "--library-featured-count": visibleCount } as CSSProperties}>
        {visibleGuides.map((guide) => (
          <article className="library-guide-card" key={guide.title}>
            <span>{guide.topic}</span>
            <h3>{guide.title}</h3>
            <p>{guide.detail}</p>
            <Link href={guide.href}>Read guide</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
