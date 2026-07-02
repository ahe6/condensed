import { Suspense } from "react";
import { ServicesCatalogPage } from "../../src/components/ServicesCatalogPage";

export const metadata = {
  title: "Services | Condensed Health"
};

export default function ServicesPage() {
  return (
    <Suspense fallback={null}>
      <ServicesCatalogPage />
    </Suspense>
  );
}
