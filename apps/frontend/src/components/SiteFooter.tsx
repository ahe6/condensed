import Link from "next/link";
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
      { label: "Labs & Diagnostics", href: "/labs" },
      { label: "Genetics", href: "/genetics" },
      { label: "Health Areas", href: "/health-areas" }
    ]
  }
];

export function SiteFooter() {
  return (
    <footer className="site-footer" aria-labelledby="site-footer-title">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <CustomerBrand />
          <p id="site-footer-title">
            Condensed Health helps organize symptoms, lab results, testing options, and follow-up
            questions in one place.
          </p>
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
          <p>
            Condensed Health does not replace emergency care or a clinician’s diagnosis. For urgent
            symptoms, seek medical care directly.
          </p>
          <span>© {new Date().getFullYear()} Condensed Health</span>
        </div>
      </div>
    </footer>
  );
}
