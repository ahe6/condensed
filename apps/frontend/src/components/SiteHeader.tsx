"use client";

import { useEffect, useRef, useState } from "react";
import { CustomerBrand } from "./CustomerBrand";
import { CustomerNav } from "./CustomerNav";
import { TopicNav } from "./TopicNav";

const suggestions = ["Weight loss", "Hair loss", "Skin support", "Labs"];

type SiteHeaderProps = {
  ariaLabel?: string;
};

export function SiteHeader({ ariaLabel = "Site navigation" }: SiteHeaderProps) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSearchOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [searchOpen]);

  return (
    <section className="topbar site-header" aria-label={ariaLabel}>
      <CustomerBrand />
      <TopicNav />
      <div className="nav-actions">
        <div className="topbar-search" ref={searchRef}>
          <button
            aria-controls="site-search-popover"
            aria-expanded={searchOpen}
            aria-label="Open search"
            className="topbar-search-toggle"
            type="button"
            onClick={() => setSearchOpen((isOpen) => !isOpen)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="6" />
              <path d="m16 16 4 4" />
            </svg>
          </button>
          {searchOpen ? (
            <div className="topbar-search-popover" id="site-search-popover">
              <form className="home-search compact" role="search" onSubmit={(event) => event.preventDefault()}>
                <div className="home-search-box">
                  <input
                    aria-label="Search care topics"
                    id="site-search"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search symptoms, labs..."
                  />
                </div>
                <div className="search-suggestions" aria-label="Suggested searches">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setQuery(suggestion);
                        setSearchOpen(false);
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </form>
            </div>
          ) : null}
        </div>
        <CustomerNav />
      </div>
    </section>
  );
}
