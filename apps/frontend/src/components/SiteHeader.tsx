"use client";

import { CustomerBrand } from "./CustomerBrand";
import { CustomerNav } from "./CustomerNav";
import { TopicNav } from "./TopicNav";

type SiteHeaderProps = {
  ariaLabel?: string;
  actionHref?: string;
  actionLabel?: string;
};

export function SiteHeader({ ariaLabel = "Site navigation", actionHref, actionLabel }: SiteHeaderProps) {
  return (
    <section className="topbar site-header" aria-label={ariaLabel}>
      <CustomerBrand />
      <TopicNav />
      <div className="nav-actions">
        <CustomerNav
          primaryHref={actionHref}
          primaryLabel={actionLabel}
          secondaryHref="/health-areas"
          secondaryLabel="Contact"
        />
      </div>
    </section>
  );
}
