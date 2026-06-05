"use client";

import { useMemo, useState } from "react";

const outcomes = [
  {
    title: "Daily health basics",
    detail: "Simple, recurring essentials for staying stocked without overthinking it.",
    keywords: ["daily", "routine", "essentials", "vitamins", "basics"],
    action: "Build a routine"
  },
  {
    title: "Sleep and recovery",
    detail: "Low-friction support for winding down, restocking, and tracking your order.",
    keywords: ["sleep", "recovery", "rest", "night", "stress"],
    action: "Explore night support"
  },
  {
    title: "Skin and personal care",
    detail: "Focused products for repeatable care, clear instructions, and easy reorders.",
    keywords: ["skin", "care", "personal", "clear", "routine"],
    action: "See care options"
  },
  {
    title: "Travel and on-the-go",
    detail: "Compact essentials for keeping the same routine when your week gets messy.",
    keywords: ["travel", "kit", "work", "commute", "portable"],
    action: "Pack a kit"
  }
];

const products = [
  {
    name: "Daily Foundation",
    detail: "A lightweight starter set for everyday care.",
    price: "$28",
    image: "/style-lab/daily-mug.png",
    color: "sage",
    keywords: ["daily", "routine", "essentials", "starter", "basics"]
  },
  {
    name: "Night Reset",
    detail: "A calm evening routine in one restockable kit.",
    price: "$34",
    image: "/style-lab/notebook-set.png",
    color: "blue",
    keywords: ["sleep", "night", "recovery", "rest", "stress"]
  },
  {
    name: "Care Carry Kit",
    detail: "Compact personal-care essentials for travel days.",
    price: "$32",
    image: "/style-lab/cable-kit.png",
    color: "coral",
    keywords: ["travel", "kit", "portable", "care", "commute"]
  }
];

const suggestions = [
  "Sleep support",
  "I need daily basics",
  "Skin support",
  "Travel kit"
];

function matchesQuery(item: { title?: string; name?: string; detail: string; keywords: string[] }, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const haystack = [item.title, item.name, item.detail, ...item.keywords].filter(Boolean).join(" ").toLowerCase();

  return normalizedQuery
    .split(/\s+/)
    .filter(Boolean)
    .some((term) => haystack.includes(term));
}

export default function StyleLabPage() {
  const [query, setQuery] = useState("");

  const matchedOutcomes = useMemo(
    () => outcomes.filter((outcome) => matchesQuery(outcome, query)),
    [query]
  );
  const matchedProducts = useMemo(
    () => products.filter((product) => matchesQuery(product, query)),
    [query]
  );
  const visibleOutcomes = matchedOutcomes.length > 0 ? matchedOutcomes : outcomes;
  const visibleProducts = matchedProducts.length > 0 ? matchedProducts : products;

  return (
    <main className="style-lab-shell">
      <section className="style-lab-hero" aria-label="Storefront concept">
        <div className="style-lab-hero-brand" aria-label="Storefront brand">
          <strong>health</strong>
          <span>Care essentials / simple restock</span>
        </div>

        <div className="style-lab-hero-copy">
          <p className="style-lab-eyebrow">Personal care, guided gently</p>
          <h1>Start with what you want support for.</h1>
          <p>
            Browse by goal, compare a few focused options, and keep checkout simple once you know
            what fits your routine.
          </p>

          <form className="style-lab-search" role="search" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="style-lab-search">Search by goal, need, or routine</label>
            <div className="style-lab-search-box">
              <input
                id="style-lab-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Sleep, daily basics, skin..."
              />
              <a className="style-lab-button primary" href="#matches">
                Find options
              </a>
            </div>
          </form>

          <div className="style-lab-suggestion-row" aria-label="Suggested searches">
            {suggestions.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => setQuery(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div className="style-lab-hero-proof" aria-label="Storefront promises">
          <span>guided by goal</span>
          <span>clear pricing</span>
          <span>tracked delivery</span>
        </div>
      </section>

      <section className="style-lab-section" id="matches" aria-label="Matched care goals">
        <div className="style-lab-section-heading">
          <p className="style-lab-eyebrow">Start with the outcome</p>
          <h2>{query ? `Options related to "${query}"` : "Choose the kind of support you are looking for."}</h2>
        </div>

        <div className="style-lab-outcome-grid">
          {visibleOutcomes.map((outcome) => (
            <article className="style-lab-outcome-card" key={outcome.title}>
              <span>{outcome.title}</span>
              <p>{outcome.detail}</p>
              <a href="#products">{outcome.action}</a>
            </article>
          ))}
        </div>
      </section>

      <section className="style-lab-product-section" id="products" aria-label="Product card concepts">
        <div className="style-lab-section-heading">
          <p className="style-lab-eyebrow">Then compare products</p>
          <h2>Focused options once you know where you want to start.</h2>
        </div>
        <div className="style-lab-product-grid">
          {visibleProducts.map((product) => (
            <article className="style-lab-product-card" key={product.name}>
              <div className={`style-lab-product-art style-lab-product-${product.color}`}>
                <img src={product.image} alt={`${product.name} mock product`} />
              </div>
              <div className="style-lab-product-card-body">
                <div>
                  <h3>{product.name}</h3>
                  <p>{product.detail}</p>
                </div>
                <div className="style-lab-product-buy">
                  <strong>{product.price}</strong>
                  <button type="button">Add</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="style-lab-detail-band">
        <section className="style-lab-detail" id="detail" aria-label="Product detail concept">
          <div className="style-lab-detail-art">
            <img src="/style-lab/daily-mug.png" alt="Daily Foundation mock product detail" />
          </div>
          <article>
            <p className="style-lab-eyebrow">Recommended starting point</p>
            <h2>Daily Foundation</h2>
            <p>
              A small, repeatable care routine with clear reorder timing, simple checkout, and
              account-based order tracking.
            </p>
            <div className="style-lab-pills">
              <span>simple routine</span>
              <span>easy reorder</span>
              <span>tracked delivery</span>
            </div>
            <label>
              <span>option</span>
              <select defaultValue="starter">
                <option value="starter">Starter Kit - $28</option>
                <option value="refill">Monthly Refill - $22</option>
              </select>
            </label>
            <div className="style-lab-detail-buy">
              <div>
                <strong>$28</strong>
                <span>Ships from current inventory</span>
              </div>
              <button type="button">Add to cart</button>
            </div>
          </article>
        </section>
      </div>

      <div className="style-lab-cart-band">
        <section className="style-lab-cart" id="cart" aria-label="Cart concept">
          <div>
            <p className="style-lab-eyebrow">Checkout stays direct</p>
            <h2>Review, pay, and track your order without extra steps.</h2>
          </div>
          <div className="style-lab-cart-summary">
            <article>
              <span>items</span>
              <strong>2</strong>
            </article>
            <article>
              <span>total</span>
              <strong>$50</strong>
            </article>
            <button type="button">Continue</button>
          </div>
        </section>
      </div>
    </main>
  );
}
