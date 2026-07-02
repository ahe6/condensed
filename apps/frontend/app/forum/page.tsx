import Link from "next/link";
import { ConsultOverlayHeader } from "../../src/components/ConsultOverlayHeader";

export const metadata = {
  title: "Health Forum | Condensed Health"
};

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

const recentThreads = [
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

const popularPrompts = [
  "What should I test before starting supplements?",
  "Is this result urgent or just worth tracking?",
  "How do I compare at-home kits?",
  "What records should I upload before asking for help?"
] as const;

export default function ForumPage() {
  return (
    <main className="shell overlay-header-page library-page forum-page">
      <ConsultOverlayHeader lineVariant="full" />

      <section className="library-hero forum-hero" aria-labelledby="forum-title">
        <div>
          <p className="eyebrow">Health forum</p>
          <h1 id="forum-title">Ask questions, compare options, and learn from practical discussions.</h1>
          <p>
            A place for non-urgent conversations about testing, results, products, advanced options,
            and what to do next. This is not medical advice or urgent care.
          </p>
        </div>

        <div className="forum-hero-actions">
          <nav className="library-mode-switch" aria-label="Library sections">
            <Link href="/library">Guides</Link>
            <Link aria-current="page" href="/forum">
              Forum
            </Link>
          </nav>
          <Link className="forum-start-link" href="/message-team">
            Start a discussion
          </Link>
        </div>
      </section>

      <section className="forum-layout" aria-label="Forum preview">
        <div className="forum-main-column">
          <section className="library-section" aria-labelledby="forum-categories-title">
            <div className="library-section-heading">
              <div>
                <h2 id="forum-categories-title">Discussion categories</h2>
                <p>Start with the area closest to your question.</p>
              </div>
            </div>
            <div className="forum-category-grid">
              {forumCategories.map((category) => (
                <article className="forum-category-card" key={category.title}>
                  <div>
                    <h3>{category.title}</h3>
                    <p>{category.detail}</p>
                  </div>
                  <span>{category.count}</span>
                </article>
              ))}
            </div>
          </section>

          <section className="library-section" aria-labelledby="forum-recent-title">
            <div className="library-section-heading">
              <div>
                <h2 id="forum-recent-title">Recent discussions</h2>
                <p>Static preview threads for now. Posting and replies can come after moderation is defined.</p>
              </div>
            </div>
            <div className="forum-thread-list">
              {recentThreads.map((thread) => (
                <article key={thread.title}>
                  <span>{thread.tag}</span>
                  <div>
                    <h3>{thread.title}</h3>
                    <p>
                      {thread.meta} · {thread.replies}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="forum-sidebar" aria-label="Forum notes">
          <section>
            <h2>Before posting</h2>
            <p>
              Keep questions practical and non-urgent. Do not share identifying records, private contact details,
              or anything that needs emergency care.
            </p>
          </section>
          <section>
            <h2>Good starter prompts</h2>
            <ul>
              {popularPrompts.map((prompt) => (
                <li key={prompt}>{prompt}</li>
              ))}
            </ul>
          </section>
        </aside>
      </section>
    </main>
  );
}
