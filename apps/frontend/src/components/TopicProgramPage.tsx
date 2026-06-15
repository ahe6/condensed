import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { TopicPage } from "../lib/topicPages";

type TopicProgramPageProps = {
  topic: TopicPage;
  children?: ReactNode;
};

export function TopicProgramPage({ topic, children }: TopicProgramPageProps) {
  return (
    <main className="shell">
      <SiteHeader ariaLabel="Customer navigation" />

      <section className="topic-page-hero" aria-label={topic.label}>
        <div className="topic-page-copy">
          <p className="eyebrow">{topic.eyebrow}</p>
          <h1>{topic.title}</h1>
          <p>{topic.summary}</p>
          <div className="topic-page-actions">
            {topic.intakeHref ? (
              <Link className="nav-link primary-link" href={topic.intakeHref}>
                {topic.intakeLabel ?? "Start intake"}
              </Link>
            ) : null}
            <Link className="nav-link" href={topic.secondaryHref}>
              {topic.secondaryLabel}
            </Link>
          </div>
        </div>
        <div className={`topic-page-media ${topic.imageClass}`} aria-hidden="true">
          <img src="/home/health-hero.png" alt="" />
        </div>
      </section>

      <section className="topic-highlight-grid" aria-label={`${topic.label} highlights`}>
        {topic.highlights.map((highlight) => (
          <article key={highlight}>
            <span>{highlight}</span>
          </article>
        ))}
      </section>

      <section className="topic-section-grid" aria-label={`${topic.label} details`}>
        {topic.sections.map((section) => (
          <article key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.detail}</p>
          </article>
        ))}
      </section>

      {children}
    </main>
  );
}
