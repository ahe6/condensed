"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CustomerBrand } from "../../../src/components/CustomerBrand";
import { CustomerNav } from "../../../src/components/CustomerNav";
import { Product, getProduct, getReadiness } from "../../../src/lib/api";
import { isAssessmentProduct } from "../../../src/lib/productDisplay";

export default function IntakePage() {
  const params = useParams<{ slug: string }>();
  const slug = decodeURIComponent(params.slug);
  const [product, setProduct] = useState<Product | null>(null);
  const [goal, setGoal] = useState("Explore options");
  const [history, setHistory] = useState("New to this");
  const [preference, setPreference] = useState("Online follow-up");
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        await getReadiness();
        const nextProduct = await getProduct(slug);

        if (isMounted) {
          setProduct(nextProduct);
        }
      } catch (caught) {
        if (isMounted) {
          setError(caught instanceof Error ? caught.message : "Program not found");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const isProgram = product ? isAssessmentProduct(product) : false;

  return (
    <main className="shell narrow-shell">
      <section className="topbar" aria-label="Assessment navigation">
        <CustomerBrand />
        <CustomerNav />
      </section>

      {error ? <p className="error global-error">{error}</p> : null}

      {isLoading ? <section className="panel empty-state">Loading assessment</section> : null}

      {!isLoading && product && !isProgram ? (
        <section className="panel intake-panel">
          <p className="eyebrow">Direct purchase</p>
          <h1>{product.name}</h1>
          <p>This item can be purchased directly from the product page.</p>
          <Link className="nav-link primary-link" href={`/products/${product.slug}`}>
            View Product
          </Link>
        </section>
      ) : null}

      {!isLoading && product && isProgram ? (
        <section className="panel intake-panel" aria-label={`${product.name} assessment`}>
          <div className="intake-heading">
            <p className="eyebrow">Assessment</p>
            <h1>{product.name}</h1>
            {product.description ? <p>{product.description}</p> : null}
          </div>

          <form className="intake-form" onSubmit={(event) => event.preventDefault()}>
            <label>
              <span>Main goal</span>
              <select value={goal} onChange={(event) => setGoal(event.target.value)}>
                <option>Explore options</option>
                <option>Compare plans</option>
                <option>Start as soon as possible</option>
              </select>
            </label>

            <label>
              <span>Prior experience</span>
              <select value={history} onChange={(event) => setHistory(event.target.value)}>
                <option>New to this</option>
                <option>Used similar support before</option>
                <option>Currently using a routine</option>
              </select>
            </label>

            <label>
              <span>Preferred next step</span>
              <select value={preference} onChange={(event) => setPreference(event.target.value)}>
                <option>Online follow-up</option>
                <option>Review plan details</option>
                <option>Talk to support first</option>
              </select>
            </label>

            <button type="button" onClick={() => setIsComplete(true)}>
              Review Next Steps
            </button>
          </form>

          {isComplete ? (
            <div className="success intake-next-step">
              <strong>Next step</strong>
              <p>
                We have the basics for {goal.toLowerCase()} with {preference.toLowerCase()}.
                Checkout should stay locked until this flow is connected to review.
              </p>
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
