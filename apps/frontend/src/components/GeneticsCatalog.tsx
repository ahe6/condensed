"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Product, getReadiness, listProducts } from "../lib/api";
import { isAssessmentProduct } from "../lib/productDisplay";

const geneticsGroupLabels: Record<string, string> = {
  "genetic-wgs": "WGS",
  "genetic-wes": "Exome",
  "genetic-panels": "Panels",
  "genetic-carrier": "Carrier",
  "genetic-pharmacogenomics": "Pharmacogenomics",
  "genetic-cancer-risk": "Cancer Risk",
  "genetic-cardiovascular": "Cardiovascular",
  "genetic-chromosomal": "Chromosomal",
  "genetic-familial-variant": "Familial Variant",
  "genetic-mitochondrial": "Mitochondrial",
  "genetic-traits": "Traits & Wellness"
};

function getGeneticsGroup(product: Product) {
  return product.categories.find(({ category }) => category.slug.startsWith("genetic-"))?.category ?? null;
}

export function GeneticsCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadGenetics() {
      try {
        await getReadiness();
        const nextProducts = await listProducts();

        if (!isMounted) {
          return;
        }

        setProducts(
          nextProducts.filter((product) =>
            product.categories.some(({ category }) => category.slug === "genetics")
          )
        );
        setError(null);
      } catch (caught) {
        if (isMounted) {
          setError(caught instanceof Error ? caught.message : "Unable to load genetics");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadGenetics();

    return () => {
      isMounted = false;
    };
  }, []);

  const groups = useMemo(() => {
    const nextGroups = new Map<string, { slug: string; label: string; count: number }>();

    for (const product of products) {
      const group = getGeneticsGroup(product);

      if (!group) {
        continue;
      }

      const current = nextGroups.get(group.slug);
      nextGroups.set(group.slug, {
        slug: group.slug,
        label: geneticsGroupLabels[group.slug] ?? group.name,
        count: (current?.count ?? 0) + 1
      });
    }

    return Array.from(nextGroups.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [products]);

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products
      .filter((product) => {
        const group = getGeneticsGroup(product);
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
    <section className="labs-catalog-section" aria-label="Genetics catalog">
      <div className="labs-catalog-heading">
        <div>
          <p className="eyebrow">Genetics catalog</p>
          <h2>Compare genetics review paths.</h2>
          <p>
            Whole genome sequencing, exome sequencing, focused panels, carrier screening, and
            pharmacogenomics need context before ordering. Start with the kind of question you are
            trying to answer.
          </p>
        </div>
        <span>{products.length} options</span>
      </div>

      <div className="labs-catalog-tools">
        <label className="labs-catalog-search">
          <span>Search genetics</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search WGS, exome, carrier, BRCA, pharmacogenomics..."
          />
        </label>

        <div className="labs-filter-row" aria-label="Genetics groups">
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

      {isLoading ? <div className="empty-state">Loading genetics...</div> : null}
      {error ? <div className="empty-state">Genetics are unavailable: {error}</div> : null}

      {!isLoading && !error ? (
        <div className="labs-product-grid">
          {visibleProducts.length === 0 ? (
            <div className="empty-state">No genetics options match this filter.</div>
          ) : (
            visibleProducts.map((product) => {
              const group = getGeneticsGroup(product);
              const requiresAssessment = isAssessmentProduct(product);

              return (
                <article className="labs-product-card" key={product.id}>
                  <div>
                    <span>{group ? geneticsGroupLabels[group.slug] ?? group.name : "Genetics"}</span>
                    <h3>{product.name}</h3>
                  </div>
                  <div className="labs-product-meta">
                    <strong>{requiresAssessment ? "Review first" : "Available"}</strong>
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
