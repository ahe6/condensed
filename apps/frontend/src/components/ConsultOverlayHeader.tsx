"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CustomerBrand } from "./CustomerBrand";

export type TopBarLineVariant = "gutter" | "full";

const consultOverlayNavLinks = [
  { href: "/my-health", label: "My Health" },
  { href: "/services", label: "Services" },
  { href: "/library", label: "Health library" }
];

export function ConsultOverlayHeader({ lineVariant }: { lineVariant: TopBarLineVariant }) {
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
          {consultOverlayNavLinks.map((link) => (
            <Link href={link.href} key={link.href} onClick={() => setIsMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>
        <Link className="consult-overlay-mobile-sign-in" href="/account">
          Sign in
        </Link>
      </div>
    </header>
  );
}
