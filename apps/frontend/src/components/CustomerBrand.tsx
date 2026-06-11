import Link from "next/link";

export function CustomerBrand() {
  return (
    <Link className="customer-brand" href="/" aria-label="Condensed Health home">
      <img src="/brand/logo-full.svg" alt="Condensed Health" />
    </Link>
  );
}
