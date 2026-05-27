"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AdminOrdersResponse,
  ApiStatus,
  Order,
  Payment,
  PaymentStatus,
  PaymentWithOrder,
  apiBaseUrl,
  authorizePayment,
  createManualPayment,
  createOrderNote,
  createShipment,
  getReadiness,
  listAdminOrders,
  markPaymentFailed,
  markPaymentPaid,
  markShipmentDelivered,
  markShipmentReturned,
  markShipmentShipped,
  refundPayment,
  syncStripePayment,
  updateShipmentTracking
} from "../../src/lib/api";
import { getSession, isAuthConfigured, signOut, startLogin } from "../../src/lib/auth";
import {
  actionButtonClass,
  formatDateTime,
  formatMoney,
  statusClass,
  trackingUrl
} from "../../src/lib/format";

const carrierOptions = ["UPS", "USPS", "FedEx", "DHL"];
const paymentFilterOptions: Array<"ALL" | PaymentStatus> = [
  "ALL",
  "UNPAID",
  "AUTHORIZED",
  "PAID",
  "FAILED",
  "REFUNDED",
  "DISPUTED"
];
const fulfillmentFilterOptions: Array<"ALL" | Order["fulfillmentStatus"]> = [
  "ALL",
  "UNFULFILLED",
  "PARTIAL",
  "FULFILLED",
  "RETURNED"
];
const dateFilterOptions = [
  { label: "Any event", value: "ANY" },
  { label: "Order created", value: "ORDER_CREATED" },
  { label: "Order placed", value: "ORDER_PLACED" },
  { label: "Order updated", value: "ORDER_UPDATED" },
  { label: "Shipment created", value: "SHIPMENT_CREATED" },
  { label: "Shipment shipped", value: "SHIPMENT_SHIPPED" },
  { label: "Shipment delivered", value: "SHIPMENT_DELIVERED" }
] as const;
const orderSortOptions = [
  { label: "Newest created", value: "CREATED_DESC" },
  { label: "Oldest created", value: "CREATED_ASC" },
  { label: "Most recently edited", value: "UPDATED_DESC" },
  { label: "Most recently placed", value: "PLACED_DESC" },
  { label: "Most recently shipped", value: "SHIPPED_DESC" },
  { label: "Most recently delivered", value: "DELIVERED_DESC" },
  { label: "Highest total", value: "TOTAL_DESC" },
  { label: "Lowest total", value: "TOTAL_ASC" }
] as const;
const orderPageSizeOptions = [5, 10, 20];
type DateFilterField = (typeof dateFilterOptions)[number]["value"];
type OrderSortField = (typeof orderSortOptions)[number]["value"];

function isPaymentActionDisabled(payment: Payment, targetStatus: PaymentStatus, isBusy: boolean) {
  return isBusy || payment.status === targetStatus;
}

function canFulfillOrder(order: Order) {
  return order.paymentStatus === "PAID" || order.paymentStatus === "AUTHORIZED";
}

function orderCustomerName(order: Order) {
  return (
    order.addresses.find((address) => address.type === "SHIPPING")?.recipientName.trim() ||
    order.addresses.find((address) => address.type === "BILLING")?.recipientName.trim() ||
    "Guest customer"
  );
}

function orderItemCount(order: Order) {
  return order.items.reduce((total, item) => total + item.quantity, 0);
}

function pluralizeItems(count: number) {
  return count === 1 ? "1 item" : `${count} items`;
}

function eventSourceLabel(source: string) {
  return source.toLowerCase().replace(/_/g, " ");
}

function trackingChangeLabel(
  fromCarrier: string | null,
  fromTrackingNumber: string | null,
  toCarrier: string | null,
  toTrackingNumber: string | null
) {
  const from = [fromCarrier, fromTrackingNumber].filter(Boolean).join(" ") || "No tracking";
  const to = [toCarrier, toTrackingNumber].filter(Boolean).join(" ") || "No tracking";

  return `${from} -> ${to}`;
}

type AdminTimelineItem = {
  id: string;
  createdAt: string;
  type: "Order" | "Note" | "Payment" | "Fulfillment" | "Tracking";
  title: string;
  detail?: string;
};

function orderTimeline(order: Order): AdminTimelineItem[] {
  const items: AdminTimelineItem[] = [
    {
      id: `order-created-${order.id}`,
      createdAt: order.createdAt,
      type: "Order",
      title: "Order created",
      detail: order.email
    }
  ];

  if (order.placedAt) {
    items.push({
      id: `order-placed-${order.id}`,
      createdAt: order.placedAt,
      type: "Order",
      title: "Order placed",
      detail: order.status
    });
  }

  for (const note of order.notes ?? []) {
    items.push({
      id: `note-${note.id}`,
      createdAt: note.createdAt,
      type: "Note",
      title: note.body,
      detail: note.authorEmail ?? "admin"
    });
  }

  for (const payment of order.payments) {
    for (const event of payment.statusEvents) {
      items.push({
        id: `payment-${event.id}`,
        createdAt: event.createdAt,
        type: "Payment",
        title: `${event.fromStatus ?? "START"} -> ${event.toStatus}`,
        detail: `${payment.provider} ${formatMoney(payment.amount, payment.currency)} - ${eventSourceLabel(event.source)}${
          event.reason ? `: ${event.reason}` : ""
        }`
      });
    }

    if (payment.statusEvents.length === 0) {
      items.push({
        id: `payment-created-${payment.id}`,
        createdAt: payment.createdAt,
        type: "Payment",
        title: `Payment ${payment.status.toLowerCase()}`,
        detail: `${payment.provider} ${formatMoney(payment.amount, payment.currency)}`
      });
    }
  }

  for (const shipment of order.shipments) {
    for (const event of shipment.statusEvents) {
      items.push({
        id: `shipment-status-${event.id}`,
        createdAt: event.createdAt,
        type: "Fulfillment",
        title: `${event.fromStatus ?? "START"} -> ${event.toStatus}`,
        detail: `${shipment.carrier ?? "Shipment"} - ${eventSourceLabel(event.source)}${
          event.reason ? `: ${event.reason}` : ""
        }`
      });
    }

    for (const event of shipment.trackingEvents) {
      items.push({
        id: `shipment-tracking-${event.id}`,
        createdAt: event.createdAt,
        type: "Tracking",
        title: trackingChangeLabel(
          event.fromCarrier,
          event.fromTrackingNumber,
          event.toCarrier,
          event.toTrackingNumber
        ),
        detail: `${shipment.status} - ${eventSourceLabel(event.source)}${
          event.reason ? `: ${event.reason}` : ""
        }`
      });
    }
  }

  return items.sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt));
}

function AdminOrderDetails({ order }: { order: Order }) {
  return (
    <section className="admin-detail-grid" aria-label="Order timestamps">
      <div>
        <span>Created</span>
        <strong>{formatDateTime(order.createdAt)}</strong>
      </div>
      <div>
        <span>Placed</span>
        <strong>{formatDateTime(order.placedAt)}</strong>
      </div>
      <div>
        <span>Updated</span>
        <strong>{formatDateTime(order.updatedAt)}</strong>
      </div>
      <div>
        <span>Customer</span>
        <strong>{orderCustomerName(order)}</strong>
        <small>{order.email}</small>
      </div>
    </section>
  );
}

function AdminOrderSnapshot({ order }: { order: Order }) {
  return (
    <>
      <AdminOrderDetails order={order} />

      <div className="order-lines">
        {order.items.map((item) => (
          <div key={item.id}>
            <span>
              {item.productName} x {item.quantity}
            </span>
            <strong>{formatMoney(item.total, order.currency)}</strong>
          </div>
        ))}
      </div>

      {order.shipments.length > 0 ? (
        <div className="shipment-summary-list">
          {order.shipments.map((shipment) => {
            const url = trackingUrl(shipment.carrier, shipment.trackingNumber);

            return (
              <div key={shipment.id}>
                <span>{shipment.carrier ?? "Shipment"}</span>
                <strong>{shipment.status}</strong>
                {shipment.trackingNumber ? (
                  url ? (
                    <a href={url} rel="noreferrer" target="_blank">
                      {shipment.trackingNumber}
                    </a>
                  ) : (
                    <small>{shipment.trackingNumber}</small>
                  )
                ) : (
                  <small>No tracking</small>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </>
  );
}

function AdminOrderTimeline({ order }: { order: Order }) {
  const items = orderTimeline(order);

  return (
    <section className="admin-work-section" aria-label="Order activity timeline">
      <div className="panel-heading">
        <h3>Timeline</h3>
      </div>

      <ol className="timeline-list">
        {items.map((item) => (
          <li key={item.id}>
            <div>
              <span>{item.type}</span>
              <small>{formatDateTime(item.createdAt)}</small>
            </div>
            <strong>{item.title}</strong>
            {item.detail ? <p>{item.detail}</p> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function AdminPage() {
  const [status, setStatus] = useState<ApiStatus>("checking");
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminOrderTotal, setAdminOrderTotal] = useState(0);
  const [adminOrderPageCount, setAdminOrderPageCount] = useState(1);
  const [selectedAdminOrderId, setSelectedAdminOrderId] = useState("");
  const [newShipmentCarrier, setNewShipmentCarrier] = useState("UPS");
  const [newShipmentTrackingNumber, setNewShipmentTrackingNumber] = useState("");
  const [shipmentTrackingDrafts, setShipmentTrackingDrafts] = useState<
    Record<string, { carrier: string; trackingNumber: string }>
  >({});
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState<Record<string, boolean>>({});
  const [shipmentHistoryOpen, setShipmentHistoryOpen] = useState<Record<string, boolean>>({});
  const [orderNoteDrafts, setOrderNoteDrafts] = useState<Record<string, string>>({});
  const [orderSearch, setOrderSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | PaymentStatus>("ALL");
  const [fulfillmentFilter, setFulfillmentFilter] = useState<"ALL" | Order["fulfillmentStatus"]>("ALL");
  const [dateFilter, setDateFilter] = useState<DateFilterField>("ANY");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [orderSort, setOrderSort] = useState<OrderSortField>("CREATED_DESC");
  const [orderPageSize, setOrderPageSize] = useState(5);
  const [orderPage, setOrderPage] = useState(1);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);

  const visibleOrderPage = Math.min(orderPage, adminOrderPageCount);
  const selectedAdminOrder =
    adminOrders.find((order) => order.id === selectedAdminOrderId) ?? adminOrders[0] ?? null;

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const session = isAuthConfigured() ? getSession() : null;
        setHasSession(Boolean(session));

        if (isAuthConfigured() && !session) {
          setStatus("offline");
          setError("Sign in with an admin account");
          return;
        }

        await getReadiness();
        const response = await listAdminOrders(adminOrderQuery(1));

        if (!isMounted) {
          return;
        }

        applyAdminOrders(response);
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
    setOrderPage(1);
  }, [
    dateFilter,
    dateFrom,
    dateTo,
    fulfillmentFilter,
    orderPageSize,
    orderSearch,
    orderSort,
    paymentFilter
  ]);

  useEffect(() => {
    if (status !== "online") {
      return;
    }

    void reloadAdminOrders(selectedAdminOrderId, orderPage);
  }, [
    dateFilter,
    dateFrom,
    dateTo,
    fulfillmentFilter,
    orderPage,
    orderPageSize,
    orderSearch,
    orderSort,
    paymentFilter,
    status
  ]);

  function adminOrderQuery(page = orderPage) {
    return {
      search: orderSearch,
      payment: paymentFilter,
      fulfillment: fulfillmentFilter,
      dateField: dateFilter,
      dateFrom,
      dateTo,
      sort: orderSort,
      page,
      pageSize: orderPageSize
    };
  }

  function applyAdminOrders(response: AdminOrdersResponse, preferredOrderId?: string) {
    setAdminOrders(response.orders);
    setAdminOrderTotal(response.total);
    setAdminOrderPageCount(response.pageCount);
    setOrderPage(response.page);
    setSelectedAdminOrderId((current) => {
      if (preferredOrderId && response.orders.some((order) => order.id === preferredOrderId)) {
        return preferredOrderId;
      }

      return current && response.orders.some((order) => order.id === current)
        ? current
        : response.orders[0]?.id ?? "";
    });
  }

  function syncAdminOrder(order: Order) {
    setAdminOrders((current) => {
      if (!current.some((item) => item.id === order.id)) {
        return current;
      }

      return current.map((item) => (item.id === order.id ? order : item));
    });
    syncShipmentDrafts(order);

    if (adminOrders.some((item) => item.id === order.id)) {
      setSelectedAdminOrderId(order.id);
    }
  }

  async function reloadAdminOrders(preferredOrderId?: string, page = orderPage) {
    const response = await listAdminOrders(adminOrderQuery(page));
    applyAdminOrders(response, preferredOrderId);
    const preferredOrder =
      response.orders.find((order) => order.id === preferredOrderId) ?? response.orders[0];

    if (preferredOrder) {
      syncShipmentDrafts(preferredOrder);
    }

    return response.orders;
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

  function newShipmentInput() {
    return {
      carrier: newShipmentCarrier.trim() || undefined,
      trackingNumber: newShipmentTrackingNumber.trim() || undefined
    };
  }

  function shipmentTrackingInput(shipmentId: string) {
    const draft = shipmentTrackingDrafts[shipmentId];
    const shipment = selectedAdminOrder?.shipments.find((item) => item.id === shipmentId);

    return {
      carrier: draft?.carrier.trim() || shipment?.carrier || undefined,
      trackingNumber: draft?.trackingNumber.trim() || shipment?.trackingNumber || undefined
    };
  }

  function updateShipmentDraft(
    shipmentId: string,
    field: "carrier" | "trackingNumber",
    value: string
  ) {
    setShipmentTrackingDrafts((current) => ({
      ...current,
      [shipmentId]: {
        carrier: current[shipmentId]?.carrier ?? "UPS",
        trackingNumber: current[shipmentId]?.trackingNumber ?? "",
        [field]: value
      }
    }));
  }

  function syncShipmentDrafts(order: Order) {
    setShipmentTrackingDrafts((current) => {
      const next = { ...current };

      for (const shipment of order.shipments) {
        next[shipment.id] = {
          carrier: shipment.carrier ?? next[shipment.id]?.carrier ?? "UPS",
          trackingNumber: shipment.trackingNumber ?? next[shipment.id]?.trackingNumber ?? ""
        };
      }

      return next;
    });
  }

  async function handleCreateOrderNote(order: Order) {
    const body = orderNoteDrafts[order.id]?.trim();

    if (!body) {
      return;
    }

    setPendingAction(`order-note-${order.id}`);
    setError(null);
    setNotice(null);

    try {
      const updatedOrder = await createOrderNote(order.id, body);
      syncAdminOrder(updatedOrder);
      setOrderNoteDrafts((current) => ({
        ...current,
        [order.id]: ""
      }));
      setNotice(`Added note to ${updatedOrder.orderNumber}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not add note");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleCreateShipment(order: Order) {
    setPendingAction(`create-shipment-${order.id}`);
    setError(null);
    setNotice(null);

    try {
      const shipment = await createShipment(order.id, newShipmentInput());
      syncAdminOrder(shipment.order);
      await reloadAdminOrders(shipment.order.id);
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
      const shipment = await updateShipmentTracking(shipmentId, shipmentTrackingInput(shipmentId));
      syncAdminOrder(shipment.order);
      await reloadAdminOrders(shipment.order.id);
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
      await reloadAdminOrders(shipment.order.id);
      setNotice(`Shipment updated for ${shipment.order.orderNumber}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update shipment");
    } finally {
      setPendingAction(null);
    }
  }

  function togglePaymentHistory(paymentId: string) {
    setPaymentHistoryOpen((current) => ({
      ...current,
      [paymentId]: !current[paymentId]
    }));
  }

  function toggleShipmentHistory(shipmentId: string) {
    setShipmentHistoryOpen((current) => ({
      ...current,
      [shipmentId]: !current[shipmentId]
    }));
  }

  function renderPaymentSection(order: Order) {
    return (
      <section className="admin-work-section" aria-label="Admin payments">
        <div className="panel-heading">
          <h3>Payments</h3>
        </div>

        <div className="payment-list">
          {order.payments.length === 0 ? (
            <button
              type="button"
              disabled={pendingAction === `create-payment-${order.id}`}
              onClick={() => void handleCreatePayment(order)}
            >
              {pendingAction === `create-payment-${order.id}` ? "Creating" : "Create Manual Payment"}
            </button>
          ) : (
            order.payments.map((payment) => {
              const isBusy = pendingAction === `payment-${payment.id}`;
              const isHistoryOpen = paymentHistoryOpen[payment.id] ?? false;

              return (
                <article className="payment-row" key={payment.id}>
                  <div className="payment-row-heading">
                    <div>
                      <span>{payment.provider}</span>
                      <strong>{payment.status}</strong>
                    </div>
                    <strong>{formatMoney(payment.amount, payment.currency)}</strong>
                  </div>
                  <dl className="order-meta compact">
                    <div>
                      <dt>Created</dt>
                      <dd>{formatDateTime(payment.createdAt)}</dd>
                    </div>
                    <div>
                      <dt>Processed</dt>
                      <dd>{formatDateTime(payment.processedAt)}</dd>
                    </div>
                  </dl>
                  <div className="payment-controls">
                    <button
                      className={actionButtonClass(payment.status === "AUTHORIZED")}
                      type="button"
                      disabled={isPaymentActionDisabled(payment, "AUTHORIZED", isBusy)}
                      onClick={() => void handlePaymentAction(payment.id, authorizePayment)}
                    >
                      Authorize
                    </button>
                    <button
                      className={actionButtonClass(payment.status === "PAID")}
                      type="button"
                      disabled={isPaymentActionDisabled(payment, "PAID", isBusy)}
                      onClick={() => void handlePaymentAction(payment.id, markPaymentPaid)}
                    >
                      Paid
                    </button>
                    <button
                      className={actionButtonClass(payment.status === "FAILED")}
                      type="button"
                      disabled={isPaymentActionDisabled(payment, "FAILED", isBusy)}
                      onClick={() => void handlePaymentAction(payment.id, markPaymentFailed)}
                    >
                      Failed
                    </button>
                    <button
                      className={actionButtonClass(payment.status === "REFUNDED")}
                      type="button"
                      disabled={isPaymentActionDisabled(payment, "REFUNDED", isBusy)}
                      onClick={() => void handlePaymentAction(payment.id, refundPayment)}
                    >
                      Refund
                    </button>
                    {payment.provider === "stripe" ? (
                      <button
                        className="status-action"
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handlePaymentAction(payment.id, syncStripePayment)}
                      >
                        Sync Stripe
                      </button>
                    ) : null}
                    {payment.statusEvents.length > 0 ? (
                      <button
                        className="status-action"
                        type="button"
                        onClick={() => togglePaymentHistory(payment.id)}
                      >
                        {isHistoryOpen ? "Hide History" : `History (${payment.statusEvents.length})`}
                      </button>
                    ) : null}
                  </div>

                  {isHistoryOpen ? (
                    <ol className="status-event-list" aria-label="Payment status history">
                      {payment.statusEvents.map((event) => (
                        <li key={event.id}>
                          <span>{formatDateTime(event.createdAt)}</span>
                          <strong>
                            {event.fromStatus ?? "START"} {"->"} {event.toStatus}
                          </strong>
                          <small>
                            {eventSourceLabel(event.source)}
                            {event.reason ? `: ${event.reason}` : ""}
                          </small>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </section>
    );
  }

  function renderNotesSection(order: Order) {
    const notes = order.notes ?? [];
    const draft = orderNoteDrafts[order.id] ?? "";
    const isBusy = pendingAction === `order-note-${order.id}`;

    return (
      <section className="admin-work-section" aria-label="Admin notes">
        <div className="panel-heading">
          <h3>Notes</h3>
        </div>

        <div className="note-composer">
          <label>
            <span>Internal note</span>
            <textarea
              value={draft}
              onChange={(event) =>
                setOrderNoteDrafts((current) => ({
                  ...current,
                  [order.id]: event.target.value
                }))
              }
              placeholder="Add fulfillment, support, or customer context"
            />
          </label>
          <button
            type="button"
            disabled={isBusy || draft.trim().length === 0}
            onClick={() => void handleCreateOrderNote(order)}
          >
            {isBusy ? "Adding" : "Add Note"}
          </button>
        </div>

        {notes.length > 0 ? (
          <ol className="note-list" aria-label="Internal order notes">
            {notes.map((note) => (
              <li key={note.id}>
                <div>
                  <span>{formatDateTime(note.createdAt)}</span>
                  <small>{note.authorEmail ?? "admin"}</small>
                </div>
                <p>{note.body}</p>
              </li>
            ))}
          </ol>
        ) : (
          <div className="empty-state compact">No internal notes</div>
        )}
      </section>
    );
  }

  function renderFulfillmentSection(order: Order) {
    return (
      <section className="admin-work-section" aria-label="Admin fulfillment">
        <div className="panel-heading">
          <h3>Fulfillment</h3>
        </div>

        {!canFulfillOrder(order) ? (
          <p className="warning">Payment is {order.paymentStatus}; do not fulfill this order.</p>
        ) : null}

        {order.shipments.length === 0 ? (
          <div className="form-grid">
            <label>
              <span>Carrier</span>
              <select
                value={newShipmentCarrier}
                onChange={(event) => setNewShipmentCarrier(event.target.value)}
              >
                {carrierOptions.map((carrier) => (
                  <option key={carrier} value={carrier}>
                    {carrier}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Tracking</span>
              <input
                value={newShipmentTrackingNumber}
                onChange={(event) => setNewShipmentTrackingNumber(event.target.value)}
                placeholder="1Z..."
              />
            </label>
          </div>
        ) : null}

        <div className="shipment-list">
          {order.shipments.length === 0 ? (
            <button
              type="button"
              disabled={pendingAction === `create-shipment-${order.id}` || !canFulfillOrder(order)}
              onClick={() => void handleCreateShipment(order)}
            >
              {pendingAction === `create-shipment-${order.id}` ? "Creating" : "Create Shipment"}
            </button>
          ) : (
            order.shipments.map((shipment) => {
              const isBusy = pendingAction === `shipment-${shipment.id}`;
              const url = trackingUrl(shipment.carrier, shipment.trackingNumber);
              const isHistoryOpen = shipmentHistoryOpen[shipment.id] ?? false;
              const historyCount = shipment.statusEvents.length + shipment.trackingEvents.length;

              return (
                <article className="shipment-row" key={shipment.id}>
                  <div className="shipment-row-heading">
                    <div>
                      <span>{shipment.carrier ?? "Carrier pending"}</span>
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
                      <dt>Created</dt>
                      <dd>{formatDateTime(shipment.createdAt)}</dd>
                    </div>
                    <div>
                      <dt>Shipped</dt>
                      <dd>{formatDateTime(shipment.shippedAt)}</dd>
                    </div>
                    <div>
                      <dt>Delivered</dt>
                      <dd>{formatDateTime(shipment.deliveredAt)}</dd>
                    </div>
                  </dl>
                  <div className="form-grid">
                    <label>
                      <span>Carrier</span>
                      <select
                        value={shipmentTrackingDrafts[shipment.id]?.carrier ?? shipment.carrier ?? "UPS"}
                        onChange={(event) => updateShipmentDraft(shipment.id, "carrier", event.target.value)}
                      >
                        {carrierOptions.map((carrier) => (
                          <option key={carrier} value={carrier}>
                            {carrier}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Tracking</span>
                      <input
                        value={
                          shipmentTrackingDrafts[shipment.id]?.trackingNumber ??
                          shipment.trackingNumber ??
                          ""
                        }
                        onChange={(event) =>
                          updateShipmentDraft(shipment.id, "trackingNumber", event.target.value)
                        }
                        placeholder="1Z..."
                      />
                    </label>
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
                      disabled={isBusy || !canFulfillOrder(order)}
                      onClick={() => void handleShipmentAction(shipment.id, markShipmentShipped)}
                    >
                      Shipped
                    </button>
                    <button
                      className={actionButtonClass(shipment.status === "DELIVERED")}
                      type="button"
                      disabled={isBusy || !canFulfillOrder(order)}
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
                    {historyCount > 0 ? (
                      <button
                        className="status-action"
                        type="button"
                        onClick={() => toggleShipmentHistory(shipment.id)}
                      >
                        {isHistoryOpen ? "Hide History" : `History (${historyCount})`}
                      </button>
                    ) : null}
                  </div>

                  {isHistoryOpen ? (
                    <div className="history-stack">
                      {shipment.statusEvents.length > 0 ? (
                        <ol className="status-event-list" aria-label="Shipment status history">
                          {shipment.statusEvents.map((event) => (
                            <li key={event.id}>
                              <span>{formatDateTime(event.createdAt)}</span>
                              <strong>
                                {event.fromStatus ?? "START"} {"->"} {event.toStatus}
                              </strong>
                              <small>
                                Status - {eventSourceLabel(event.source)}
                                {event.reason ? `: ${event.reason}` : ""}
                              </small>
                            </li>
                          ))}
                        </ol>
                      ) : null}
                      {shipment.trackingEvents.length > 0 ? (
                        <ol className="status-event-list" aria-label="Shipment tracking history">
                          {shipment.trackingEvents.map((event) => (
                            <li key={event.id}>
                              <span>{formatDateTime(event.createdAt)}</span>
                              <strong>
                                {trackingChangeLabel(
                                  event.fromCarrier,
                                  event.fromTrackingNumber,
                                  event.toCarrier,
                                  event.toTrackingNumber
                                )}
                              </strong>
                              <small>
                                Tracking - {eventSourceLabel(event.source)}
                                {event.reason ? `: ${event.reason}` : ""}
                              </small>
                            </li>
                          ))}
                        </ol>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </section>
    );
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
          {isAuthConfigured() ? (
            hasSession ? (
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

      <section className="summary-grid" aria-label="Admin summary">
        <div className="metric wide">
          <span>API</span>
          <strong>{apiBaseUrl}</strong>
        </div>
        <div className="metric">
          <span>Orders</span>
          <strong>{adminOrderTotal}</strong>
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

      {isAuthConfigured() && !hasSession ? (
        <section className="panel admin-panel">
          <div className="empty-state compact">Sign in with an admin account to manage orders</div>
        </section>
      ) : (
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

            <>
              <div className="admin-order-tools">
                <label className="admin-order-search">
                  <span>Search</span>
                  <input
                    value={orderSearch}
                    onChange={(event) => setOrderSearch(event.target.value)}
                    placeholder="Order, customer, email, item, note"
                  />
                </label>
                <label>
                  <span>Payment</span>
                  <select
                    value={paymentFilter}
                    onChange={(event) => setPaymentFilter(event.target.value as "ALL" | PaymentStatus)}
                  >
                    {paymentFilterOptions.map((option) => (
                      <option key={option} value={option}>
                        {option === "ALL" ? "All payments" : option}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Fulfillment</span>
                  <select
                    value={fulfillmentFilter}
                    onChange={(event) =>
                      setFulfillmentFilter(event.target.value as "ALL" | Order["fulfillmentStatus"])
                    }
                  >
                    {fulfillmentFilterOptions.map((option) => (
                      <option key={option} value={option}>
                        {option === "ALL" ? "All fulfillment" : option}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Date event</span>
                  <select
                    value={dateFilter}
                    onChange={(event) => setDateFilter(event.target.value as DateFilterField)}
                  >
                    {dateFilterOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>From</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                  />
                </label>
                <label>
                  <span>To</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(event) => setDateTo(event.target.value)}
                  />
                </label>
                <label>
                  <span>Sort</span>
                  <select
                    value={orderSort}
                    onChange={(event) => setOrderSort(event.target.value as OrderSortField)}
                  >
                    {orderSortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Per page</span>
                  <select
                    value={orderPageSize}
                    onChange={(event) => setOrderPageSize(Number(event.target.value))}
                  >
                    {orderPageSizeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

                <div className="admin-order-list-summary">
                  <span>
                    {adminOrderTotal} matching orders
                  </span>
                  <span>
                    Page {visibleOrderPage} of {adminOrderPageCount}
                  </span>
                </div>

                <div className="admin-order-list" aria-label="Recent orders">
                  {adminOrders.length === 0 ? (
                    <div className="empty-state compact">No matching orders</div>
                  ) : null}

                  {adminOrders.map((order) => {
                    const isSelected = order.id === selectedAdminOrder?.id;
                    const itemCount = orderItemCount(order);

                    return (
                      <article
                        className={`admin-order-row${isSelected ? " selected" : ""}`}
                        key={order.id}
                      >
                        <button
                          aria-expanded={isSelected}
                          aria-pressed={isSelected}
                          className="admin-order-row-trigger"
                          type="button"
                          onClick={() => setSelectedAdminOrderId(order.id)}
                        >
                          <div className="admin-order-row-main">
                            <div>
                              <strong>{order.orderNumber}</strong>
                              <span>{orderCustomerName(order)}</span>
                              <small>{order.email}</small>
                            </div>
                            <strong>{formatMoney(order.total, order.currency)}</strong>
                          </div>
                          <div className="admin-order-row-meta">
                            <span>{formatDateTime(order.placedAt ?? order.createdAt)}</span>
                            <span>{pluralizeItems(itemCount)}</span>
                          </div>
                          <div className="status-row">
                            <span className={`pill ${statusClass(order.paymentStatus)}`}>
                              {order.paymentStatus}
                            </span>
                            <span className={`pill ${statusClass(order.fulfillmentStatus)}`}>
                              {order.fulfillmentStatus}
                            </span>
                          </div>
                        </button>

                        {isSelected ? (
                          <div className="admin-order-expanded">
                            <AdminOrderSnapshot order={order} />
                            <AdminOrderTimeline order={order} />
                            {renderNotesSection(order)}
                            {renderPaymentSection(order)}
                            {renderFulfillmentSection(order)}
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>

                <div className="pagination-controls" aria-label="Order pagination">
                  <button
                    className="secondary"
                    type="button"
                    disabled={visibleOrderPage <= 1}
                    onClick={() => setOrderPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
                  </button>
                  <button
                    className="secondary"
                    type="button"
                    disabled={visibleOrderPage >= adminOrderPageCount}
                    onClick={() => setOrderPage((current) => Math.min(adminOrderPageCount, current + 1))}
                  >
                    Next
                  </button>
                </div>
            </>
          </section>
        </section>
      </section>
      )}
    </main>
  );
}
