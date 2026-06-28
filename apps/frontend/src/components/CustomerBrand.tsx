import Link from "next/link";

export function CustomerBrand() {
  return (
    <Link className="customer-brand" href="/" aria-label="Condensed Health home">
      <span className="customer-brand-wordmark" aria-hidden="true">
        <span>Condensed</span>
        <span>Health</span>
      </span>
    </Link>
  );
}
