"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CustomerBrand } from "../../src/components/CustomerBrand";
import { CustomerNav } from "../../src/components/CustomerNav";
import { Order, User, getMe, getMyOrders } from "../../src/lib/api";
import { getSession, isAuthConfigured, startLogin } from "../../src/lib/auth";
import { formatDateTime, formatMoney, statusClass } from "../../src/lib/format";

function formatPortalDate(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

const careModules = [
  {
    title: "Start with a health area",
    detail: "Begin from a goal, symptom, lab question, or condition and keep the related next steps together.",
    href: "/health-areas",
    action: "Browse Areas",
    status: "Ready"
  },
  {
    title: "Medical context",
    detail: "Conditions, medications, allergies, surgeries, family history, and care notes will live here.",
    href: "/account",
    action: "Account Settings",
    status: "Planned"
  },
  {
    title: "Labs and diagnostics",
    detail: "Orders, saved results, clinician interpretation, and follow-up recommendations will collect here.",
    href: "/labs",
    action: "Explore Labs",
    status: "Care Path"
  },
  {
    title: "Clinician review",
    detail: "Review-required care requests will show status, decision history, and next actions in this portal.",
    href: "/my-health",
    action: "Patient Portal",
    status: "Planned"
  }
];

const workspaceModules = [
  {
    title: "Recent results",
    detail: "Lab values and reports will be grouped by health area as the results workspace comes online.",
    status: "Planned"
  },
  {
    title: "Saved tests",
    detail: "Tests and products you are considering can be kept with the questions they are meant to answer.",
    status: "Planned"
  },
  {
    title: "Follow-up questions",
    detail: "Track what still needs interpretation, clinician input, or a decision after checkout.",
    status: "Ready"
  }
];

function isOpenOrder(order: Order) {
  return order.status !== "CANCELLED" && order.fulfillmentStatus !== "FULFILLED";
}

function needsPayment(order: Order) {
  return order.paymentStatus === "UNPAID" || order.paymentStatus === "FAILED";
}

function newestFirst(a: Order, b: Order) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export default function MyHealthPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const portalStats = useMemo(() => {
    const paidOrders = orders.filter((order) => order.paymentStatus === "PAID");
    const totalPaid = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);

    return {
      openOrderCount: orders.filter(isOpenOrder).length,
      unpaidOrderCount: orders.filter(needsPayment).length,
      orderCount: orders.length,
      totalPaid: totalPaid.toFixed(2)
    };
  }, [orders]);

  const latestOrder = useMemo(() => [...orders].sort(newestFirst)[0] ?? null, [orders]);
  const displayName = currentUser?.name ?? currentUser?.email ?? "Your health workspace";

  const nextActions = useMemo(() => {
    const actions = [
      {
        title: "Start with a health area",
        detail: "Choose a concern like fatigue, metabolic health, hormones, genetics, skin, or labs.",
        href: "/health-areas",
        action: "Browse Areas",
        priority: "Primary"
      },
      {
        title: "Update account settings",
        detail: "Keep name, phone, shipping addresses, and account details current.",
        href: "/account",
        action: "Settings",
        priority: "Profile"
      }
    ];

    if (portalStats.unpaidOrderCount > 0) {
      actions.unshift({
        title: "Complete payment",
        detail: `${portalStats.unpaidOrderCount} order${portalStats.unpaidOrderCount === 1 ? "" : "s"} need payment.`,
        href: "/orders",
        action: "Review Orders",
        priority: "Urgent"
      });
    }

    if (latestOrder) {
      actions.splice(1, 0, {
        title: "Review latest order",
        detail: `${latestOrder.orderNumber} is ${latestOrder.paymentStatus.toLowerCase()} and ${latestOrder.fulfillmentStatus.toLowerCase()}.`,
        href: `/orders/${encodeURIComponent(latestOrder.orderNumber)}`,
        action: "Open Order",
        priority: "Order"
      });
    }

    return actions.slice(0, 4);
  }, [latestOrder, portalStats.unpaidOrderCount]);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      setError(null);

      if (!isAuthConfigured() || !getSession()) {
        if (isMounted) {
          setNeedsSignIn(true);
          setIsLoading(false);
        }
        return;
      }

      try {
        const [user, nextOrders] = await Promise.all([getMe(), getMyOrders()]);

        if (isMounted) {
          setCurrentUser(user);
          setOrders(nextOrders);
        }
      } catch (caught) {
        if (isMounted) {
          setNeedsSignIn(true);
          setError(caught instanceof Error ? caught.message : "Could not load patient portal");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="shell">
      <section className="topbar" aria-label="Patient Portal navigation">
        <CustomerBrand />
        <div className="nav-actions">
          <CustomerNav />
        </div>
      </section>

      {error ? <p className="error global-error">{error}</p> : null}

      <section className="portal-dashboard-header" aria-label="Patient Portal">
        <div className="portal-header-copy">
          <p className="eyebrow">Patient Portal</p>
          <h1>My Health</h1>
          <p>
            Keep orders, results, health areas, and follow-up questions connected so each next step has context.
          </p>
          <div className="portal-header-tags" aria-label="My Health workspace status">
            <span>Orders</span>
            <span>Results planned</span>
            <span>Care paths</span>
          </div>
        </div>
        <div className="portal-header-actions">
          {needsSignIn ? (
            <button type="button" onClick={() => void startLogin()}>
              Sign In
            </button>
          ) : (
            <>
              <Link className="nav-link primary-link" href="/">
                Choose Goal
              </Link>
              <Link className="nav-link" href="/orders">
                Orders
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="portal-status-strip" aria-label="Portal status">
        <div className="portal-identity-card">
          <span aria-hidden="true">{currentUser?.email?.slice(0, 1).toUpperCase() ?? "P"}</span>
          <div>
            <small>{currentUser ? "Signed in as" : "Portal access"}</small>
            <strong>{displayName}</strong>
          </div>
        </div>
        <div>
          <small>Portal Status</small>
          <strong>{currentUser ? "Active" : "Sign-in required"}</strong>
        </div>
        <div>
          <small>Last Updated</small>
          <strong>{formatPortalDate(latestOrder?.updatedAt ?? currentUser?.updatedAt)}</strong>
        </div>
        <div>
          <small>Care Records</small>
          <strong>Planned</strong>
        </div>
      </section>

      {isLoading ? (
        <section className="panel">
          <div className="empty-state compact">Loading patient portal</div>
        </section>
      ) : null}

      {!isLoading ? (
        <>
          <section className="portal-metric-grid" aria-label="Portal summary">
            <Link className="metric metric-link" href="/orders">
              <span>Orders</span>
              <strong>{portalStats.orderCount}</strong>
              <small>Total history</small>
            </Link>
            <Link className="metric metric-link" href="/orders">
              <span>Open</span>
              <strong>{portalStats.openOrderCount}</strong>
              <small>Not fulfilled</small>
            </Link>
            <Link className="metric metric-link" href="/orders">
              <span>Payment</span>
              <strong>{portalStats.unpaidOrderCount}</strong>
              <small>Need attention</small>
            </Link>
            <div className="metric">
              <span>Paid Total</span>
              <strong>{formatMoney(portalStats.totalPaid, "USD")}</strong>
              <small>Completed orders</small>
            </div>
          </section>

          <section className="portal-workspace-grid" aria-label="Health workspace preview">
            {workspaceModules.map((module) => (
              <article className="portal-workspace-card" key={module.title}>
                <span>{module.status}</span>
                <h2>{module.title}</h2>
                <p>{module.detail}</p>
              </article>
            ))}
          </section>

          <section className="portal-dashboard" aria-label="Patient portal dashboard">
            <div className="portal-main-column">
              <section className="panel portal-panel" aria-label="Next actions">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Next Actions</p>
                    <h2>What needs attention</h2>
                  </div>
                </div>
                <div className="portal-action-list">
                  {nextActions.map((item) => (
                    <Link className="portal-action-row" href={item.href} key={`${item.priority}-${item.title}`}>
                      <span>{item.priority}</span>
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.detail}</p>
                      </div>
                      <small>{item.action}</small>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="panel portal-panel" aria-label="Care workspace">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Care Workspace</p>
                    <h2>Healthcare areas</h2>
                  </div>
                </div>
                <div className="portal-care-table">
                  {careModules.map((module) => (
                    <Link className="portal-care-row" href={module.href} key={module.title}>
                      <span>{module.status}</span>
                      <div>
                        <strong>{module.title}</strong>
                        <p>{module.detail}</p>
                      </div>
                      <small>{module.action}</small>
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            <aside className="portal-side-column">
              <section className="panel portal-panel" aria-label="Latest order">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Latest Order</p>
                    <h2>{latestOrder?.orderNumber ?? "No orders yet"}</h2>
                  </div>
                  {latestOrder ? <span className={`pill ${statusClass(latestOrder.paymentStatus)}`}>{latestOrder.paymentStatus}</span> : null}
                </div>
                {latestOrder ? (
                  <>
                    <dl className="portal-detail-list">
                      <div>
                        <dt>Total</dt>
                        <dd>{formatMoney(latestOrder.total, latestOrder.currency)}</dd>
                      </div>
                      <div>
                        <dt>Fulfillment</dt>
                        <dd>{latestOrder.fulfillmentStatus}</dd>
                      </div>
                      <div>
                        <dt>Created</dt>
                        <dd>{formatDateTime(latestOrder.createdAt)}</dd>
                      </div>
                    </dl>
                    <Link className="nav-link primary-link" href={`/orders/${encodeURIComponent(latestOrder.orderNumber)}`}>
                      Open Order
                    </Link>
                  </>
                ) : (
                  <div className="empty-state compact">
                    <p>Orders and payment recovery will appear here after checkout.</p>
                    <Link className="nav-link" href="/shop">
                      Browse Products
                    </Link>
                  </div>
                )}
              </section>

              <section className="panel portal-panel" aria-label="Account tools">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Account</p>
                    <h2>Tools</h2>
                  </div>
                </div>
                <div className="portal-tool-list">
                  <Link href="/account">Profile settings</Link>
                  <Link href="/addresses">Saved addresses</Link>
                  <Link href="/orders">Order history</Link>
                  <Link href="/cart">Cart</Link>
                </div>
              </section>
            </aside>
          </section>
        </>
      ) : null}
    </main>
  );
}
