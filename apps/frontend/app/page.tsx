"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CustomerBrand } from "../src/components/CustomerBrand";
import { CustomerNav } from "../src/components/CustomerNav";
import { User, getMe } from "../src/lib/api";
import { getSession, isAuthConfigured, startLogin } from "../src/lib/auth";

const outcomes = [
  {
    title: "Daily health basics",
    detail: "Keep routine essentials stocked and easy to reorder.",
    href: "/catalog",
    keywords: ["daily", "routine", "essentials", "vitamins", "basics"],
    action: "Browse basics"
  },
  {
    title: "Sleep and recovery",
    detail: "Find evening-focused products without starting from a wall of SKUs.",
    href: "/catalog",
    keywords: ["sleep", "recovery", "rest", "night", "stress"],
    action: "Explore sleep support"
  },
  {
    title: "Skin and personal care",
    detail: "Compare simple care options with clear product details.",
    href: "/catalog",
    keywords: ["skin", "care", "personal", "clear", "routine"],
    action: "See care options"
  },
  {
    title: "Travel and on-the-go",
    detail: "Build a small kit for keeping your routine steady away from home.",
    href: "/catalog",
    keywords: ["travel", "kit", "work", "commute", "portable"],
    action: "Pack a kit"
  }
];

const suggestions = ["Sleep support", "Daily basics", "Skin support", "Travel kit"];

function matchesQuery(outcome: (typeof outcomes)[number], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const haystack = [outcome.title, outcome.detail, ...outcome.keywords].join(" ").toLowerCase();

  return normalizedQuery
    .split(/\s+/)
    .filter(Boolean)
    .some((term) => haystack.includes(term));
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const visibleOutcomes = useMemo(() => {
    const matches = outcomes.filter((outcome) => matchesQuery(outcome, query));

    return matches.length > 0 ? matches : outcomes;
  }, [query]);

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      if (!isAuthConfigured() || !getSession()) {
        if (isMounted) {
          setAuthChecked(true);
        }
        return;
      }

      try {
        const user = await getMe();

        if (isMounted) {
          setCurrentUser(user);
        }
      } catch {
        if (isMounted) {
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthChecked(true);
        }
      }
    }

    void loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="shell">
      <section className="topbar" aria-label="Shop navigation">
        <CustomerBrand />
        <div className="nav-actions">
          <CustomerNav />
          {authChecked && isAuthConfigured() && !currentUser ? (
            <button className="secondary" type="button" onClick={() => void startLogin()}>
              Sign In
            </button>
          ) : null}
        </div>
      </section>

      <section className="shop-hero outcome-hero" aria-label="Storefront">
        <div className="shop-hero-copy">
          <p className="eyebrow">Guided health essentials</p>
          <h1>Start with what you want support for.</h1>
          <p>
            Search by goal, compare a few focused options, then use the catalog when you want to
            see every product.
          </p>
          <form className="home-search" role="search" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="home-search">Search by goal, need, or routine</label>
            <div className="home-search-box">
              <input
                id="home-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Sleep, daily basics, skin..."
              />
              <Link className="nav-link primary-link" href="/catalog">
                Browse catalog
              </Link>
            </div>
          </form>
          <div className="home-suggestion-row" aria-label="Suggested searches">
            {suggestions.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => setQuery(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <aside className="outcome-hero-panel" aria-label="How it works">
          <span>1</span>
          <strong>Pick a goal</strong>
          <p>Use plain language instead of hunting through product rows.</p>
          <span>2</span>
          <strong>Compare options</strong>
          <p>Open the full catalog when you are ready for price, variant, and stock details.</p>
        </aside>
      </section>

      <section className="home-section" aria-label="Care goals">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Care goals</p>
            <h2>
              {query
                ? `Options related to "${query}"`
                : "Choose the kind of support you are looking for."}
            </h2>
          </div>
          <Link className="nav-link" href="/catalog">
            View all products
          </Link>
        </div>

        <div className="outcome-grid">
          {visibleOutcomes.map((outcome) => (
            <article className="outcome-card" key={outcome.title}>
              <div>
                <h3>{outcome.title}</h3>
                <p>{outcome.detail}</p>
              </div>
              <Link href={outcome.href}>{outcome.action}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="home-band" aria-label="Checkout promise">
        <div>
          <p className="eyebrow">Checkout stays direct</p>
          <h2>When you know what you want, buying should feel like normal ecommerce.</h2>
        </div>
        <div className="home-band-actions">
          <Link className="nav-link primary-link" href="/catalog">
            Browse catalog
          </Link>
          <Link className="nav-link" href="/cart">
            View cart
          </Link>
        </div>
      </section>
    </main>
  );
}
