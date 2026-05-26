"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OrderSummary } from "../../src/components/OrderSummary";
import {
  ApiStatus,
  Order,
  PaymentWithOrder,
  apiBaseUrl,
  authorizePayment,
  createManualPayment,
  createShipment,
  getReadiness,
  listAdminOrders,
  markPaymentFailed,
  markPaymentPaid,
  markShipmentDelivered,
  markShipmentReturned,
  markShipmentShipped,
  refundPayment,
  updateShipmentTracking
} from "../../src/lib/api";
import { actionButtonClass, formatMoney } from "../../src/lib/format";

export default function AdminPage() {
  const [status, setStatus] = useState<ApiStatus>("checking");
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [selectedAdminOrderId, setSelectedAdminOrderId] = useState("");
  const [shipmentCarrier, setShipmentCarrier] = useState("UPS");
  const [shipmentTrackingNumber, setShipmentTrackingNumber] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedAdminOrder =
    adminOrders.find((order) => order.id === selectedAdminOrderId) ?? adminOrders[0] ?? null;

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        await getReadiness();
        const orders = await listAdminOrders();

        if (!isMounted) {
          return;
        }

        applyAdminOrders(orders);
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

  function applyAdminOrders(orders: Order[], preferredOrderId?: string) {
    setAdminOrders(orders);
    setSelectedAdminOrderId((current) => {
      if (preferredOrderId && orders.some((order) => order.id === preferredOrderId)) {
        return preferredOrderId;
      }

      return current && orders.some((order) => order.id === current) ? current : orders[0]?.id ?? "";
    });
  }

  function syncAdminOrder(order: Order) {
    setAdminOrders((current) => {
      const next = [order, ...current.filter((item) => item.id !== order.id)];

      return next.sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt));
    });
    setSelectedAdminOrderId(order.id);
  }

  async function reloadAdminOrders(preferredOrderId?: string) {
    const orders = await listAdminOrders();
    applyAdminOrders(orders, preferredOrderId);

    return orders;
  }

  async function refreshAdminOrders() {
    setPendingAction("admin-orders");
    setError(null);
    setNotice(null);

    try {
      await reloadAdminOrders(selectedAdminOrder?.id);
      setStatus("online");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not refresh orders");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleCreatePayment(order: Order) {
    setPendingAction(`create-payment-${order.id}`);
    setError(null);
    setNotice(null);

    try {
      const payment = await createManualPayment(order);
      syncAdminOrder(payment.order);
      await reloadAdminOrders(payment.order.id);
      setNotice(`Created manual payment for ${payment.order.orderNumber}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create payment");
    } finally {
      setPendingAction(null);
    }
  }

  async function handlePaymentAction(
    paymentId: string,
    action: (paymentId: string) => Promise<PaymentWithOrder>
  ) {
    setPendingAction(`payment-${paymentId}`);
    setError(null);
    setNotice(null);

    try {
      const payment = await action(paymentId);
      syncAdminOrder(payment.order);
      await reloadAdminOrders(payment.order.id);
      setNotice(`Payment is now ${payment.status}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update payment");
    } finally {
      setPendingAction(null);
    }
  }

  function shipmentInput() {
    return {
      carrier: shipmentCarrier.trim() || undefined,
      trackingNumber: shipmentTrackingNumber.trim() || undefined
    };
  }

  async function handleCreateShipment(order: Order) {
    setPendingAction(`create-shipment-${order.id}`);
    setError(null);
    setNotice(null);

    try {
      const shipment = await createShipment(order.id, shipmentInput());
      syncAdminOrder(shipment.order);
      setNotice(`Created shipment for ${shipment.order.orderNumber}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create shipment");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleUpdateTracking(shipmentId: string) {
    setPendingAction(`shipment-${shipmentId}`);
    setError(null);
    setNotice(null);

    try {
      const shipment = await updateShipmentTracking(shipmentId, shipmentInput());
      syncAdminOrder(shipment.order);
      setNotice("Tracking updated");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update tracking");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleShipmentAction(
    shipmentId: string,
    action: (shipmentId: string) => Promise<{ order: Order }>
  ) {
    setPendingAction(`shipment-${shipmentId}`);
    setError(null);
    setNotice(null);

    try {
      const shipment = await action(shipmentId);
      syncAdminOrder(shipment.order);
      setNotice(`Shipment updated for ${shipment.order.orderNumber}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update shipment");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <main className="shell">
      <section className="topbar" aria-label="Admin status">
        <div>
          <p className="eyebrow">Tele</p>
          <h1>Admin</h1>
        </div>
        <div className="nav-actions">
          <Link className="nav-link" href="/">
            Shop
          </Link>
          <div className={`status ${status}`}>
            <span aria-hidden="true" />
            {status}
          </div>
        </div>
      </section>

      <section className="summary-grid" aria-label="Admin summary">
        <div className="metric wide">
          <span>API</span>
          <strong>{apiBaseUrl}</strong>
        </div>
        <div className="metric">
          <span>Orders</span>
          <strong>{adminOrders.length}</strong>
        </div>
        <div className="metric">
          <span>Payment</span>
          <strong>{selectedAdminOrder?.paymentStatus ?? "-"}</strong>
        </div>
        <div className="metric">
          <span>Fulfillment</span>
          <strong>{selectedAdminOrder?.fulfillmentStatus ?? "-"}</strong>
        </div>
      </section>

      {error ? <p className="error global-error">{error}</p> : null}
      {notice ? <p className="notice global-error">{notice}</p> : null}

      <section className="workspace">
        <section className="catalog" aria-label="Orders">
          <section className="panel admin-panel">
            <div className="panel-heading">
              <h2>Recent Orders</h2>
              <button
                className="secondary"
                type="button"
                disabled={pendingAction === "admin-orders"}
                onClick={() => void refreshAdminOrders()}
              >
                {pendingAction === "admin-orders" ? "Refreshing" : "Refresh"}
              </button>
            </div>

            {adminOrders.length === 0 ? (
              <div className="empty-state compact">No orders</div>
            ) : (
              <>
                <label>
                  <span>Order</span>
                  <select
                    value={selectedAdminOrder?.id ?? ""}
                    onChange={(event) => setSelectedAdminOrderId(event.target.value)}
                  >
                    {adminOrders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.orderNumber} - {order.paymentStatus} -{" "}
                        {formatMoney(order.total, order.currency)}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedAdminOrder ? <OrderSummary order={selectedAdminOrder} /> : null}
              </>
            )}
          </section>
        </section>

        <aside className="side-stack">
          <section className="panel admin-panel" aria-label="Admin payments">
            <div className="panel-heading">
              <h2>Payments</h2>
            </div>

            {!selectedAdminOrder ? (
              <div className="empty-state compact">No order selected</div>
            ) : (
              <div className="payment-list">
                {selectedAdminOrder.payments.length === 0 ? (
                  <button
                    type="button"
                    disabled={pendingAction === `create-payment-${selectedAdminOrder.id}`}
                    onClick={() => void handleCreatePayment(selectedAdminOrder)}
                  >
                    {pendingAction === `create-payment-${selectedAdminOrder.id}`
                      ? "Creating"
                      : "Create Manual Payment"}
                  </button>
                ) : (
                  selectedAdminOrder.payments.map((payment) => {
                    const isBusy = pendingAction === `payment-${payment.id}`;

                    return (
                      <article className="payment-row" key={payment.id}>
                        <div className="payment-row-heading">
                          <div>
                            <span>{payment.provider}</span>
                            <strong>{payment.status}</strong>
                          </div>
                          <strong>{formatMoney(payment.amount, payment.currency)}</strong>
                        </div>

                        <div className="payment-controls">
                          <button
                            className={actionButtonClass(payment.status === "AUTHORIZED")}
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handlePaymentAction(payment.id, authorizePayment)}
                          >
                            Authorize
                          </button>
                          <button
                            className={actionButtonClass(payment.status === "PAID")}
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handlePaymentAction(payment.id, markPaymentPaid)}
                          >
                            Paid
                          </button>
                          <button
                            className={actionButtonClass(payment.status === "FAILED")}
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handlePaymentAction(payment.id, markPaymentFailed)}
                          >
                            Failed
                          </button>
                          <button
                            className={actionButtonClass(payment.status === "REFUNDED")}
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handlePaymentAction(payment.id, refundPayment)}
                          >
                            Refund
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            )}
          </section>

          <section className="panel admin-panel" aria-label="Admin fulfillment">
            <div className="panel-heading">
              <h2>Fulfillment</h2>
            </div>

            {!selectedAdminOrder ? (
              <div className="empty-state compact">No order selected</div>
            ) : (
              <>
                <div className="form-grid">
                  <label>
                    <span>Carrier</span>
                    <input
                      value={shipmentCarrier}
                      onChange={(event) => setShipmentCarrier(event.target.value)}
                      placeholder="UPS"
                    />
                  </label>
                  <label>
                    <span>Tracking</span>
                    <input
                      value={shipmentTrackingNumber}
                      onChange={(event) => setShipmentTrackingNumber(event.target.value)}
                      placeholder="1Z..."
                    />
                  </label>
                </div>

                <div className="shipment-list">
                  {selectedAdminOrder.shipments.length === 0 ? (
                    <button
                      type="button"
                      disabled={pendingAction === `create-shipment-${selectedAdminOrder.id}`}
                      onClick={() => void handleCreateShipment(selectedAdminOrder)}
                    >
                      {pendingAction === `create-shipment-${selectedAdminOrder.id}`
                        ? "Creating"
                        : "Create Shipment"}
                    </button>
                  ) : (
                    selectedAdminOrder.shipments.map((shipment) => {
                      const isBusy = pendingAction === `shipment-${shipment.id}`;

                      return (
                        <article className="shipment-row" key={shipment.id}>
                          <div className="shipment-row-heading">
                            <div>
                              <span>{shipment.carrier ?? "Carrier pending"}</span>
                              <strong>{shipment.status}</strong>
                            </div>
                            <strong>{shipment.trackingNumber ?? "No tracking"}</strong>
                          </div>

                          <div className="shipment-controls">
                            <button
                              className="status-action"
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleUpdateTracking(shipment.id)}
                            >
                              Save Tracking
                            </button>
                            <button
                              className={actionButtonClass(shipment.status === "SHIPPED")}
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleShipmentAction(shipment.id, markShipmentShipped)}
                            >
                              Shipped
                            </button>
                            <button
                              className={actionButtonClass(shipment.status === "DELIVERED")}
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleShipmentAction(shipment.id, markShipmentDelivered)}
                            >
                              Delivered
                            </button>
                            <button
                              className={actionButtonClass(shipment.status === "RETURNED")}
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleShipmentAction(shipment.id, markShipmentReturned)}
                            >
                              Returned
                            </button>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </section>
        </aside>
      </section>
    </main>
  );
}
