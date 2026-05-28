"use client";

import {
  CheckoutElementsProvider,
  PaymentElement,
  useCheckoutElements
} from "@stripe/react-stripe-js/checkout";
import { loadStripe } from "@stripe/stripe-js";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  Address,
  AddressInput,
  ApiStatus,
  Cart,
  Order,
  User,
  apiBaseUrl,
  checkoutCart,
  checkoutCartWithStripe,
  clearCart,
  getCart,
  getMe,
  getMyAddresses,
  getMyCart,
  getOrder,
  getReadiness,
  removeCartItem,
  updateCartItem
} from "../../src/lib/api";
import { getSession, isAuthConfigured, signOut, startLogin } from "../../src/lib/auth";
import { formatMoney } from "../../src/lib/format";

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

function addressInputFromAddress(address: Address): AddressInput {
  return {
    recipientName: address.recipientName,
    line1: address.line1,
    line2: address.line2 ?? undefined,
    city: address.city,
    state: address.state ?? undefined,
    postalCode: address.postalCode,
    country: address.country,
    phone: address.phone ?? undefined
  };
}

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

export default function CartPage() {
  const [status, setStatus] = useState<ApiStatus>("checking");
  const [cart, setCart] = useState<Cart | null>(null);
  const [email, setEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState<AddressInput>(emptyAddress);
  const [billingAddress, setBillingAddress] = useState<AddressInput>(emptyAddress);
  const [billingSame, setBillingSame] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedShippingAddressId, setSelectedShippingAddressId] = useState("");
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState("");
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [checkoutClientSecret, setCheckoutClientSecret] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cartCurrency = cart?.items[0]?.variant.currency ?? "USD";
  const cartItemCount = cart?.totals.itemCount ?? 0;
  const canCheckout = Boolean(cart && cart.items.length > 0);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        await getReadiness();
        const [savedCart, authState] = await Promise.all([loadSavedCart(), loadAuthState()]);

        if (!isMounted) {
          return;
        }

        setCart(savedCart);
        setCurrentUser(authState?.user ?? null);
        setSavedAddresses(authState?.addresses ?? []);
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
    if (currentUser && !email) {
      setEmail(currentUser.email);
    }
  }, [currentUser, email]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    setShippingAddress((current) => ({
      ...current,
      recipientName: current.recipientName || currentUser.name || "",
      phone: current.phone || currentUser.phone || ""
    }));

    setBillingAddress((current) => ({
      ...current,
      recipientName: current.recipientName || currentUser.name || "",
      phone: current.phone || currentUser.phone || ""
    }));
  }, [currentUser]);

  useEffect(() => {
    if (selectedShippingAddressId || shippingAddress.line1 || savedAddresses.length === 0) {
      return;
    }

    const defaultShipping = savedAddresses.find((address) => address.isDefaultShipping) ?? savedAddresses[0];
    selectShippingAddress(defaultShipping.id);
  }, [savedAddresses, selectedShippingAddressId, shippingAddress.line1]);

  useEffect(() => {
    if (billingSame || selectedBillingAddressId || billingAddress.line1 || savedAddresses.length === 0) {
      return;
    }

    const defaultBilling = savedAddresses.find((address) => address.isDefaultBilling) ?? savedAddresses[0];
    selectBillingAddress(defaultBilling.id);
  }, [billingAddress.line1, billingSame, savedAddresses, selectedBillingAddressId]);

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

  async function loadAuthState() {
    if (!isAuthConfigured() || !getSession()) {
      return null;
    }

    try {
      const [user, addresses] = await Promise.all([getMe(), getMyAddresses()]);

      return {
        addresses,
        user
      };
    } catch {
      return null;
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

    if (!currentUser) {
      setError("Sign in before checkout");
      return;
    }

    if (!cart || cart.items.length === 0) {
      setError("Cart is empty");
      return;
    }

    setPendingAction("checkout");
    setError(null);

    try {
      const checkoutInput = {
        cartId: cart.id,
        email,
        shippingAddress: compactAddress(shippingAddress),
        billingAddress: billingSame ? compactAddress(shippingAddress) : compactAddress(billingAddress)
      };

      if (stripePromise) {
        const result = await checkoutCartWithStripe({
          ...checkoutInput,
          returnBaseUrl: window.location.origin
        });
        setCheckoutClientSecret(result.checkoutSession.clientSecret);
        setLastOrder(result.order);
      } else {
        const order = await checkoutCart(checkoutInput);
        setCheckoutClientSecret(null);
        setLastOrder(order);
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

  function updateShippingAddress(field: keyof AddressInput, value: string) {
    setSelectedShippingAddressId("");
    setShippingAddress((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateBillingAddress(field: keyof AddressInput, value: string) {
    setSelectedBillingAddressId("");
    setBillingAddress((current) => ({
      ...current,
      [field]: value
    }));
  }

  function selectShippingAddress(addressId: string) {
    setSelectedShippingAddressId(addressId);
    const address = savedAddresses.find((item) => item.id === addressId);

    if (address) {
      setShippingAddress(addressInputFromAddress(address));
    }
  }

  function selectBillingAddress(addressId: string) {
    setSelectedBillingAddressId(addressId);
    const address = savedAddresses.find((item) => item.id === addressId);

    if (address) {
      setBillingAddress(addressInputFromAddress(address));
    }
  }

  return (
    <main className="shell">
      <section className="topbar" aria-label="Workspace status">
        <div>
          <p className="eyebrow">Tele</p>
          <h1>Cart</h1>
        </div>
        <div className="nav-actions">
          <Link className="nav-link" href="/">
            Shop
          </Link>
          <Link className="nav-link" href="/account">
            Account
          </Link>
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

      <section className="summary-grid" aria-label="Cart summary">
        <div className="metric wide">
          <span>API</span>
          <strong>{apiBaseUrl}</strong>
        </div>
        <div className="metric">
          <span>Items</span>
          <strong>{cartItemCount}</strong>
        </div>
        <div className="metric">
          <span>Total</span>
          <strong>{formatMoney(cart?.totals.total ?? "0", cartCurrency)}</strong>
        </div>
        <div className="metric">
          <span>Account</span>
          <strong>{currentUser?.email ?? "Signed out"}</strong>
        </div>
      </section>

      {error ? <p className="error global-error">{error}</p> : null}

      <section className="cart-page-layout">
        <section className="panel" aria-label="Cart">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Review</p>
              <h2>Cart</h2>
            </div>
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
            <div className="empty-state">
              <p>Cart is empty</p>
              <Link className="nav-link" href="/">
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="cart-list">
              {cart.items.map((item) => (
                <article className="cart-row" key={item.id}>
                  <div>
                    <strong>{item.variant.product.name}</strong>
                    <span>{item.variant.title}</span>
                    <span>{formatMoney(item.variant.price, item.variant.currency)}</span>
                    <span>
                      {item.quantity >= item.variant.inventoryQuantity
                        ? "Max stock in cart"
                        : `${item.variant.inventoryQuantity - item.quantity} more available`}
                    </span>
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
                      disabled={item.quantity >= item.variant.inventoryQuantity || pendingAction === `quantity-${item.id}`}
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
            <div>
              <p className="eyebrow">Secure checkout</p>
              <h2>Checkout</h2>
            </div>
          </div>

          {!canCheckout && !lastOrder ? (
            <div className="empty-state">
              <p>Add items to your cart before checkout</p>
              <Link className="nav-link" href="/">
                Shop Products
              </Link>
            </div>
          ) : (
            <>
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

            {savedAddresses.length > 0 ? (
              <label>
                <span>Shipping address</span>
                <select
                  value={selectedShippingAddressId}
                  onChange={(event) => selectShippingAddress(event.target.value)}
                >
                  <option value="">Custom address</option>
                  {savedAddresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.label ?? address.recipientName} - {address.line1}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

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
                {savedAddresses.length > 0 ? (
                  <label>
                    <span>Billing address</span>
                    <select
                      value={selectedBillingAddressId}
                      onChange={(event) => selectBillingAddress(event.target.value)}
                    >
                      <option value="">Custom address</option>
                      {savedAddresses.map((address) => (
                        <option key={address.id} value={address.id}>
                          {address.label ?? address.recipientName} - {address.line1}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
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

                <button type="submit" disabled={!currentUser || !canCheckout || pendingAction === "checkout"}>
                  {!currentUser ? "Sign In To Checkout" : pendingAction === "checkout" ? "Placing" : "Place Order"}
                </button>
              </form>

              {!currentUser ? (
                <div className="empty-state compact">
                  <p>Sign in to place orders and view order history</p>
                  {isAuthConfigured() ? (
                    <button type="button" onClick={() => void startLogin()}>
                      Sign In
                    </button>
                  ) : null}
                </div>
              ) : null}

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
                    }}
                  />
                </CheckoutElementsProvider>
              ) : lastOrder ? (
                <div className="empty-state compact">Stripe payment is not configured</div>
              ) : null}
            </>
          )}
        </section>
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
