"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CustomerBrand } from "../../src/components/CustomerBrand";
import { CustomerNav } from "../../src/components/CustomerNav";
import { OrderSummary } from "../../src/components/OrderSummary";
import { Order, User, getMe, getMyOrders } from "../../src/lib/api";
import { getCurrentReturnTo, getSession, isAuthConfigured, startLogin } from "../../src/lib/auth";
import { formatMoney } from "../../src/lib/format";

type OrderFilter = "ALL" | "OPEN" | "PAID" | "UNPAID" | "FULFILLED" | "CANCELLED";

function orderMatchesFilter(order: Order, filter: OrderFilter) {
  switch (filter) {
    case "OPEN":
      return order.status !== "CANCELLED" && order.fulfillmentStatus !== "FULFILLED";
    case "PAID":
      return order.paymentStatus === "PAID";
    case "UNPAID":
      return order.paymentStatus === "UNPAID";
    case "FULFILLED":
      return order.fulfillmentStatus === "FULFILLED";
    case "CANCELLED":
      return order.status === "CANCELLED";
    case "ALL":
    default:
      return true;
  }
}

function orderSearchText(order: Order) {
  return [
    order.orderNumber,
    order.email,
    order.status,
    order.paymentStatus,
    order.fulfillmentStatus,
    ...order.items.flatMap((item) => [item.productName, item.sku, item.variantTitle ?? ""])
  ]
    .join(" ")
    .toLowerCase();
}

export default function OrdersPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<OrderFilter>("ALL");

  const orderStats = useMemo(() => {
    const paidOrders = orders.filter((order) => order.paymentStatus === "PAID");
    const openOrders = orders.filter((order) => orderMatchesFilter(order, "OPEN"));
    const totalSpent = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);

    return {
      openOrderCount: openOrders.length,
      orderCount: orders.length,
      totalSpent: totalSpent.toFixed(2)
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch = query.length === 0 || orderSearchText(order).includes(query);

      return matchesSearch && orderMatchesFilter(order, filter);
    });
  }, [filter, orders, search]);

  useEffect(() => {
    void loadOrders();
  }, []);

  async function loadOrders() {
    setIsLoading(true);
    setError(null);
    setNeedsSignIn(false);

    if (!isAuthConfigured()) {
      setCurrentUser(null);
      setOrders([]);
      setError("Auth is not configured");
      setIsLoading(false);
      return;
    }

    if (!getSession()) {
      setCurrentUser(null);
      setOrders([]);
      setNeedsSignIn(true);
      setIsLoading(false);
      return;
    }

    try {
      const [user, nextOrders] = await Promise.all([getMe(), getMyOrders()]);

      setCurrentUser(user);
      setOrders(nextOrders);
    } catch (caught) {
      setCurrentUser(null);
      setOrders([]);
      setError(caught instanceof Error ? caught.message : "Could not load orders");
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshOrders() {
    setPendingAction("orders");
    setError(null);

    try {
      setOrders(await getMyOrders());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not refresh orders");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <main className="shell">
      <section className="topbar" aria-label="Orders navigation">
        <CustomerBrand />
        <div className="nav-actions">
          <CustomerNav />
        </div>
      </section>

      {error ? <p className="error global-error">{error}</p> : null}

      {needsSignIn ? (
        <section className="panel account-sign-in" aria-label="Sign in">
          <div>
            <p className="eyebrow">Sign in required</p>
            <h2>View your orders</h2>
          </div>
          <div className="auth-actions">
            <button type="button" onClick={() => void startLogin({ returnTo: getCurrentReturnTo() })}>
              Sign In
            </button>
            <Link className="nav-link" href="/auth/confirm">
              Confirm Account
            </Link>
          </div>
        </section>
      ) : null}

      {!currentUser && isLoading ? (
        <section className="panel">
          <div className="empty-state compact">Loading orders</div>
        </section>
      ) : null}

      {currentUser ? (
        <>
          <section className="summary-grid" aria-label="Order history summary">
            <div className="metric wide">
              <span>Signed In</span>
              <strong>{currentUser.email}</strong>
            </div>
            <div className="metric">
              <span>Orders</span>
              <strong>{orderStats.orderCount}</strong>
            </div>
            <div className="metric">
              <span>Open</span>
              <strong>{orderStats.openOrderCount}</strong>
            </div>
            <div className="metric">
              <span>Paid Total</span>
              <strong>{formatMoney(orderStats.totalSpent, "USD")}</strong>
            </div>
          </section>

          <section className="panel account-orders" aria-label="Order history">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">History</p>
                <h2>Order History</h2>
              </div>
              <button
                className="secondary"
                type="button"
                disabled={pendingAction === "orders"}
                onClick={() => void refreshOrders()}
              >
                {pendingAction === "orders" ? "Refreshing" : "Refresh"}
              </button>
            </div>

            <div className="order-history-tools">
              <label className="order-history-search">
                <span>Search</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Order number, product, status"
                />
              </label>
              <label>
                <span>Status</span>
                <select value={filter} onChange={(event) => setFilter(event.target.value as OrderFilter)}>
                  <option value="ALL">All orders</option>
                  <option value="OPEN">Open</option>
                  <option value="PAID">Paid</option>
                  <option value="UNPAID">Unpaid</option>
                  <option value="FULFILLED">Fulfilled</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </label>
            </div>

            {orders.length === 0 ? (
              <div className="empty-state compact">
                <p>No order history</p>
                <Link className="nav-link" href="/">
                  Shop Products
                </Link>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="empty-state compact">No matching orders</div>
            ) : (
              <div className="account-order-list">
                {filteredOrders.map((order) => (
                  <OrderSummary key={order.id} order={order} />
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
