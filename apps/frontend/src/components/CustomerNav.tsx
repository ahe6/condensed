"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const utilityLinks = [
  { href: "/cart", label: "Cart" },
  { href: "/my-health", label: "Sign In" }
];

type CustomerNavProps = {
  cartItemCount?: number;
  secondaryHref?: string;
  secondaryLabel?: string;
  primaryHref?: string;
  primaryLabel?: string;
};

export function CustomerNav({
  cartItemCount,
  secondaryHref,
  secondaryLabel,
  primaryHref = "/my-health",
  primaryLabel = "My Health"
}: CustomerNavProps) {
  const pathname = usePathname();
  void cartItemCount;
  const secondaryIsActive = Boolean(secondaryHref) && pathname === secondaryHref;
  const primaryIsActive =
    pathname === primaryHref ||
    (primaryHref === "/my-health" &&
      (pathname === "/account" || pathname === "/addresses" || pathname.startsWith("/orders")));

  return (
    <nav className="customer-nav customer-nav-layered" aria-label="Customer navigation">
      {secondaryHref && secondaryLabel ? (
        <Link
          className={secondaryIsActive ? "customer-nav-link customer-nav-secondary active" : "customer-nav-link customer-nav-secondary"}
          href={secondaryHref}
        >
          <span>{secondaryLabel}</span>
        </Link>
      ) : null}
      <Link className={primaryIsActive ? "customer-nav-link active" : "customer-nav-link"} href={primaryHref}>
        <span>{primaryLabel}</span>
      </Link>
      <details className="customer-menu">
        <summary className="customer-menu-toggle" aria-label="Open customer menu" title="Menu">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </summary>
        <div className="customer-menu-panel">
          {utilityLinks.map((link) => (
            <Link className="customer-menu-item" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
      </details>
    </nav>
  );
}
