"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

const landingVariantGroups = [
  {
    param: "type",
    label: "Typography",
    fallback: "default",
    options: [
      { value: "default", label: "Default" },
      { value: "soft", label: "Soft" },
      { value: "editorial", label: "Editorial" }
    ]
  },
  {
    param: "theme",
    label: "Color",
    fallback: "default",
    options: [
      { value: "default", label: "Default" },
      { value: "clinical", label: "Clinical" },
      { value: "warm", label: "Warm" }
    ]
  },
  {
    param: "hero",
    label: "Hero",
    fallback: "consult-overlay",
    options: [
      { value: "consult-overlay", label: "Consult overlay" },
      { value: "clinician-plan", label: "Clinician plan" },
      { value: "start-review", label: "Start review" },
      { value: "consult-services", label: "Consult services" },
      { value: "consult-explainer", label: "Consult explainer" }
    ]
  },
  {
    param: "trust",
    label: "Trust row",
    fallback: "hidden",
    options: [
      { value: "hidden", label: "Hidden" },
      { value: "inline", label: "Inline" }
    ]
  },
  {
    param: "services",
    label: "Section 1",
    fallback: "cards",
    options: [
      { value: "hidden", label: "Hidden" },
      { value: "cards", label: "Cards" },
      { value: "alternating", label: "Alternating" }
    ]
  },
  {
    param: "review",
    label: "Section 2",
    fallback: "bands",
    options: [
      { value: "hidden", label: "Hidden" },
      { value: "bands", label: "Bands" },
      { value: "grid", label: "Grid" },
      { value: "list", label: "List" }
    ]
  },
  {
    param: "faq",
    label: "FAQ",
    fallback: "accordion",
    options: [
      { value: "hidden", label: "Hidden" },
      { value: "accordion", label: "Accordion" },
      { value: "compact", label: "Compact" },
      { value: "columns", label: "Columns" }
    ]
  }
];

const startReviewVariantGroups = [
  {
    param: "layout",
    label: "Layout",
    fallback: "split",
    options: [
      { value: "split", label: "Split" },
      { value: "report", label: "Report" }
    ]
  }
];

const pageLinks = [
  { href: "/", label: "Landing", value: "landing" },
  { href: "/start-review", label: "Start Review", value: "start-review" },
  { href: "/my-health", label: "My Health", value: "my-health" }
];

export function VariantPreviewSelector() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const activePage =
    pathname === "/" ? "landing" : pathname === "/start-review" ? "start-review" : pathname === "/my-health" ? "my-health" : null;
  const activeGroups =
    activePage === "landing" ? landingVariantGroups : activePage === "start-review" ? startReviewVariantGroups : [];
  const triggerLabel = "Design variants";

  function activeValue(param: string, fallback: string) {
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
            <section className="variant-preview-group">
              <h3>Pages</h3>
              <div className="variant-preview-links">
                {pageLinks.map((link) => (
                  <Link
                    aria-current={activePage === link.value ? "page" : undefined}
                    href={link.href}
                    key={link.href}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </section>

            {activeGroups.map((group) => {
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
