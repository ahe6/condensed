"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

const variantGroups = [
  {
    param: "hero",
    label: "Hero",
    fallback: "centered-viewer",
    options: [
      { value: "centered-viewer", label: "Interactive report" }
    ]
  },
  {
    param: "labs",
    label: "Section 1",
    fallback: "bands",
    options: [
      { value: "hidden", label: "Hidden" },
      { value: "bands", label: "Bands" },
      { value: "grid", label: "Grid" },
      { value: "list", label: "List" }
    ]
  },
  {
    param: "report",
    label: "Section 2",
    fallback: "hidden",
    options: [
      { value: "hidden", label: "Hidden" },
      { value: "viewer", label: "Viewer" },
      { value: "toc", label: "Contents" },
      { value: "spread", label: "Spread" },
      { value: "explorer", label: "Explorer" }
    ]
  },
  {
    param: "faq",
    label: "FAQ",
    fallback: "accordion",
    options: [
      { value: "accordion", label: "Accordion" },
      { value: "compact", label: "Compact" },
      { value: "columns", label: "Columns" }
    ]
  }
];

export function VariantPreviewSelector() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const rawHero = searchParams.get("hero") ?? variantGroups[0].fallback;
  const activeHero = rawHero === "centered-viewer" ? rawHero : variantGroups[0].fallback;
  const triggerLabel = "Section variants";

  function activeValue(param: string, fallback: string) {
    if (param === "hero") {
      return activeHero;
    }

    return searchParams.get(param) ?? fallback;
  }

  function hrefFor(param: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(param, value);
    return `${pathname}?${params.toString()}`;
  }

  return (
    <div className="variant-preview-nav">
      {isOpen ? (
        <nav className="variant-preview-panel" aria-label="Design variant previews">
          <div className="variant-preview-heading">
            <span>Design variants</span>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Close variant selector">
              ×
            </button>
          </div>

          <div className="variant-preview-groups">
            {variantGroups.map((group) => {
              const selectedValue = activeValue(group.param, group.fallback);

              return (
                <section className="variant-preview-group" key={group.param}>
                  <h3>{group.label}</h3>
                  <div className="variant-preview-links">
                    {group.options.map((option) => (
                      <Link
                        aria-current={selectedValue === option.value ? "page" : undefined}
                        href={hrefFor(group.param, option.value)}
                        key={option.value}
                      >
                        {option.label}
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </nav>
      ) : null}

      <button
        aria-expanded={isOpen}
        className="variant-preview-trigger"
        type="button"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span aria-hidden="true">V</span>
        <strong>{triggerLabel}</strong>
      </button>
    </div>
  );
}
