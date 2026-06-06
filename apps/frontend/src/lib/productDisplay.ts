import type { Product } from "./api";

export function isAssessmentProduct(product: Product) {
  return product.purchaseMode === "ASSESSMENT_REQUIRED";
}

export function productDisplayLabel(product: Product) {
  return isAssessmentProduct(product) ? "Care program" : "Product";
}
