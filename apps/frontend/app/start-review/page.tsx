"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ReportPreviewVariantA } from "../LandingPage";
import { CustomerBrand } from "../../src/components/CustomerBrand";
import { CustomerNav } from "../../src/components/CustomerNav";
import { TopicNav } from "../../src/components/TopicNav";
import { reviewStartPaths } from "../../src/lib/reviewStartPaths";

const reviewLayoutValues = ["split", "report"] as const;

function pickLayout(value: string | null): (typeof reviewLayoutValues)[number] {
  return reviewLayoutValues.includes(value as (typeof reviewLayoutValues)[number])
    ? (value as (typeof reviewLayoutValues)[number])
    : "split";
}

function StartReviewContent() {
  const searchParams = useSearchParams();
  const layout = pickLayout(searchParams.get("layout"));

  return (
    <main className={`shell start-review-page start-review-page-${layout}`}>
      <section className="topbar site-header" aria-label="Start review navigation">
        <CustomerBrand />
        <TopicNav />
        <div className="nav-actions">
          <CustomerNav
            primaryHref="/my-health"
            primaryLabel="My Health"
            secondaryHref="/health-areas"
            secondaryLabel="Contact"
          />
        </div>
      </section>

      <section className="start-review-chooser" aria-labelledby="start-review-title">
        <div className="start-review-choice-panel">
          <div className="start-review-copy">
            <h1 id="start-review-title">Start with your health question.</h1>
            <p>
              Choose the closest starting point. You can add symptoms, records, labs, history, and
              prior care in the next step.
            </p>
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
        </div>

        {layout === "split" ? (
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
        ) : null}

        {layout === "report" ? (
          <aside className="start-review-visual" aria-label="Sample written review">
            <div className="start-review-report-card">
              <ReportPreviewVariantA />
            </div>
          </aside>
        ) : null}
      </section>
    </main>
  );
}

export default function StartReviewPage() {
  return (
    <Suspense fallback={null}>
      <StartReviewContent />
    </Suspense>
  );
}
