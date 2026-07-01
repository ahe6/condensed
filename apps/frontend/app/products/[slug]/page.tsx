"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CustomerBrand } from "../../../src/components/CustomerBrand";
import { CustomerNav } from "../../../src/components/CustomerNav";
import {
  Cart,
  Product,
  User,
  addCartItem,
  createCart,
  getCart,
  getMe,
  getMyCart,
  getProduct,
  getReadiness
} from "../../../src/lib/api";
import { getSession, isAuthConfigured, startLogin } from "../../../src/lib/auth";
import { formatMoney } from "../../../src/lib/format";
import { isAssessmentProduct, productDisplayLabel } from "../../../src/lib/productDisplay";

const cartStorageKey = "health.cartId";

function previewProduct(slug: string): Product {
  const now = new Date().toISOString();
  const productId = "preview-product";
  const categoryId = "preview-category";

  return {
    id: productId,
    slug,
    name: "General Health Check Labs",
    description:
      "A design preview for a baseline lab panel with metabolic, organ function, cholesterol, blood count, and nutrient markers.",
    status: "ACTIVE",
    purchaseMode: "ASSESSMENT_REQUIRED",
    createdAt: now,
    updatedAt: now,
    images: [],
    variants: [
      {
        id: "preview-variant",
        productId,
        sku: "PREVIEW-GENERAL-HEALTH",
        title: "Standard panel",
        price: "129.00",
        currency: "USD",
        inventoryQuantity: 12,
        createdAt: now,
        updatedAt: now
      }
    ],
    categories: [
      {
        productId,
        categoryId,
        createdAt: now,
        category: {
          id: categoryId,
          parentId: null,
          slug: "labs",
          name: "Labs",
          createdAt: now,
          updatedAt: now
        }
      }
    ]
  };
}

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = decodeURIComponent(params.slug);
  const canPreviewWithoutBackend =
    process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SHOW_VARIANTS === "true";
  const isBypassPreview = canPreviewWithoutBackend && searchParams.get("signin") !== "block";
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [cart, setCart] = useState<Cart | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedVariant =
    product?.variants.find((variant) => variant.id === selectedVariantId) ?? product?.variants[0] ?? null;
  const cartItemCount = cart?.totals.itemCount ?? 0;
  const cartQuantityByVariantId = useMemo(() => {
    const quantities: Record<string, number> = {};

    for (const item of cart?.items ?? []) {
      quantities[item.variantId] = item.quantity;
    }

    return quantities;
  }, [cart]);
  const selectedCartQuantity = selectedVariant ? (cartQuantityByVariantId[selectedVariant.id] ?? 0) : 0;
  const isSelectedVariantMaxed = selectedVariant
    ? selectedCartQuantity >= selectedVariant.inventoryQuantity
    : false;
  const intakeHref = searchParams.get("signin") === "block"
    ? `/intake/${product?.slug ?? slug}?signin=block`
    : `/intake/${product?.slug ?? slug}`;
  const image = product?.images[0];
  const requiresAssessment = product ? isAssessmentProduct(product) : false;

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);

      if (isBypassPreview) {
        const nextProduct = previewProduct(slug);

        if (isMounted) {
          setProduct(nextProduct);
          setSelectedVariantId(nextProduct.variants[0]?.id ?? "");
          setCart(null);
          setCurrentUser(null);
          setIsLoading(false);
        }

        return;
      }

      try {
        await getReadiness();
        const [nextProduct, savedCart, user] = await Promise.all([
          getProduct(slug),
          loadSavedCart(),
          loadCurrentUser()
        ]);

        if (!isMounted) {
          return;
        }

        setProduct(nextProduct);
        setSelectedVariantId(nextProduct.variants[0]?.id ?? "");
        setCart(savedCart);
        setCurrentUser(user);
      } catch (caught) {
        if (isMounted) {
          setProduct(null);
          setError(caught instanceof Error ? caught.message : "Product not found");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [isBypassPreview, slug]);

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

  async function handleAddToCart() {
    if (!selectedVariant) {
      return;
    }

    if (selectedCartQuantity >= selectedVariant.inventoryQuantity) {
      setError(`Only ${selectedVariant.inventoryQuantity} in stock for SKU ${selectedVariant.sku}`);
      return;
    }

    setPendingAction(`add-${selectedVariant.id}`);
    setError(null);

    try {
      const activeCart = await ensureCart();
      setCart(await addCartItem(activeCart.id, selectedVariant.id, 1));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not add item");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <main className="shell">
      <section className="topbar" aria-label="Product navigation">
        <CustomerBrand />
        <div className="nav-actions">
          <CustomerNav cartItemCount={cartItemCount} />
          {isAuthConfigured() && !currentUser ? (
            <button className="secondary" type="button" onClick={() => void startLogin()}>
              Sign In
            </button>
          ) : null}
        </div>
      </section>

      {error ? <p className="error global-error">{error}</p> : null}

      {isLoading ? <section className="panel empty-state">Loading product</section> : null}

      {!isLoading && !product && !error ? (
        <section className="panel empty-state">Product not found</section>
      ) : null}

      {product ? (
        <section className="product-detail" aria-label={product.name}>
          <div className="product-detail-media">
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

          <article className="panel product-detail-panel">
            <div className="product-detail-copy">
              <Link className="text-link" href="/">
                Back to home
              </Link>
              <div>
                <p className="eyebrow">{productDisplayLabel(product)}</p>
                <h1>{product.name}</h1>
                {product.description ? <p>{product.description}</p> : null}
              </div>
              <div className="category-row">
                {product.categories.slice(0, 4).map((category) => (
                  <span key={category.categoryId}>{category.category.name}</span>
                ))}
              </div>
              <div className="product-detail-highlights" aria-label="Product highlights">
                {requiresAssessment ? (
                  <>
                    <span>Assessment first</span>
                    <span>Eligibility review</span>
                    <span>Checkout later</span>
                  </>
                ) : (
                  <>
                    <span>Secure checkout</span>
                    <span>Tracked delivery</span>
                    <span>Inventory checked live</span>
                  </>
                )}
              </div>
            </div>

            <div className="product-detail-actions">
              {requiresAssessment ? (
                <div className="program-detail-action">
                  <div>
                    <strong>Start with a short assessment.</strong>
                    <p>
                      Program checkout should happen after intake and review, not from a standard
                      shopping cart.
                    </p>
                  </div>
                  <Link className="nav-link primary-link" href={intakeHref}>
                    Start Assessment
                  </Link>
                </div>
              ) : (
                <label>
                  <span>Variant</span>
                  <select
                    value={selectedVariant?.id ?? ""}
                    onChange={(event) => setSelectedVariantId(event.target.value)}
                  >
                    {product.variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.title} - {formatMoney(variant.price, variant.currency)}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {!requiresAssessment && selectedVariant ? (
                <div className="product-action detail-action">
                  <div>
                    <strong>{formatMoney(selectedVariant.price, selectedVariant.currency)}</strong>
                    <span>
                      {isSelectedVariantMaxed ? "Max in cart" : `${selectedVariant.inventoryQuantity} in stock`}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={
                      selectedVariant.inventoryQuantity <= 0 ||
                      isSelectedVariantMaxed ||
                      pendingAction === `add-${selectedVariant.id}`
                    }
                    onClick={() => void handleAddToCart()}
                  >
                    {pendingAction === `add-${selectedVariant.id}`
                      ? "Adding"
                      : isSelectedVariantMaxed
                        ? "In Cart"
                        : "Add to Cart"}
                  </button>
                </div>
              ) : null}
            </div>
          </article>
        </section>
      ) : null}
    </main>
  );
}
