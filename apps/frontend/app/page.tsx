"use client";

import {
  CheckoutElementsProvider,
  PaymentElement,
  useCheckoutElements
} from "@stripe/react-stripe-js/checkout";
import { loadStripe } from "@stripe/stripe-js";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { OrderSummary } from "../src/components/OrderSummary";
import {
  AddressInput,
  ApiStatus,
  Cart,
  Order,
  Product,
  User,
  addCartItem,
  apiBaseUrl,
  checkoutCart,
  clearCart,
  createCart,
  createStripeCheckoutSession,
  getCart,
  getMe,
  getOrder,
  getMyOrders,
  getReadiness,
  listProducts,
  removeCartItem,
  updateCartItem
} from "../src/lib/api";
import { isAuthConfigured, signOut, startLogin } from "../src/lib/auth";
import { formatMoney } from "../src/lib/format";

const cartStorageKey = "tele.cartId";
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

const emptyAddress: AddressInput = {
  recipientName: "",
  line1: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
  phone: ""
};

function compactAddress(input: AddressInput): AddressInput {
  return {
    recipientName: input.recipientName.trim(),
    line1: input.line1.trim(),
    line2: input.line2?.trim() || undefined,
    city: input.city.trim(),
    state: input.state?.trim() || undefined,
    postalCode: input.postalCode.trim(),
    country: input.country.trim().toUpperCase(),
    phone: input.phone?.trim() || undefined
  };
}

function stripeReturnUrl(orderNumber: string) {
  return `${window.location.origin}/?order=${orderNumber}&session_id={CHECKOUT_SESSION_ID}`;
}

function stripePhoneNumber(order: Order) {
  const phone = order.addresses.find((address) => address.type === "SHIPPING")?.phone?.trim();

  if (!phone) {
    return undefined;
  }

  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return phone;
}

export default function Home() {
  const [status, setStatus] = useState<ApiStatus>("checking");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [cart, setCart] = useState<Cart | null>(null);
  const [email, setEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState<AddressInput>(emptyAddress);
  const [billingAddress, setBillingAddress] = useState<AddressInput>(emptyAddress);
  const [billingSame, setBillingSame] = useState(true);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [checkoutClientSecret, setCheckoutClientSecret] = useState<string | null>(null);
  const [orderLookup, setOrderLookup] = useState("");
  const [lookedUpOrder, setLookedUpOrder] = useState<Order | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cartCurrency = cart?.items[0]?.variant.currency ?? "USD";
  const productCount = products.length;
  const cartItemCount = cart?.totals.itemCount ?? 0;

  const activeProducts = useMemo(
    () => products.filter((product) => product.variants.length > 0),
    [products]
  );

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        await getReadiness();
        const [nextProducts, savedCart, authState] = await Promise.all([
          listProducts(),
          loadSavedCart(),
          loadAuthState()
        ]);

        if (!isMounted) {
          return;
        }

        setProducts(nextProducts);
        setCart(savedCart);
        setCurrentUser(authState.user);
        setMyOrders(authState.orders);
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

  async function loadAuthState() {
    if (!isAuthConfigured()) {
      return {
        user: null,
        orders: []
      };
    }

    try {
      const [user, orders] = await Promise.all([getMe(), getMyOrders()]);

      return {
        user,
        orders
      };
    } catch {
      return {
        user: null,
        orders: []
      };
    }
  }

  async function ensureCart() {
    if (cart) {
      return cart;
    }

    const nextCart = await createCart();
    window.localStorage.setItem(cartStorageKey, nextCart.id);
    setCart(nextCart);

    return nextCart;
  }

  async function refreshProducts() {
    setPendingAction("products");
    setError(null);

    try {
      setProducts(await listProducts());
      setStatus("online");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not refresh products");
      setStatus("offline");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleAddToCart(product: Product) {
    const variantId = selectedVariants[product.id] ?? product.variants[0]?.id;

    if (!variantId) {
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

  async function handleQuantity(itemId: string, quantity: number) {
    if (!cart) {
      return;
    }

    setPendingAction(`quantity-${itemId}`);
    setError(null);

    try {
      setCart(await updateCartItem(cart.id, itemId, quantity));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update quantity");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRemove(itemId: string) {
    if (!cart) {
      return;
    }

    setPendingAction(`remove-${itemId}`);
    setError(null);

    try {
      setCart(await removeCartItem(cart.id, itemId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not remove item");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleClearCart() {
    if (!cart) {
      return;
    }

    setPendingAction("clear-cart");
    setError(null);

    try {
      setCart(await clearCart(cart.id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not clear cart");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!cart || cart.items.length === 0) {
      setError("Cart is empty");
      return;
    }

    setPendingAction("checkout");
    setError(null);

    try {
      const order = await checkoutCart({
        cartId: cart.id,
        email,
        shippingAddress: compactAddress(shippingAddress),
        billingAddress: billingSame ? compactAddress(shippingAddress) : compactAddress(billingAddress)
      });

      if (stripePromise) {
        const checkoutSession = await createStripeCheckoutSession(
          order.id,
          stripeReturnUrl(order.orderNumber)
        );
        setCheckoutClientSecret(checkoutSession.clientSecret);
      } else {
        setCheckoutClientSecret(null);
      }

      setLastOrder(order);
      setLookedUpOrder(order);
      setOrderLookup(order.orderNumber);
      if (currentUser) {
        setMyOrders(await getMyOrders());
      }
      setCart(null);
      window.localStorage.removeItem(cartStorageKey);
      setEmail("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Checkout failed");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleOrderLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingAction("order-lookup");
    setError(null);

    try {
      setLookedUpOrder(await getOrder(orderLookup.trim()));
    } catch (caught) {
      setLookedUpOrder(null);
      setError(caught instanceof Error ? caught.message : "Order not found");
    } finally {
      setPendingAction(null);
    }
  }

  function updateShippingAddress(field: keyof AddressInput, value: string) {
    setShippingAddress((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateBillingAddress(field: keyof AddressInput, value: string) {
    setBillingAddress((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function refreshMyOrders() {
    setPendingAction("my-orders");
    setError(null);

    try {
      setMyOrders(await getMyOrders());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not refresh order history");
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
          {isAuthConfigured() ? (
            currentUser ? (
              <button className="secondary" type="button" onClick={signOut}>
                Sign Out
              </button>
            ) : (
              <button className="secondary" type="button" onClick={() => void startLogin()}>
                Sign In
              </button>
            )
          ) : null}
          <div className={`status ${status}`}>
            <span aria-hidden="true" />
            {status}
          </div>
        </div>
      </section>

      <section className="summary-grid" aria-label="Environment summary">
        <div className="metric wide">
          <span>API</span>
          <strong>{apiBaseUrl}</strong>
        </div>
        <div className="metric">
          <span>Products</span>
          <strong>{productCount}</strong>
        </div>
        <div className="metric">
          <span>Cart</span>
          <strong>{cartItemCount}</strong>
        </div>
        <div className="metric">
          <span>Total</span>
          <strong>{formatMoney(cart?.totals.total ?? "0", cartCurrency)}</strong>
        </div>
      </section>

      {error ? <p className="error global-error">{error}</p> : null}

      <section className="workspace">
        <section className="catalog" aria-label="Products">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Catalog</p>
              <h2>Products</h2>
            </div>
            <button className="secondary" type="button" onClick={() => void refreshProducts()}>
              {pendingAction === "products" ? "Refreshing" : "Refresh"}
            </button>
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
                        <img src={image.url} alt={image.altText ?? product.name} />
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
                            <span>{selectedVariant.inventoryQuantity} in stock</span>
                          </div>
                          <button
                            type="button"
                            disabled={
                              selectedVariant.inventoryQuantity <= 0 ||
                              pendingAction === `add-${selectedVariant.id}`
                            }
                            onClick={() => void handleAddToCart(product)}
                          >
                            {pendingAction === `add-${selectedVariant.id}` ? "Adding" : "Add"}
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

        <aside className="side-stack">
          <section className="panel" aria-label="Cart">
            <div className="panel-heading">
              <h2>Cart</h2>
              <button
                className="secondary"
                type="button"
                disabled={!cart || cart.items.length === 0 || pendingAction === "clear-cart"}
                onClick={() => void handleClearCart()}
              >
                Clear
              </button>
            </div>

            {!cart || cart.items.length === 0 ? (
              <div className="empty-state compact">Cart is empty</div>
            ) : (
              <div className="cart-list">
                {cart.items.map((item) => (
                  <article className="cart-row" key={item.id}>
                    <div>
                      <strong>{item.variant.product.name}</strong>
                      <span>{item.variant.title}</span>
                      <span>{formatMoney(item.variant.price, item.variant.currency)}</span>
                    </div>
                    <div className="quantity-control">
                      <button
                        className="icon-button"
                        type="button"
                        disabled={item.quantity <= 1 || pendingAction === `quantity-${item.id}`}
                        onClick={() => void handleQuantity(item.id, item.quantity - 1)}
                        aria-label={`Decrease ${item.variant.product.name}`}
                      >
                        -
                      </button>
                      <output>{item.quantity}</output>
                      <button
                        className="icon-button"
                        type="button"
                        disabled={pendingAction === `quantity-${item.id}`}
                        onClick={() => void handleQuantity(item.id, item.quantity + 1)}
                        aria-label={`Increase ${item.variant.product.name}`}
                      >
                        +
                      </button>
                      <button
                        className="secondary remove-button"
                        type="button"
                        disabled={pendingAction === `remove-${item.id}`}
                        onClick={() => void handleRemove(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="totals">
              <div>
                <span>Subtotal</span>
                <strong>{formatMoney(cart?.totals.subtotal ?? "0", cartCurrency)}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{formatMoney(cart?.totals.total ?? "0", cartCurrency)}</strong>
              </div>
            </div>
          </section>

          <section className="panel" aria-label="Checkout">
            <div className="panel-heading">
              <h2>Checkout</h2>
            </div>

            <form className="checkout-form" onSubmit={handleCheckout}>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="buyer@example.com"
                  required
                />
              </label>

              <div className="form-grid">
                <label>
                  <span>Name</span>
                  <input
                    value={shippingAddress.recipientName}
                    onChange={(event) => updateShippingAddress("recipientName", event.target.value)}
                    required
                  />
                </label>
                <label>
                  <span>Phone</span>
                  <input
                    value={shippingAddress.phone ?? ""}
                    onChange={(event) => updateShippingAddress("phone", event.target.value)}
                  />
                </label>
              </div>

              <label>
                <span>Address</span>
                <input
                  value={shippingAddress.line1}
                  onChange={(event) => updateShippingAddress("line1", event.target.value)}
                  required
                />
              </label>

              <div className="form-grid thirds">
                <label>
                  <span>City</span>
                  <input
                    value={shippingAddress.city}
                    onChange={(event) => updateShippingAddress("city", event.target.value)}
                    required
                  />
                </label>
                <label>
                  <span>State</span>
                  <input
                    value={shippingAddress.state ?? ""}
                    onChange={(event) => updateShippingAddress("state", event.target.value)}
                  />
                </label>
                <label>
                  <span>Postal</span>
                  <input
                    value={shippingAddress.postalCode}
                    onChange={(event) => updateShippingAddress("postalCode", event.target.value)}
                    required
                  />
                </label>
              </div>

              <label>
                <span>Country</span>
                <input
                  value={shippingAddress.country}
                  maxLength={2}
                  onChange={(event) => updateShippingAddress("country", event.target.value)}
                  required
                />
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={billingSame}
                  onChange={(event) => setBillingSame(event.target.checked)}
                />
                <span>Billing matches shipping</span>
              </label>

              {!billingSame ? (
                <div className="billing-fields">
                  <label>
                    <span>Billing name</span>
                    <input
                      value={billingAddress.recipientName}
                      onChange={(event) => updateBillingAddress("recipientName", event.target.value)}
                      required
                    />
                  </label>
                  <label>
                    <span>Billing address</span>
                    <input
                      value={billingAddress.line1}
                      onChange={(event) => updateBillingAddress("line1", event.target.value)}
                      required
                    />
                  </label>
                  <div className="form-grid thirds">
                    <label>
                      <span>City</span>
                      <input
                        value={billingAddress.city}
                        onChange={(event) => updateBillingAddress("city", event.target.value)}
                        required
                      />
                    </label>
                    <label>
                      <span>State</span>
                      <input
                        value={billingAddress.state ?? ""}
                        onChange={(event) => updateBillingAddress("state", event.target.value)}
                      />
                    </label>
                    <label>
                      <span>Postal</span>
                      <input
                        value={billingAddress.postalCode}
                        onChange={(event) => updateBillingAddress("postalCode", event.target.value)}
                        required
                      />
                    </label>
                  </div>
                  <label>
                    <span>Country</span>
                    <input
                      value={billingAddress.country}
                      maxLength={2}
                      onChange={(event) => updateBillingAddress("country", event.target.value)}
                      required
                    />
                  </label>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={!cart || cart.items.length === 0 || pendingAction === "checkout"}
              >
                {pendingAction === "checkout" ? "Placing" : "Place Order"}
              </button>
            </form>

            {lastOrder ? (
              <div className="order-confirmation">
                <span>Order placed</span>
                <strong>{lastOrder.orderNumber}</strong>
              </div>
            ) : null}

            {lastOrder && checkoutClientSecret && stripePromise ? (
              <CheckoutElementsProvider
                stripe={stripePromise}
                options={{
                  clientSecret: checkoutClientSecret
                }}
              >
                <StripePaymentForm
                  order={lastOrder}
                  onError={setError}
                  onSubmitted={async () => {
                    const refreshedOrder = await getOrder(lastOrder.orderNumber);
                    setLastOrder(refreshedOrder);
                    setLookedUpOrder(refreshedOrder);
                    if (currentUser) {
                      setMyOrders(await getMyOrders());
                    }
                  }}
                />
              </CheckoutElementsProvider>
            ) : lastOrder ? (
              <div className="empty-state compact">Stripe payment is not configured</div>
            ) : null}
          </section>

          <section className="panel" aria-label="Order lookup">
            <div className="panel-heading">
              <h2>Order</h2>
            </div>

            <form className="lookup-form" onSubmit={handleOrderLookup}>
              <input
                value={orderLookup}
                onChange={(event) => setOrderLookup(event.target.value)}
                placeholder="TELE-..."
                required
              />
              <button type="submit" disabled={pendingAction === "order-lookup"}>
                Find
              </button>
            </form>

            {lookedUpOrder ? <OrderSummary order={lookedUpOrder} /> : null}
          </section>

          <section className="panel" aria-label="Account orders">
            <div className="panel-heading">
              <h2>Account</h2>
              {currentUser ? (
                <button
                  className="secondary"
                  type="button"
                  disabled={pendingAction === "my-orders"}
                  onClick={() => void refreshMyOrders()}
                >
                  Refresh
                </button>
              ) : null}
            </div>

            {!isAuthConfigured() ? (
              <div className="empty-state compact">Cognito is not configured</div>
            ) : currentUser ? (
              <div className="account-panel">
                <div>
                  <span>Signed in</span>
                  <strong>{currentUser.email}</strong>
                </div>
                {myOrders.length === 0 ? (
                  <div className="empty-state compact">No order history</div>
                ) : (
                  myOrders.map((order) => <OrderSummary key={order.id} order={order} />)
                )}
              </div>
            ) : (
              <div className="account-panel">
                <button type="button" onClick={() => void startLogin()}>
                  Sign In
                </button>
                <Link className="nav-link" href="/auth/confirm">
                  Confirm Account
                </Link>
              </div>
            )}
          </section>
        </aside>
      </section>
    </main>
  );
}

function StripePaymentForm({
  onError,
  onSubmitted,
  order
}: {
  onError: (message: string | null) => void;
  onSubmitted: () => Promise<void>;
  order: Order;
}) {
  const checkoutState = useCheckoutElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handlePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (checkoutState.type !== "success") {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    onError(null);

    try {
      const result = await checkoutState.checkout.confirm({
        phoneNumber: stripePhoneNumber(order),
        redirect: "if_required"
      });

      if (result.type === "error") {
        onError(result.error.message ?? "Payment failed");
      } else {
        setMessage("Payment submitted");
        await new Promise((resolve) => window.setTimeout(resolve, 1200));
        await onSubmitted();
      }
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Payment failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="payment-form" onSubmit={handlePayment}>
      <PaymentElement />
      <button type="submit" disabled={checkoutState.type !== "success" || isSubmitting}>
        {isSubmitting ? "Paying" : `Pay ${formatMoney(order.total, order.currency)}`}
      </button>
      {checkoutState.type === "error" ? <p className="error">{checkoutState.error.message}</p> : null}
      {message ? <p className="notice">{message}</p> : null}
    </form>
  );
}
