import Link from "next/link";
import { CustomerBrand } from "./CustomerBrand";
import { TopicPage } from "../lib/topicPages";

type TopicProgramPageProps = {
  topic: TopicPage;
};

export function TopicProgramPage({ topic }: TopicProgramPageProps) {
  return (
    <main className="shell ad-page">
      <section className="ad-topbar" aria-label="Landing page navigation">
        <CustomerBrand />
        <nav aria-label="Related links">
          <Link href="/services">Services</Link>
          <Link className="ad-topbar-cta" href="#paths">
            View options
          </Link>
        </nav>
      </section>

      <section className={`ad-hero-v2 ad-hero-${topic.imageClass}`} aria-label={topic.label}>
        <div className="ad-hero-v2-copy">
          <p className="eyebrow">{topic.eyebrow}</p>
          <h1>{topic.title}</h1>
          <p>{topic.summary}</p>
          <div className="ad-hero-v2-actions">
            <Link className="nav-link primary-link" href="#start-options">
              Compare your options
            </Link>
            <Link className="nav-link" href="#paths">
              See available paths
            </Link>
          </div>
          <div className="ad-hero-reassurance" aria-label="Service highlights">
            <span>No appointment required</span>
            <span>Testing, results, and next steps</span>
            <span>Start with the closest match</span>
          </div>
        </div>

        <aside className="ad-decision-panel" aria-label={`${topic.label} starting points`}>
          <div className="ad-decision-media">
            <img src="/home/health-hero.png" alt="" />
          </div>
          <div className="ad-decision-content">
            <span>Most people start here</span>
            <h2>Pick the path that sounds closest.</h2>
            <p>{topic.visualTitle}</p>
            <div className="ad-decision-list">
              {topic.startingPoints.map((point, index) => (
                <a href="#start-options" key={point.title}>
                  <span>{index + 1}</span>
                  <strong>{point.title}</strong>
                </a>
              ))}
            </div>
            <Link className="nav-link primary-link" href="#paths">
              View matched paths
            </Link>
          </div>
        </aside>
      </section>

      <section className="ad-proof-strip" aria-label={`${topic.label} highlights`}>
        {topic.highlights.map((highlight) => (
          <span key={highlight}>{highlight}</span>
        ))}
      </section>

      <section className="ad-options-section" id="start-options" aria-label="Choose a starting point">
        <div className="ad-section-intro">
          <p className="eyebrow">Start here</p>
          <h2>{topic.startingPointTitle}</h2>
          <p>{topic.startingPointSummary}</p>
        </div>
        <div className="ad-option-grid">
          {topic.startingPoints.map((point) => (
            <article key={point.title}>
              <h3>{point.title}</h3>
              <p>{point.detail}</p>
              <a href="#paths">See related paths</a>
            </article>
          ))}
        </div>
      </section>

      <section className="ad-path-section" id="paths" aria-label={`${topic.label} service paths`}>
        <div className="ad-section-intro">
          <p className="eyebrow">Available paths</p>
          <h2>Choose the service path that fits what you need now.</h2>
        </div>
        <div className="ad-service-paths">
          {topic.sections.map((section) => (
            <article key={section.title}>
              <div>
                <span>{section.title}</span>
                <h3>{section.detail}</h3>
              </div>
              <Link href={section.href}>{section.cta}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="ad-context-section" aria-label="What to compare">
        <div>
          <p className="eyebrow">What changes the next step</p>
          <h2>{topic.finalTitle}</h2>
          <p>{topic.finalSummary}</p>
        </div>
        <ul>
          {topic.visualItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="ad-final-v2" aria-label="Explore Condensed Health services">
        <div>
          <p className="eyebrow">Next step</p>
          <h2>Start with the closest option and narrow from there.</h2>
        </div>
        <Link className="nav-link primary-link" href="/services">
          View services
        </Link>
      </section>
    </main>
  );
}
