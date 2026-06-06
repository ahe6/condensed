import type { Product } from "./api";

const assessmentCategorySlugs = new Set([
  "labs",
  "mental-wellness",
  "sexual-wellness",
  "weight-management"
]);

const assessmentProductSlugs = new Set([
  "at-home-wellness-labs-kit",
  "bedroom-basics-kit",
  "hair-density-support-kit",
  "skin-clarity-routine",
  "sleep-stress-support-kit",
  "weight-management-starter-kit"
]);

export function isAssessmentProduct(product: Product) {
  return (
    assessmentProductSlugs.has(product.slug) ||
    product.categories.some((category) => assessmentCategorySlugs.has(category.category.slug))
  );
}

export function productDisplayLabel(product: Product) {
  return isAssessmentProduct(product) ? "Care program" : "Product";
}
