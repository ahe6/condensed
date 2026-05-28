"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { OrderSummary } from "../../src/components/OrderSummary";
import { Order, User, getMe, getMyOrders } from "../../src/lib/api";
import { getSession, isAuthConfigured, signOut, startLogin } from "../../src/lib/auth";
import { formatDateTime, formatMoney } from "../../src/lib/format";

export default function AccountPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const accountStats = useMemo(() => {
    const paidOrders = orders.filter((order) => order.paymentStatus === "PAID");
    const openOrders = orders.filter(
      (order) => order.fulfillmentStatus !== "FULFILLED" && order.status !== "CANCELLED"
    );
    const totalSpent = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);

    return {
      openOrderCount: openOrders.length,
      orderCount: orders.length,
      totalSpent: totalSpent.toFixed(2)
    };
  }, [orders]);

  useEffect(() => {
    void loadAccount();
  }, []);

  async function loadAccount() {
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
      setError(caught instanceof Error ? caught.message : "Could not load account");
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
      <section className="topbar" aria-label="Account navigation">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Orders</h1>
        </div>
        <div className="nav-actions">
          <Link className="nav-link" href="/">
            Shop
          </Link>
          {currentUser ? (
            <button className="secondary" type="button" onClick={signOut}>
              Sign Out
            </button>
          ) : null}
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
            <button type="button" onClick={() => void startLogin()}>
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
          <div className="empty-state compact">Loading account</div>
        </section>
      ) : null}

      {currentUser ? (
        <>
          <section className="summary-grid" aria-label="Account summary">
            <div className="metric wide">
              <span>Signed In</span>
              <strong>{currentUser.email}</strong>
            </div>
            <div className="metric">
              <span>Orders</span>
              <strong>{accountStats.orderCount}</strong>
            </div>
            <div className="metric">
              <span>Open</span>
              <strong>{accountStats.openOrderCount}</strong>
            </div>
            <div className="metric">
              <span>Paid Total</span>
              <strong>{formatMoney(accountStats.totalSpent, "USD")}</strong>
            </div>
          </section>

          <section className="account-layout">
            <section className="panel account-profile" aria-label="Profile">
              <div className="panel-heading">
                <h2>Profile</h2>
              </div>
              <dl className="order-meta">
                <div>
                  <dt>Email</dt>
                  <dd>{currentUser.email}</dd>
                </div>
                <div>
                  <dt>Name</dt>
                  <dd>{currentUser.name ?? "Not set"}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{currentUser.phone ?? "Not set"}</dd>
                </div>
                <div>
                  <dt>Customer Since</dt>
                  <dd>{formatDateTime(currentUser.createdAt)}</dd>
                </div>
              </dl>
            </section>

            <section className="panel account-orders" aria-label="Order history">
              <div className="panel-heading">
                <h2>Order History</h2>
                <button
                  className="secondary"
                  type="button"
                  disabled={pendingAction === "orders"}
                  onClick={() => void refreshOrders()}
                >
                  {pendingAction === "orders" ? "Refreshing" : "Refresh"}
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="empty-state compact">No order history</div>
              ) : (
                <div className="account-order-list">
                  {orders.map((order) => (
                    <OrderSummary key={order.id} order={order} />
                  ))}
                </div>
              )}
            </section>
          </section>
        </>
      ) : null}
    </main>
  );
}
