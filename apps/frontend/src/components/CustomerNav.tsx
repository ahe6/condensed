"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/cart", label: "Cart", match: (pathname: string) => pathname === "/cart" },
  { href: "/orders", label: "Orders", match: (pathname: string) => pathname.startsWith("/orders") },
  {
    href: "/account",
    label: "Account",
    match: (pathname: string) => pathname === "/account" || pathname === "/addresses"
  }
];

export function CustomerNav() {
  const pathname = usePathname();

  return (
    <nav className="customer-nav" aria-label="Customer navigation">
      {links.map((link) => (
        <Link
          key={link.href}
          className={link.match(pathname) ? "customer-nav-link active" : "customer-nav-link"}
          href={link.href}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
