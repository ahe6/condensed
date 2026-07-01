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
  }
];

const myHealthVariantGroups = [
  {
    param: "layout",
    label: "Experience",
    fallback: "workspace",
    options: [
      { value: "workspace", label: "Health workspace" },
      { value: "placeholder", label: "Simple placeholder" }
    ]
  },
  {
    param: "state",
    label: "State",
    fallback: "empty",
    options: [
      { value: "empty", label: "Empty" },
      { value: "active", label: "Active" }
    ]
  }
];

const globalVariantGroups = [
  {
    param: "signin",
    label: "Sign in bypass",
    fallback: "preview",
    options: [
      { value: "preview", label: "Bypass" },
      { value: "block", label: "Block" }
    ]
  }
];

const messageTeamVariantGroups = [
  {
    param: "layout",
    label: "Layout",
    fallback: "guided",
    options: [
      { value: "guided", label: "Guided message" }
    ]
  }
];

type VariantPageLink = {
  href: string;
  label: string;
  value: string;
  match?: (pathname: string) => boolean;
};

const experiencePageLinks: VariantPageLink[] = [
  { href: "/", label: "Landing", value: "landing" },
  { href: "/my-health", label: "My Health", value: "my-health" },
  { href: "/message-team", label: "Message Team", value: "message-team" },
  {
    href: "/intake/general-health-check-labs",
    label: "Intake",
    value: "intake",
    match: (pathname) => pathname.startsWith("/intake/")
  },
  {
    href: "/products/general-health-check-labs",
    label: "Product detail",
    value: "product-detail",
    match: (pathname) => pathname.startsWith("/products/")
  },
];

const campaignPageLinks: VariantPageLink[] = [
  { href: "/hair-loss", label: "Hair loss", value: "hair-loss" },
  { href: "/skin-care", label: "Skin care", value: "skin-care" },
  { href: "/weight-loss", label: "Weight loss", value: "weight-loss" },
  { href: "/hormones", label: "Hormones", value: "hormones" },
  { href: "/genetic-testing", label: "Genetic testing", value: "genetic-testing" },
  { href: "/library", label: "Library", value: "library" }
];

const operationalPageLinks: VariantPageLink[] = [
  { href: "/cart", label: "Cart", value: "cart" },
  { href: "/orders", label: "Orders", value: "orders" },
  {
    href: "/orders/CH-10024",
    label: "Order detail",
    value: "order-detail",
    match: (pathname) => pathname.startsWith("/orders/")
  },
  { href: "/account", label: "Account", value: "account" },
  { href: "/admin", label: "Admin", value: "admin" },
  { href: "/auth/confirm", label: "Auth confirm", value: "auth-confirm" },
  { href: "/auth/callback", label: "Auth callback", value: "auth-callback" }
];

const pageGroups = [
  {
    label: "Experience pages",
    links: experiencePageLinks,
    openByDefault: true
  },
  {
    label: "Marketing pages",
    links: campaignPageLinks,
    openByDefault: false
  },
  {
    label: "Operational pages",
    links: operationalPageLinks,
    openByDefault: false
  }
];

const pageLinks = pageGroups.flatMap((group) => group.links);

export function VariantPreviewSelector() {
  const shouldShow =
    process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SHOW_VARIANTS === "true";
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const activePage =
    pageLinks.find((link) => (link.match ? link.match(pathname) : pathname === link.href))?.value ?? null;
  const activeGroups =
    activePage === "landing"
      ? landingVariantGroups
      : activePage === "my-health"
        ? myHealthVariantGroups
        : activePage === "message-team"
          ? messageTeamVariantGroups
          : [];
  const triggerLabel = "Design variants";

  if (!shouldShow) {
    return null;
  }

  function activeValue(param: string, fallback: string) {
    return searchParams.get(param) ?? fallback;
  }

  function hrefFor(param: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(param, value);
    return `${pathname}?${params.toString()}`;
  }

  function hrefForPage(href: string) {
    const params = new URLSearchParams();
    const signInMode = searchParams.get("signin") ?? "preview";

    params.set("signin", signInMode);

    const query = params.toString();
    return query ? `${href}?${query}` : href;
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
              <div className="variant-preview-page-groups">
                {pageGroups.map((group) => {
                  const groupHasActivePage = group.links.some((link) => link.value === activePage);

                  return (
                    <details
                      className="variant-preview-page-group"
                      key={group.label}
                      open={group.openByDefault || groupHasActivePage}
                    >
                      <summary>{group.label}</summary>
                      <div className="variant-preview-links">
                        {group.links.map((link) => (
                          <Link
                            aria-current={activePage === link.value ? "page" : undefined}
                            href={hrefForPage(link.href)}
                            key={link.href}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </details>
                  );
                })}
              </div>
            </section>

            {globalVariantGroups.map((group) => {
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
