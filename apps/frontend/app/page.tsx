"use client";

import { useEffect, useMemo, useState } from "react";
import { CustomerNav } from "../src/components/CustomerNav";
import {
  ApiStatus,
  Cart,
  Product,
  User,
  addCartItem,
  createCart,
  getCart,
  getMe,
  getMyCart,
  getReadiness,
  listProducts
} from "../src/lib/api";
import { getSession, isAuthConfigured, startLogin } from "../src/lib/auth";
import { formatMoney } from "../src/lib/format";

const cartStorageKey = "tele.cartId";

export default function Home() {
  const [status, setStatus] = useState<ApiStatus>("checking");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [cart, setCart] = useState<Cart | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeProducts = useMemo(
    () => products.filter((product) => product.variants.length > 0),
    [products]
  );
  const cartQuantityByVariantId = useMemo(() => {
    const quantities: Record<string, number> = {};

    for (const item of cart?.items ?? []) {
      quantities[item.variantId] = item.quantity;
    }

    return quantities;
  }, [cart]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        await getReadiness();
        const [nextProducts, savedCart, user] = await Promise.all([
          listProducts(),
          loadSavedCart(),
          loadCurrentUser()
        ]);

        if (!isMounted) {
          return;
        }

        setProducts(nextProducts);
        setCart(savedCart);
        setCurrentUser(user);
        setStatus("online");
        setError(null);
      } catch (caught) {
        if (isMounted) {
          setStatus("offline");
          setError(caught instanceof Error ? caught.message : "API unavailable");
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setSelectedVariants((current) => {
      const next = { ...current };

      for (const product of products) {
        if (!next[product.id] && product.variants[0]) {
          next[product.id] = product.variants[0].id;
        }
      }

      return next;
    });
  }, [products]);

  async function loadSavedCart() {
    const savedCartId = window.localStorage.getItem(cartStorageKey);

    if (isAuthConfigured() && getSession()) {
      try {
        const accountCart = await getMyCart(savedCartId ?? undefined);
        window.localStorage.setItem(cartStorageKey, accountCart.id);
        return accountCart;
      } catch {
        window.localStorage.removeItem(cartStorageKey);
        return null;
      }
    }

    if (!savedCartId) {
      return null;
    }

    try {
      return await getCart(savedCartId);
    } catch {
      window.localStorage.removeItem(cartStorageKey);
      return null;
    }
  }

  async function loadCurrentUser() {
    if (!isAuthConfigured() || !getSession()) {
      return null;
    }

    try {
      return await getMe();
    } catch {
      return null;
    }
  }

  async function ensureCart() {
    if (cart) {
      return cart;
    }

    const nextCart = isAuthConfigured() && getSession() ? await getMyCart() : await createCart();
    window.localStorage.setItem(cartStorageKey, nextCart.id);
    setCart(nextCart);

    return nextCart;
  }

  async function handleAddToCart(product: Product) {
    const variantId = selectedVariants[product.id] ?? product.variants[0]?.id;

    if (!variantId) {
      return;
    }

    const variant = product.variants.find((item) => item.id === variantId);
    const currentQuantity = cartQuantityByVariantId[variantId] ?? 0;

    if (variant && currentQuantity >= variant.inventoryQuantity) {
      setError(`Only ${variant.inventoryQuantity} in stock for SKU ${variant.sku}`);
      return;
    }

    setPendingAction(`add-${variantId}`);
    setError(null);

    try {
      const activeCart = await ensureCart();
      setCart(await addCartItem(activeCart.id, variantId, 1));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not add item");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <main className="shell">
      <section className="topbar" aria-label="Workspace status">
        <div>
          <p className="eyebrow">Tele</p>
          <h1>Shop</h1>
        </div>
        <div className="nav-actions">
          {isAuthConfigured() && !currentUser ? (
            <button className="secondary" type="button" onClick={() => void startLogin()}>
              Sign In
            </button>
          ) : null}
          <div className={`status ${status}`}>
            <span aria-hidden="true" />
            {status}
          </div>
        </div>
      </section>

      <CustomerNav />

      {error ? <p className="error global-error">{error}</p> : null}

      <section className="workspace">
        <section className="catalog" aria-label="Products">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Catalog</p>
              <h2>Products</h2>
            </div>
          </div>

          <div className="product-grid">
            {activeProducts.length === 0 ? (
              <div className="empty-state">No active products</div>
            ) : (
              activeProducts.map((product) => {
                const selectedVariant =
                  product.variants.find((variant) => variant.id === selectedVariants[product.id]) ??
                  product.variants[0];
                const image = product.images[0];

                return (
                  <article className="product-card" key={product.id}>
                    <div className="product-media">
                      {image ? (
                        <>
                          <img
                            src={image.url}
                            alt={image.altText ?? product.name}
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                          <span>{product.name.slice(0, 2).toUpperCase()}</span>
                        </>
                      ) : (
                        <span>{product.name.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="product-body">
                      <div>
                        <h3>{product.name}</h3>
                        {product.description ? <p>{product.description}</p> : null}
                      </div>

                      <div className="category-row">
                        {product.categories.slice(0, 3).map((category) => (
                          <span key={category.categoryId}>{category.category.name}</span>
                        ))}
                      </div>

                      <label>
                        <span>Variant</span>
                        <select
                          value={selectedVariant?.id ?? ""}
                          onChange={(event) =>
                            setSelectedVariants((current) => ({
                              ...current,
                              [product.id]: event.target.value
                            }))
                          }
                        >
                          {product.variants.map((variant) => (
                            <option key={variant.id} value={variant.id}>
                              {variant.title} - {formatMoney(variant.price, variant.currency)}
                            </option>
                          ))}
                        </select>
                      </label>

                      {selectedVariant ? (
                        <div className="product-action">
                          <div>
                            <strong>{formatMoney(selectedVariant.price, selectedVariant.currency)}</strong>
                            <span>
                              {(cartQuantityByVariantId[selectedVariant.id] ?? 0) >=
                              selectedVariant.inventoryQuantity
                                ? "Max in cart"
                                : `${selectedVariant.inventoryQuantity} in stock`}
                            </span>
                          </div>
                          <button
                            type="button"
                            disabled={
                              selectedVariant.inventoryQuantity <= 0 ||
                              (cartQuantityByVariantId[selectedVariant.id] ?? 0) >=
                                selectedVariant.inventoryQuantity ||
                              pendingAction === `add-${selectedVariant.id}`
                            }
                            onClick={() => void handleAddToCart(product)}
                          >
                            {pendingAction === `add-${selectedVariant.id}`
                              ? "Adding"
                              : (cartQuantityByVariantId[selectedVariant.id] ?? 0) >=
                                  selectedVariant.inventoryQuantity
                                ? "In Cart"
                                : "Add"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
