"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { topicNavLinks } from "../lib/topicPages";
import { CustomerBrand } from "./CustomerBrand";

const footerSections = [
  {
    title: "Explore",
    links: topicNavLinks
  },
  {
    title: "Account",
    links: [
      { label: "My Health", href: "/my-health" },
      { label: "Orders", href: "/orders" },
      { label: "Account", href: "/account" },
      { label: "Cart", href: "/cart" }
    ]
  },
  {
    title: "Learn",
    links: [
      { label: "Library", href: "/library" },
      { label: "Q&A", href: "/qa" },
      { label: "Genetics", href: "/genetic-testing" }
    ]
  }
];

export function SiteFooter() {
  const pathname = usePathname();

  if (pathname === "/my-health") {
    return null;
  }

  return (
    <footer className="site-footer" aria-label="Site footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <CustomerBrand />
        </div>

        <nav className="site-footer-links" aria-label="Footer navigation">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h2>{section.title}</h2>
              <ul>
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="site-footer-bottom">
          <span>© {new Date().getFullYear()} Condensed Health</span>
        </div>
      </div>
    </footer>
  );
}
