"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CustomerNav } from "../../../src/components/CustomerNav";
import { Order, getOrder } from "../../../src/lib/api";
import { getSession, isAuthConfigured, startLogin } from "../../../src/lib/auth";
import { formatDateTime, formatMoney, statusClass, trackingUrl } from "../../../src/lib/format";

function addressLabel(address: Order["addresses"][number]) {
  return [
    address.recipientName,
    address.line1,
    address.line2,
    [address.city, address.state, address.postalCode].filter(Boolean).join(", "),
    address.country,
    address.phone
  ].filter(Boolean);
}

export default function OrderDetailPage() {
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = decodeURIComponent(params.orderNumber);
  const [order, setOrder] = useState<Order | null>(null);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOrder() {
      setIsLoading(true);
      setError(null);
      setNeedsSignIn(false);

      if (!isAuthConfigured()) {
        setOrder(null);
        setError("Auth is not configured");
        setIsLoading(false);
        return;
      }

      if (!getSession()) {
        setOrder(null);
        setNeedsSignIn(true);
        setIsLoading(false);
        return;
      }

      try {
        const nextOrder = await getOrder(orderNumber);

        if (isMounted) {
          setOrder(nextOrder);
        }
      } catch (caught) {
        if (isMounted) {
          setOrder(null);
          setError(caught instanceof Error ? caught.message : "Order not found");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadOrder();

    return () => {
      isMounted = false;
    };
  }, [orderNumber]);

  return (
    <main className="shell">
      <section className="topbar" aria-label="Order navigation">
        <div>
          <p className="eyebrow">Order</p>
          <h1>{order?.orderNumber ?? orderNumber}</h1>
        </div>
        <div className="nav-actions">
          <CustomerNav />
          <button
            className="secondary"
            type="button"
            disabled={isLoading || needsSignIn}
            onClick={() => {
              void getOrder(orderNumber)
                .then(setOrder)
                .catch((caught) =>
                  setError(caught instanceof Error ? caught.message : "Could not refresh order")
                );
            }}
          >
            {isLoading ? "Loading" : "Refresh"}
          </button>
        </div>
      </section>

      {error ? <p className="error global-error">{error}</p> : null}

      {needsSignIn ? (
        <section className="panel">
          <div className="empty-state compact">Sign in to view this order</div>
          <button type="button" onClick={() => void startLogin()}>
            Sign In
          </button>
        </section>
      ) : null}

      {!order && !error && !needsSignIn ? (
        <section className="panel">
          <div className="empty-state compact">Loading order</div>
        </section>
      ) : null}

      {order ? (
        <>
          <section className="summary-grid" aria-label="Order status summary">
            <div className="metric wide">
              <span>Order</span>
              <strong>{order.orderNumber}</strong>
            </div>
            <div className="metric">
              <span>Total</span>
              <strong>{formatMoney(order.total, order.currency)}</strong>
            </div>
            <div className="metric">
              <span>Payment</span>
              <strong>{order.paymentStatus}</strong>
            </div>
            <div className="metric">
              <span>Fulfillment</span>
              <strong>{order.fulfillmentStatus}</strong>
            </div>
          </section>

          <section className="order-detail-layout">
            <section className="panel order-detail-main" aria-label="Order items">
              <div className="panel-heading">
                <h2>Items</h2>
                <span className={`pill ${statusClass(order.status)}`}>{order.status}</span>
              </div>

              <div className="order-detail-lines">
                {order.items.map((item) => (
                  <article key={item.id}>
                    <div>
                      <strong>{item.productName}</strong>
                      <span>{item.variantTitle ?? item.sku}</span>
                      <small>{item.sku}</small>
                    </div>
                    <dl>
                      <div>
                        <dt>Qty</dt>
                        <dd>{item.quantity}</dd>
                      </div>
                      <div>
                        <dt>Unit</dt>
                        <dd>{formatMoney(item.unitPrice, order.currency)}</dd>
                      </div>
                      <div>
                        <dt>Total</dt>
                        <dd>{formatMoney(item.total, order.currency)}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>

              <div className="totals order-detail-totals">
                <div>
                  <span>Subtotal</span>
                  <strong>{formatMoney(order.subtotal, order.currency)}</strong>
                </div>
                <div>
                  <span>Shipping</span>
                  <strong>{formatMoney(order.shippingTotal, order.currency)}</strong>
                </div>
                <div>
                  <span>Tax</span>
                  <strong>{formatMoney(order.taxTotal, order.currency)}</strong>
                </div>
                <div>
                  <span>Total</span>
                  <strong>{formatMoney(order.total, order.currency)}</strong>
                </div>
              </div>
            </section>

            <aside className="side-stack order-detail-side">
              <section className="panel" aria-label="Order timeline">
                <div className="panel-heading">
                  <h2>Status</h2>
                </div>
                <div className="status-row">
                  <span className={`pill ${statusClass(order.paymentStatus)}`}>
                    {order.paymentStatus}
                  </span>
                  <span className={`pill ${statusClass(order.fulfillmentStatus)}`}>
                    {order.fulfillmentStatus}
                  </span>
                </div>
                <dl className="order-meta">
                  <div>
                    <dt>Created</dt>
                    <dd>{formatDateTime(order.createdAt)}</dd>
                  </div>
                  <div>
                    <dt>Placed</dt>
                    <dd>{formatDateTime(order.placedAt)}</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>{formatDateTime(order.updatedAt)}</dd>
                  </div>
                </dl>
              </section>

              <section className="panel" aria-label="Shipping and billing addresses">
                <div className="panel-heading">
                  <h2>Addresses</h2>
                </div>
                <div className="address-list">
                  {order.addresses.map((address) => (
                    <article key={address.id}>
                      <span>{address.type}</span>
                      {addressLabel(address).map((line) => (
                        <strong key={line}>{line}</strong>
                      ))}
                    </article>
                  ))}
                </div>
              </section>
            </aside>
          </section>

          <section className="order-detail-layout">
            <section className="panel" aria-label="Shipments">
              <div className="panel-heading">
                <h2>Shipments</h2>
              </div>
              {order.shipments.length === 0 ? (
                <div className="empty-state compact">No shipments yet</div>
              ) : (
                <div className="shipment-detail-list">
                  {order.shipments.map((shipment) => {
                    const url = trackingUrl(shipment.carrier, shipment.trackingNumber);

                    return (
                      <article key={shipment.id}>
                        <div className="shipment-row-heading">
                          <div>
                            <span>{shipment.carrier ?? "Shipment"}</span>
                            <strong>{shipment.status}</strong>
                          </div>
                          {shipment.trackingNumber ? (
                            url ? (
                              <a href={url} rel="noreferrer" target="_blank">
                                {shipment.trackingNumber}
                              </a>
                            ) : (
                              <strong>{shipment.trackingNumber}</strong>
                            )
                          ) : (
                            <strong>No tracking</strong>
                          )}
                        </div>
                        <dl className="order-meta compact">
                          <div>
                            <dt>Shipped</dt>
                            <dd>{formatDateTime(shipment.shippedAt)}</dd>
                          </div>
                          <div>
                            <dt>Delivered</dt>
                            <dd>{formatDateTime(shipment.deliveredAt)}</dd>
                          </div>
                        </dl>
                        {shipment.items.length > 0 ? (
                          <div className="shipment-item-list">
                            {shipment.items.map((item) => (
                              <div key={item.id}>
                                <span>{item.orderItem.sku}</span>
                                <strong>
                                  {item.quantity} of {item.orderItem.quantity}
                                </strong>
                                <small>{item.orderItem.productName}</small>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="panel" aria-label="Payments">
              <div className="panel-heading">
                <h2>Payments</h2>
              </div>
              {order.payments.length === 0 ? (
                <div className="empty-state compact">No payment records yet</div>
              ) : (
                <div className="payment-detail-list">
                  {order.payments.map((payment) => (
                    <article key={payment.id}>
                      <div>
                        <span>{payment.provider}</span>
                        <strong>{payment.status}</strong>
                      </div>
                      <strong>{formatMoney(payment.amount, payment.currency)}</strong>
                      <small>{formatDateTime(payment.processedAt ?? payment.createdAt)}</small>
                    </article>
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
