"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CustomerBrand } from "./CustomerBrand";

export type TopBarLineVariant = "gutter" | "full";

const consultOverlayNavLinks = [
  { href: "/my-health", label: "My Health" },
  { href: "/services", label: "Services" },
  { href: "/library", label: "Health library" }
];

export function ConsultOverlayHeader({ lineVariant }: { lineVariant: TopBarLineVariant }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    function handleDocumentPointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (menuRef.current?.contains(target) || menuButtonRef.current?.contains(target)) {
        return;
      }

      setIsMenuOpen(false);
    }

    document.addEventListener("pointerdown", handleDocumentPointerDown);

    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
    };
  }, [isMenuOpen]);

  return (
    <header
      className={`consult-overlay-header consult-overlay-header-lines-${lineVariant} ${
        isMenuOpen ? "consult-overlay-header-menu-open" : ""
      }`}
      aria-label="Condensed Health navigation"
    >
      <div className="consult-overlay-primary-bar">
        <button
          ref={menuButtonRef}
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation menu"
          className="consult-overlay-menu-button"
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
        <CustomerBrand />
        <nav ref={menuRef} className="consult-overlay-service-bar" aria-label="Site sections">
          {consultOverlayNavLinks.map((link) => {
            const isLibraryArea = link.href === "/library" && (pathname.startsWith("/forum") || pathname.startsWith("/qa"));
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`) || isLibraryArea;

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={isActive ? "active" : undefined}
                href={link.href}
                key={link.href}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
          <Link className="consult-overlay-menu-sign-in" href="/account" onClick={() => setIsMenuOpen(false)}>
            Sign in
          </Link>
        </nav>
        <Link className="consult-overlay-account-icon" href="/account" aria-label="Sign in">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M12 12.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
            <path d="M4.8 20.2a7.4 7.4 0 0 1 14.4 0" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
