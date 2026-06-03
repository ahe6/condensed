"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getCart, getMyCart } from "../lib/api";
import { getSession, isAuthConfigured } from "../lib/auth";

const cartStorageKey = "health.cartId";

const links = [
  { href: "/cart", label: "Cart", match: (pathname: string) => pathname === "/cart" },
  { href: "/orders", label: "Orders", match: (pathname: string) => pathname.startsWith("/orders") },
  {
    href: "/account",
    label: "Account",
    match: (pathname: string) => pathname === "/account" || pathname === "/addresses"
  }
];

type CustomerNavProps = {
  cartItemCount?: number;
};

async function loadCartItemCount() {
  const savedCartId = window.localStorage.getItem(cartStorageKey);

  if (isAuthConfigured() && getSession()) {
    try {
      const accountCart = await getMyCart(savedCartId ?? undefined);
      window.localStorage.setItem(cartStorageKey, accountCart.id);
      return accountCart.totals.itemCount;
    } catch {
      window.localStorage.removeItem(cartStorageKey);
      return 0;
    }
  }

  if (!savedCartId) {
    return 0;
  }

  try {
    const savedCart = await getCart(savedCartId);
    return savedCart.totals.itemCount;
  } catch {
    window.localStorage.removeItem(cartStorageKey);
    return 0;
  }
}

export function CustomerNav({ cartItemCount }: CustomerNavProps) {
  const pathname = usePathname();
  const [loadedCartItemCount, setLoadedCartItemCount] = useState(0);
  const visibleCartItemCount = cartItemCount ?? loadedCartItemCount;
  const cartBadgeText = visibleCartItemCount > 99 ? "99+" : String(visibleCartItemCount);

  useEffect(() => {
    if (cartItemCount !== undefined) {
      return;
    }

    let isMounted = true;

    void loadCartItemCount().then((itemCount) => {
      if (isMounted) {
        setLoadedCartItemCount(itemCount);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [cartItemCount]);

  return (
    <nav className="customer-nav" aria-label="Customer navigation">
      {links.map((link) => {
        const isCartLink = link.href === "/cart";

        return (
          <Link
            key={link.href}
            aria-label={isCartLink ? `Cart, ${visibleCartItemCount} items` : undefined}
            className={link.match(pathname) ? "customer-nav-link active" : "customer-nav-link"}
            href={link.href}
          >
            <span>{link.label}</span>
            {isCartLink ? <span className="cart-count-badge">{cartBadgeText}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
