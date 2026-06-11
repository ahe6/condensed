"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Product, getReadiness, listProducts } from "../lib/api";
import { formatMoney } from "../lib/format";
import { isAssessmentProduct } from "../lib/productDisplay";

const diagnosticGroupLabels: Record<string, string> = {
  "lab-core-health": "Core Health",
  "lab-metabolic-heart": "Metabolic & Heart",
  "lab-hormones-thyroid": "Hormones & Thyroid",
  "lab-sexual-infectious": "Sexual & Infectious",
  "lab-allergy-immune": "Allergy & Immune",
  "lab-nutrition-deficiency": "Nutrition",
  "lab-digestive-urinary": "Digestive & Urinary",
  "lab-toxicology-environmental": "Toxicology",
  "lab-cancer-screening": "Screening",
  "lab-fitness-services": "Fitness",
  "imaging-ct": "CT",
  "imaging-mri": "MRI",
  "imaging-ultrasound": "Ultrasound",
  "imaging-dexa": "DEXA",
  "imaging-xray": "X-ray",
  "imaging-breast": "Breast Imaging"
};

function getDiagnosticGroup(product: Product) {
  return (
    product.categories.find(
      ({ category }) => category.slug.startsWith("lab-") || category.slug.startsWith("imaging-")
    )?.category ?? null
  );
}

function getQuestSource(description: string | null) {
  return description?.match(/Source: (https:\/\/www\.questhealth\.com\/product\/\S+)/)?.[1] ?? null;
}

export function LabsCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadLabs() {
      try {
        await getReadiness();
        const nextProducts = await listProducts();

        if (!isMounted) {
          return;
        }

        setProducts(
          nextProducts.filter((product) =>
            product.categories.some(({ category }) => category.slug === "labs" || category.slug === "imaging")
          )
        );
        setError(null);
      } catch (caught) {
        if (isMounted) {
          setError(caught instanceof Error ? caught.message : "Unable to load labs");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadLabs();

    return () => {
      isMounted = false;
    };
  }, []);

  const groups = useMemo(() => {
    const nextGroups = new Map<string, { slug: string; label: string; count: number }>();

    for (const product of products) {
      const group = getDiagnosticGroup(product);

      if (!group) {
        continue;
      }

      const current = nextGroups.get(group.slug);
      nextGroups.set(group.slug, {
        slug: group.slug,
        label: diagnosticGroupLabels[group.slug] ?? group.name,
        count: (current?.count ?? 0) + 1
      });
    }

    return Array.from(nextGroups.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [products]);

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products
      .filter((product) => {
        const group = getDiagnosticGroup(product);
        const matchesGroup = selectedGroup === "all" || group?.slug === selectedGroup;
        const matchesQuery =
          normalizedQuery.length === 0 ||
          product.name.toLowerCase().includes(normalizedQuery) ||
          product.description?.toLowerCase().includes(normalizedQuery);

        return matchesGroup && matchesQuery;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, query, selectedGroup]);

  return (
    <section className="labs-catalog-section" aria-label="Lab catalog">
      <div className="labs-catalog-heading">
        <div>
          <p className="eyebrow">Diagnostics catalog</p>
          <h2>Browse current lab and imaging options.</h2>
          <p>
            Seeded from the Quest Health lab catalog plus initial imaging request paths so we can
            design the Labs & Diagnostics page against real inventory and realistic review workflows.
          </p>
        </div>
        <span>{products.length} options</span>
      </div>

      <div className="labs-catalog-tools">
        <label className="labs-catalog-search">
          <span>Search diagnostics</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search A1c, thyroid, CBC, CT, MRI, DEXA..."
          />
        </label>

        <div className="labs-filter-row" aria-label="Diagnostic groups">
          <button
            type="button"
            className={selectedGroup === "all" ? "active" : ""}
            onClick={() => setSelectedGroup("all")}
          >
            All
          </button>
          {groups.map((group) => (
            <button
              key={group.slug}
              type="button"
              className={selectedGroup === group.slug ? "active" : ""}
              onClick={() => setSelectedGroup(group.slug)}
            >
              {group.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <div className="empty-state">Loading diagnostics...</div> : null}
      {error ? <div className="empty-state">Diagnostics are unavailable: {error}</div> : null}

      {!isLoading && !error ? (
        <div className="labs-product-grid">
          {visibleProducts.length === 0 ? (
            <div className="empty-state">No diagnostics match this filter.</div>
          ) : (
            visibleProducts.map((product) => {
              const variant = product.variants[0];
              const group = getDiagnosticGroup(product);
              const sourceUrl = getQuestSource(product.description);
              const requiresAssessment = isAssessmentProduct(product);

              return (
                <article className="labs-product-card" key={product.id}>
                  <div>
                    <span>{group ? diagnosticGroupLabels[group.slug] ?? group.name : "Diagnostic"}</span>
                    <h3>{product.name}</h3>
                  </div>
                  <div className="labs-product-meta">
                    {requiresAssessment ? (
                      <strong>Review first</strong>
                    ) : variant ? (
                      <strong>{formatMoney(variant.price, variant.currency)}</strong>
                    ) : null}
                    {sourceUrl ? (
                      <a href={sourceUrl} target="_blank" rel="noreferrer">
                        Quest source
                      </a>
                    ) : null}
                  </div>
                  <Link className="nav-link" href={`/products/${product.slug}`}>
                    {requiresAssessment ? "Start review" : "View details"}
                  </Link>
                </article>
              );
            })
          )}
        </div>
      ) : null}
    </section>
  );
}
