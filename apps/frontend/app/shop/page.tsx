import Link from "next/link";
import { CustomerBrand } from "../../src/components/CustomerBrand";
import { CustomerNav } from "../../src/components/CustomerNav";

const programCards = [
  {
    title: "Weight loss",
    detail: "Start with a guided intake for GLP-1 care, metabolic labs, and next-step recommendations.",
    href: "/goals/weight-loss",
    action: "Start weight intake",
    badge: "Guided care",
    imageClass: "weight"
  },
  {
    title: "Hair loss",
    detail: "Answer a focused intake for thinning, shedding, scalp history, and treatment fit.",
    href: "/goals/hair-loss",
    action: "Start hair intake",
    badge: "Popular",
    imageClass: "hair"
  },
  {
    title: "Skin care",
    detail: "Route acne, texture, redness, and routine goals into the right care path.",
    href: "/goals/skin-care",
    action: "Start skin intake",
    badge: "Routine",
    imageClass: "skin"
  },
  {
    title: "Labs and wellness",
    detail: "Explore lab-driven care paths for metabolic, hormone, thyroid, and baseline health questions.",
    href: "/goals/wellness-labs",
    action: "Explore labs",
    badge: "Data led",
    imageClass: "labs"
  }
];

const supportLinks = [
  {
    title: "Full catalog",
    detail: "Use this when you want the raw product list, direct-purchase items, and assessment-required products together.",
    href: "/catalog",
    action: "Open catalog"
  },
  {
    title: "Checkout",
    detail: "Return to a saved cart or finish payment for direct-purchase items.",
    href: "/cart",
    action: "Open cart"
  },
  {
    title: "Orders",
    detail: "Review payment status, reservation countdowns, fulfillment, and tracking.",
    href: "/orders",
    action: "View orders"
  }
];

export default function ShopPage() {
  return (
    <main className="shell">
      <section className="topbar" aria-label="Shop navigation">
        <CustomerBrand />
        <div className="nav-actions">
          <CustomerNav />
        </div>
      </section>

      <section className="shop-program-hero" aria-label="Shop programs">
        <div>
          <p className="eyebrow">Shop care programs</p>
          <h1>Start with the outcome, not a cart.</h1>
          <p>
            Choose the health goal you care about, answer the right intake, and move toward the
            program or checkout path that fits.
          </p>
        </div>
        <Link className="nav-link primary-link" href="/goals/weight-loss">
          Start Weight Loss
        </Link>
      </section>

      <section className="shop-program-grid" aria-label="Outcome programs">
        {programCards.map((program) => (
          <Link className="shop-program-card" href={program.href} key={program.title}>
            <div className={`shop-program-media ${program.imageClass}`} aria-hidden="true">
              <img src="/home/health-hero.png" alt="" />
              <span>{program.badge}</span>
            </div>
            <div className="shop-program-copy">
              <div>
                <h2>{program.title}</h2>
                <p>{program.detail}</p>
              </div>
              <strong>{program.action}</strong>
            </div>
          </Link>
        ))}
      </section>

      <section className="shop-support-band" aria-label="Commerce utilities">
        <div>
          <p className="eyebrow">Still available</p>
          <h2>Catalog, cart, and orders stay available without leading the care flow.</h2>
        </div>
        <div className="shop-support-grid">
          {supportLinks.map((item) => (
            <Link className="shop-support-link" href={item.href} key={item.title}>
              <span>{item.title}</span>
              <p>{item.detail}</p>
              <strong>{item.action}</strong>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
