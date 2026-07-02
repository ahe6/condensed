import Link from "next/link";
import { ConsultOverlayHeader } from "../../src/components/ConsultOverlayHeader";
import { LibraryFeaturedGuides } from "./LibraryFeaturedGuides";

export const metadata = {
  title: "Health Library | Condensed Health"
};

const libraryAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const topicCollections = [
  {
    title: "Testing guides",
    detail: "Lab panels, genetics, at-home kits, timing, and how to compare options.",
    links: ["General lab panels", "Genetic testing", "At-home testing"]
  },
  {
    title: "Results guides",
    detail: "Bloodwork, hormone reports, genetic results, and questions to ask after a review.",
    links: ["Bloodwork basics", "Hormone results", "Follow-up questions"]
  },
  {
    title: "Wellness guides",
    detail: "Supplements, skin care, hair support, and daily routines connected to health goals.",
    links: ["Supplement routines", "Skin care", "Hair support"]
  },
  {
    title: "Advanced health guides",
    detail: "How to ask better questions about regenerative, peptide, IV, and microbiome options.",
    links: ["PRP questions", "Peptide review", "Microbiome therapies"]
  }
] as const;

const latestGuides = [
  "Questions to ask before ordering a test",
  "How to prepare records for review",
  "What makes a result worth repeating",
  "How to compare wellness products without overbuying"
] as const;

const libraryQuestions = [
  {
    question: "I have fatigue and older bloodwork. Should I test again or upload what I have first?",
    answer:
      "The team would usually start by reviewing the existing report dates, abnormal markers, symptoms, and missing labs before suggesting whether repeat testing makes sense."
  },
  {
    question: "My thyroid result is borderline. What should I ask next?",
    answer:
      "A useful next step is grouping the value with symptoms, medications, prior thyroid results, and related markers so the follow-up question is more specific."
  },
  {
    question: "I want supplements but do not know what is worth buying.",
    answer:
      "The team can help separate product questions from testing questions, especially when symptoms, diet, medications, or recent labs might change what is reasonable."
  },
  {
    question: "I am not sure if this is a testing question or a clinician question.",
    answer:
      "That is a good reason to start with a plain-language message. The team can help route it toward records review, testing options, products, or care follow-up."
  }
] as const;

type LibrarySectionVariant = "current" | "hidden";
type LibraryTopicsVariant = "directory" | "rows" | "matrix" | "current" | "hidden";
type LibraryQaVariant = "feed" | "spotlight" | "rows" | "hidden";
type LibrarySearchParams = Record<string, string | string[] | undefined>;

const librarySectionVariantValues = ["current", "hidden"] as const;
const libraryTopicsVariantValues = ["directory", "rows", "matrix", "current", "hidden"] as const;
const libraryQaVariantValues = ["feed", "spotlight", "rows", "hidden"] as const;

function getSearchParamValue(searchParams: LibrarySearchParams, key: string): string | null {
  const value = searchParams[key];

  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

function pickLibrarySectionVariant(value: string | null, fallback: LibrarySectionVariant): LibrarySectionVariant {
  return librarySectionVariantValues.includes(value as LibrarySectionVariant)
    ? (value as LibrarySectionVariant)
    : fallback;
}

function pickLibraryTopicsVariant(value: string | null, fallback: LibraryTopicsVariant): LibraryTopicsVariant {
  return libraryTopicsVariantValues.includes(value as LibraryTopicsVariant)
    ? (value as LibraryTopicsVariant)
    : fallback;
}

function pickLibraryQaVariant(value: string | null, fallback: LibraryQaVariant): LibraryQaVariant {
  return libraryQaVariantValues.includes(value as LibraryQaVariant) ? (value as LibraryQaVariant) : fallback;
}

export default async function LibraryPage({
  searchParams
}: {
  searchParams?: Promise<LibrarySearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const featuredVariant = pickLibrarySectionVariant(getSearchParamValue(resolvedSearchParams, "featured"), "current");
  const topicsVariant = pickLibraryTopicsVariant(getSearchParamValue(resolvedSearchParams, "topics"), "directory");
  const latestVariant = pickLibrarySectionVariant(getSearchParamValue(resolvedSearchParams, "latest"), "hidden");
  const qaVariant = pickLibraryQaVariant(getSearchParamValue(resolvedSearchParams, "qa"), "hidden");

  return (
    <main className="shell overlay-header-page library-page">
      <ConsultOverlayHeader lineVariant="full" />

      <section className="library-hero" aria-labelledby="library-title">
        <div className="library-hero-main">
          <div className="library-hero-copy">
            <h1 id="library-title">Practical guides for your health</h1>
            <p>Plain-language explainers for testing, results, wellness, and next steps.</p>
          </div>
          <section className="library-discovery" aria-label="Find library guides">
            <label className="library-search">
              <span>Search guides</span>
              <input type="search" placeholder="Search guides by topic or question..." />
            </label>
            <details className="library-alpha-mobile">
              <summary>Search by first letter</summary>
              <div className="library-alpha-row">
                {libraryAlphabet.map((letter) => (
                  <Link href={`/library?letter=${letter}`} key={letter}>
                    {letter}
                  </Link>
                ))}
              </div>
            </details>
          </section>
        </div>
        <div className="library-alpha-browser library-alpha-browser-desktop" aria-label="Search guides by first letter">
          <span>Search by first letter</span>
          <div className="library-alpha-row">
            {libraryAlphabet.map((letter) => (
              <Link href={`/library?letter=${letter}`} key={letter}>
                {letter}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {featuredVariant === "current" ? <LibraryFeaturedGuides /> : null}

      {topicsVariant !== "hidden" ? (
        <section className="library-section" aria-labelledby="library-topics-title">
          <div className="library-section-heading">
            <div>
              <h2 id="library-topics-title">Browse by topic</h2>
              <p>Use the library as a reference layer before you message our team or save records.</p>
            </div>
          </div>
          {topicsVariant === "current" ? (
            <div className="library-topic-grid">
              {topicCollections.map((collection) => (
                <article className="library-topic-card" key={collection.title}>
                  <h3>{collection.title}</h3>
                  <p>{collection.detail}</p>
                  <ul>
                    {collection.links.map((link) => (
                      <li key={link}>{link}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          ) : null}
          {topicsVariant === "directory" ? (
            <div className="library-topic-directory">
              {topicCollections.map((collection) => (
                <section key={collection.title}>
                  <h3>{collection.title}</h3>
                  <p>{collection.detail}</p>
                  <div>
                    {collection.links.map((link) => (
                      <Link href={`/library?topic=${encodeURIComponent(link)}`} key={link}>
                        {link}
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : null}
          {topicsVariant === "rows" ? (
            <div className="library-topic-rows">
              {topicCollections.map((collection) => (
                <article key={collection.title}>
                  <div>
                    <h3>{collection.title}</h3>
                    <p>{collection.detail}</p>
                  </div>
                  <div>
                    {collection.links.map((link) => (
                      <Link href={`/library?topic=${encodeURIComponent(link)}`} key={link}>
                        {link}
                      </Link>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : null}
          {topicsVariant === "matrix" ? (
            <div className="library-topic-matrix">
              {topicCollections.map((collection) => (
                <section key={collection.title}>
                  <h3>{collection.title}</h3>
                  {collection.links.map((link) => (
                    <Link href={`/library?topic=${encodeURIComponent(link)}`} key={link}>
                      {link}
                    </Link>
                  ))}
                </section>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {latestVariant === "current" ? (
        <section className="library-section library-latest-section" aria-labelledby="library-latest-title">
          <div className="library-section-heading">
            <div>
              <h2 id="library-latest-title">Latest guides</h2>
              <p>Placeholder titles for the first SEO-focused articles.</p>
            </div>
          </div>
          <div className="library-latest-list">
            {latestGuides.map((guide) => (
              <article key={guide}>
                <h3>{guide}</h3>
                <p>Short practical guidance will live here as the library grows.</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {qaVariant !== "hidden" ? (
        <section className="library-section library-qa-section" aria-labelledby="library-qa-title">
          <div className="library-section-heading">
            <div>
              <h2 id="library-qa-title">Questions from people like you</h2>
              <p>Example exchanges showing how people ask the team about testing, results, products, and next steps.</p>
            </div>
            <Link href="/qa">View Q&A</Link>
          </div>
          {qaVariant === "feed" ? (
            <div className="library-qa-feed">
              {libraryQuestions.map((item) => (
                <article key={item.question}>
                  <span>Question</span>
                  <div>
                    <h3>{item.question}</h3>
                    <p>{item.answer}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
          {qaVariant === "spotlight" ? (
            <div className="library-qa-spotlight">
              <article>
                <span>Featured question</span>
                <h3>{libraryQuestions[0].question}</h3>
                <p>{libraryQuestions[0].answer}</p>
              </article>
              <div>
                {libraryQuestions.slice(1).map((item) => (
                  <Link href="/qa" key={item.question}>
                    {item.question}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
          {qaVariant === "rows" ? (
            <div className="library-qa-rows">
              {libraryQuestions.map((item) => (
                <article key={item.question}>
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
