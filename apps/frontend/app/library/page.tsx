import Link from "next/link";
import { CustomerBrand } from "../../src/components/CustomerBrand";
import { CustomerNav } from "../../src/components/CustomerNav";
import { TopicNav } from "../../src/components/TopicNav";

export const metadata = {
  title: "Health Library | Condensed Health"
};

const libraryCollections = [
  {
    title: "Testing",
    detail: "How to think about lab, genetic, and at-home testing options.",
    href: "/#tests",
    items: ["Lab panels", "Genetic testing", "At-home kits"]
  },
  {
    title: "Results",
    detail: "Plain-language guides for understanding reports and deciding what to ask next.",
    href: "/message-team",
    items: ["Bloodwork", "Hormones", "Follow-up questions"]
  },
  {
    title: "Health concerns",
    detail: "Starting points for common questions about symptoms, goals, and next steps.",
    href: "/#clinicians",
    items: ["Weight", "Hair loss", "Skin care"]
  },
  {
    title: "Care navigation",
    detail: "When to message our team, review records, plan testing, or talk to a clinician.",
    href: "/my-health",
    items: ["Records", "Testing plans", "Follow-up"]
  }
] as const;

const featuredGuides = [
  "What to ask before ordering a test",
  "How to prepare lab results for review",
  "When a result needs follow-up",
  "How to compare testing options"
] as const;

export default function LibraryPage() {
  return (
    <main className="shell">
      <section className="topbar site-header" aria-label="Customer navigation">
        <CustomerBrand />
        <TopicNav />
        <div className="nav-actions">
          <CustomerNav secondaryHref="/message-team" secondaryLabel="Contact" />
        </div>
      </section>

      <section className="library-hero" aria-label="Health library">
        <div>
          <p className="eyebrow">Health library</p>
          <h1>Simple guides for testing, results, and follow-up.</h1>
          <p>
            Browse starting points for common health questions. The library is here to help you
            understand the options before deciding what to message our team about.
          </p>
        </div>
        <Link className="nav-link primary-link" href="/message-team">
          Ask a question
        </Link>
      </section>

      <section className="library-collection-grid" aria-label="Library collections">
        {libraryCollections.map((collection) => (
          <article className="library-collection-card" key={collection.title}>
            <div>
              <h2>{collection.title}</h2>
              <p>{collection.detail}</p>
            </div>
            <ul>
              {collection.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link href={collection.href}>View collection</Link>
          </article>
        ))}
      </section>

      <section className="library-featured" aria-label="Featured guides">
        <div>
          <p className="eyebrow">Featured guides</p>
          <h2>Coming soon</h2>
        </div>
        <div className="library-featured-list">
          {featuredGuides.map((guide) => (
            <article key={guide}>
              <h3>{guide}</h3>
              <p>Short practical guidance will live here as the content library grows.</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
