import Link from "next/link";
import { ConsultOverlayHeader } from "../../src/components/ConsultOverlayHeader";

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

const forumCategories = [
  {
    title: "Results help",
    detail: "Questions about bloodwork, genetic reports, imaging notes, and what to ask next.",
    count: "18 threads"
  },
  {
    title: "Testing options",
    detail: "Compare labs, at-home kits, genetics, screening, and advanced testing paths.",
    count: "12 threads"
  },
  {
    title: "Care next steps",
    detail: "Talk through follow-up, referrals, second opinions, and care coordination questions.",
    count: "9 threads"
  },
  {
    title: "Products and routines",
    detail: "Discuss supplements, skin care, hair support, and daily wellness routines.",
    count: "7 threads"
  }
] as const;

const forumThreads = [
  {
    title: "Which markers matter most before a general health panel?",
    tag: "Testing",
    meta: "New discussion",
    replies: "4 replies"
  },
  {
    title: "How should I organize old bloodwork before asking for a review?",
    tag: "Records",
    meta: "Pinned starter",
    replies: "6 replies"
  },
  {
    title: "What questions should I ask after a borderline thyroid result?",
    tag: "Results",
    meta: "Popular",
    replies: "11 replies"
  },
  {
    title: "Stem cells, PRP, exosomes: what should someone verify first?",
    tag: "Advanced health",
    meta: "Review topic",
    replies: "3 replies"
  }
] as const;

export default function LibraryPage() {
  return (
    <main className="shell overlay-header-page">
      <ConsultOverlayHeader lineVariant="full" />

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

      <section className="library-forum" aria-labelledby="library-forum-title">
        <div className="library-forum-heading">
          <div>
            <p className="eyebrow">Community forum</p>
            <h2 id="library-forum-title">Ask, compare, and organize health questions.</h2>
            <p>
              A place for practical discussions about testing, results, products, advanced options,
              and what to do next. This is not medical advice or urgent care.
            </p>
          </div>
          <Link className="nav-link primary-link" href="/message-team">
            Start a discussion
          </Link>
        </div>

        <div className="library-forum-layout">
          <div className="library-forum-categories" aria-label="Forum categories">
            {forumCategories.map((category) => (
              <article key={category.title}>
                <div>
                  <h3>{category.title}</h3>
                  <p>{category.detail}</p>
                </div>
                <span>{category.count}</span>
              </article>
            ))}
          </div>

          <div className="library-forum-threads" aria-label="Recent forum threads">
            <div className="library-forum-thread-heading">
              <h3>Recent discussions</h3>
              <span>Preview</span>
            </div>
            {forumThreads.map((thread) => (
              <article key={thread.title}>
                <span>{thread.tag}</span>
                <div>
                  <h4>{thread.title}</h4>
                  <p>
                    {thread.meta} · {thread.replies}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
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
