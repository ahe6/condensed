"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
const links = [
  {
    href: "/my-health",
    label: "My Health",
    match: (pathname: string) =>
      pathname === "/my-health" ||
      pathname === "/account" ||
      pathname === "/addresses" ||
      pathname.startsWith("/orders")
  }
];

const utilityLinks = [
  { href: "/shop", label: "Products" },
  { href: "/catalog", label: "Full catalog" },
  { href: "/cart", label: "Cart" },
  { href: "/my-health", label: "Sign In" }
];

type CustomerNavProps = {
  cartItemCount?: number;
};

export function CustomerNav({ cartItemCount }: CustomerNavProps) {
  const pathname = usePathname();
  void cartItemCount;

  return (
    <nav className="customer-nav customer-nav-layered" aria-label="Customer navigation">
      {links.map((link) => (
        <Link
          key={link.href}
          className={link.match(pathname) ? "customer-nav-link active" : "customer-nav-link"}
          href={link.href}
        >
          <span>{link.label}</span>
        </Link>
      ))}
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
