"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AdminOrdersResponse,
  ApiStatus,
  Category,
  CreateProductInput,
  Order,
  Payment,
  PaymentStatus,
  PaymentWithOrder,
  Product,
  ProductStatus,
  ProductVariant,
  UpdateProductInput,
  UpdateProductVariantInput,
  addProductImage,
  apiBaseUrl,
  archiveProduct,
  authorizePayment,
  createCategory,
  createManualPayment,
  createOrderNote,
  createProduct,
  createProductVariant,
  createShipment,
  getReadiness,
  listAdminProducts,
  listAdminOrders,
  listCategories,
  markPaymentFailed,
  markPaymentPaid,
  markShipmentDelivered,
  markShipmentReturned,
  markShipmentShipped,
  publishProduct,
  refundPayment,
  removeProductCategory,
  assignProductCategory,
  setVariantInventory,
  syncStripePayment,
  updateProduct,
  updateProductVariant,
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
  "EXPIRED",
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
const productStatusOptions: ProductStatus[] = ["DRAFT", "ACTIVE", "ARCHIVED"];
type DateFilterField = (typeof dateFilterOptions)[number]["value"];
type OrderSortField = (typeof orderSortOptions)[number]["value"];
type AdminView = "orders" | "catalog";

const emptyProductDraft = {
  slug: "",
  name: "",
  description: "",
  status: "DRAFT" as ProductStatus,
  categoryId: ""
};

const emptyVariantDraft = {
  sku: "",
  title: "",
  price: "",
  currency: "USD",
  inventoryQuantity: "0"
};

const emptyImageDraft = {
  url: "",
  altText: "",
  sortOrder: "0"
};

const emptyCategoryDraft = {
  slug: "",
  name: ""
};

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

function allocatedShipmentQuantity(order: Order, orderItemId: string) {
  return order.shipments
    .filter((shipment) => shipment.status !== "RETURNED")
    .flatMap((shipment) => shipment.items)
    .filter((item) => item.orderItemId === orderItemId)
    .reduce((total, item) => total + item.quantity, 0);
}

function shippedShipmentQuantity(order: Order, orderItemId: string) {
  return order.shipments
    .filter((shipment) => shipment.status === "SHIPPED" || shipment.status === "DELIVERED")
    .flatMap((shipment) => shipment.items)
    .filter((item) => item.orderItemId === orderItemId)
    .reduce((total, item) => total + item.quantity, 0);
}

function remainingShipmentQuantity(order: Order, orderItemId: string) {
  const item = order.items.find((orderItem) => orderItem.id === orderItemId);

  return Math.max(0, (item?.quantity ?? 0) - allocatedShipmentQuantity(order, orderItemId));
}

function pluralizeItems(count: number) {
  return count === 1 ? "1 item" : `${count} items`;
}

function variantCount(product: Product) {
  return product.variants.length === 1 ? "1 variant" : `${product.variants.length} variants`;
}

function totalInventory(product: Product) {
  return product.variants.reduce((total, variant) => total + variant.inventoryQuantity, 0);
}

function productCategoryNames(product: Product) {
  return product.categories.map((item) => item.category.name).join(", ") || "No categories";
}

function eventSourceLabel(source: string) {
  return source.toLowerCase().replace(/_/g, " ");
}

function metadataRecord(metadata: unknown): Record<string, unknown> {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? (metadata as Record<string, unknown>)
    : {};
}

function metadataText(metadata: unknown, key: string) {
  const value = metadataRecord(metadata)[key];

  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function metadataBooleanText(metadata: unknown, key: string) {
  const value = metadataBoolean(metadata, key);

  return typeof value === "boolean" ? String(value) : null;
}

function metadataBoolean(metadata: unknown, key: string) {
  const value = metadataRecord(metadata)[key];

  return typeof value === "boolean" ? value : null;
}

function latestPaymentAttempt(payment: Payment) {
  return payment.attempts[payment.attempts.length - 1] ?? null;
}

function latestPaymentEvent(payment: Payment) {
  return payment.statusEvents[payment.statusEvents.length - 1] ?? null;
}

function latestStripeEvent(payment: Payment) {
  return [...payment.statusEvents]
    .reverse()
    .find((event) => event.source === "STRIPE_WEBHOOK" || event.source === "ADMIN_SYNC");
}

function stripeLastUpdateAt(payment: Payment) {
  return latestStripeEvent(payment)?.createdAt ?? metadataText(payment.metadata, "lastStripeSyncAt");
}

function stripeCheckoutSessionId(payment: Payment) {
  return (
    payment.providerPaymentId?.startsWith("cs_") ? payment.providerPaymentId : null
  ) ?? metadataText(payment.metadata, "checkoutSessionId");
}

function stripePaymentIntentId(payment: Payment) {
  return (
    latestPaymentAttempt(payment)?.providerPaymentIntentId ??
    metadataText(payment.metadata, "paymentIntentId")
  );
}

function stripeChargeId(payment: Payment) {
  return metadataText(payment.metadata, "chargeId");
}

function stripeDashboardUrl(id: string, livemode: boolean | null) {
  const modePath = livemode === true ? "" : "/test";

  if (id.startsWith("cs_")) {
    return `https://dashboard.stripe.com${modePath}/checkout/sessions/${encodeURIComponent(id)}`;
  }

  if (id.startsWith("pi_")) {
    return `https://dashboard.stripe.com${modePath}/payments/${encodeURIComponent(id)}`;
  }

  if (id.startsWith("ch_")) {
    return `https://dashboard.stripe.com${modePath}/payments/${encodeURIComponent(id)}`;
  }

  return null;
}

function stripeObjectLink(id: string | null, livemode: boolean | null) {
  if (!id) {
    return "None";
  }

  const url = stripeDashboardUrl(id, livemode);

  if (!url) {
    return id;
  }

  return (
    <a href={url} rel="noreferrer" target="_blank">
      {id}
    </a>
  );
}

function isCompletedPaymentStatus(status: PaymentStatus) {
  return status === "AUTHORIZED" || status === "PAID" || status === "REFUNDED" || status === "DISPUTED";
}

function paymentWarnings(order: Order, payment: Payment) {
  if (payment.provider !== "stripe") {
    return [];
  }

  const warnings: string[] = [];
  const attempt = latestPaymentAttempt(payment);
  const latestEvent = latestPaymentEvent(payment);
  const lastStripeUpdateAt = stripeLastUpdateAt(payment);

  if (!lastStripeUpdateAt) {
    warnings.push("No Stripe webhook or sync event has updated this payment yet.");
  }

  if (latestEvent?.source === "ADMIN_MANUAL") {
    warnings.push("Last payment status change was manual; sync Stripe before fulfillment decisions.");
  }

  if (attempt?.status === "OPEN" && payment.status === "UNPAID") {
    warnings.push("Awaiting Stripe confirmation; webhook delivery may still be pending.");
  }

  if (attempt?.status === "OPEN" && attempt.expiresAt && new Date(attempt.expiresAt).getTime() < Date.now()) {
    warnings.push("Latest Stripe checkout attempt is past its expiry time; run Sync Stripe or the expiry job.");
  }

  if (attempt?.status === "COMPLETED" && !isCompletedPaymentStatus(payment.status)) {
    warnings.push("Stripe attempt is completed, but local payment status is not settled.");
  }

  if (order.paymentStatus !== payment.status && payment.status === "PAID") {
    warnings.push(`Payment is PAID but order payment status is ${order.paymentStatus}.`);
  }

  return warnings;
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
  type: "Order" | "Note" | "Payment" | "Fulfillment" | "Tracking" | "Notification";
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

  for (const notification of order.notificationEvents ?? []) {
    items.push({
      id: `notification-${notification.id}`,
      createdAt: notification.createdAt,
      type: "Notification",
      title: `${notification.type} ${notification.status.toLowerCase()}`,
      detail: `${notification.recipientEmail}${
        notification.provider ? ` - ${notification.provider}` : ""
      }${notification.errorMessage ? `: ${notification.errorMessage}` : ""}`
    });
  }

  return items.sort((first, second) => Date.parse(first.createdAt) - Date.parse(second.createdAt));
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
                {shipment.items.length > 0 ? (
                  <small>
                    {shipment.items
                      .map((item) => `${item.orderItem.sku} x ${item.quantity}`)
                      .join(", ")}
                  </small>
                ) : null}
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

function AdminNotificationSection({ order }: { order: Order }) {
  const notifications = order.notificationEvents ?? [];

  return (
    <section className="admin-work-section" aria-label="Notifications">
      <div className="panel-heading">
        <div>
          <h3>Notifications</h3>
          <small>{notifications.length} events</small>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state compact">No notifications queued</div>
      ) : (
        <ol className="status-event-list" aria-label="Notification events">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <span>{formatDateTime(notification.createdAt)}</span>
              <strong>
                {notification.type} - {notification.status}
              </strong>
              <small>{notification.recipientEmail}</small>
              {notification.provider ? <small>Provider: {notification.provider}</small> : null}
              {notification.sentAt ? <small>Sent: {formatDateTime(notification.sentAt)}</small> : null}
              {notification.errorMessage ? <small>{notification.errorMessage}</small> : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function StripePaymentDetails({ order, payment }: { order: Order; payment: Payment }) {
  const checkoutSessionId = stripeCheckoutSessionId(payment);
  const paymentIntentId = stripePaymentIntentId(payment);
  const chargeId = stripeChargeId(payment);
  const attempt = latestPaymentAttempt(payment);
  const lastStripeUpdateAt = stripeLastUpdateAt(payment);
  const warnings = paymentWarnings(order, payment);
  const stripeStatus = metadataText(payment.metadata, "stripeStatus");
  const checkoutStatus = metadataText(payment.metadata, "checkoutSessionStatus");
  const checkoutPaymentStatus = metadataText(payment.metadata, "checkoutPaymentStatus");
  const chargeDisputed = metadataBooleanText(payment.metadata, "chargeDisputed");
  const livemode = metadataBoolean(payment.metadata, "livemode");

  return (
    <div className="stripe-payment-details">
      {warnings.length > 0 ? (
        <div className="payment-warning-list" aria-label="Stripe payment warnings">
          {warnings.map((warning) => (
            <p className="warning compact" key={warning}>
              {warning}
            </p>
          ))}
        </div>
      ) : null}

      <dl className="stripe-detail-grid">
        <div>
          <dt>Checkout Session</dt>
          <dd>{stripeObjectLink(checkoutSessionId, livemode)}</dd>
        </div>
        <div>
          <dt>Payment Intent</dt>
          <dd>{stripeObjectLink(paymentIntentId, livemode)}</dd>
        </div>
        <div>
          <dt>Charge</dt>
          <dd>{stripeObjectLink(chargeId, livemode)}</dd>
        </div>
        <div>
          <dt>Latest Attempt</dt>
          <dd>{attempt ? attempt.status : "None"}</dd>
        </div>
        <div>
          <dt>Stripe Status</dt>
          <dd>{stripeStatus ?? "Unknown"}</dd>
        </div>
        <div>
          <dt>Checkout Status</dt>
          <dd>{checkoutStatus ?? "Unknown"}</dd>
        </div>
        <div>
          <dt>Checkout Payment</dt>
          <dd>{checkoutPaymentStatus ?? "Unknown"}</dd>
        </div>
        <div>
          <dt>Charge Disputed</dt>
          <dd>{chargeDisputed ?? "Unknown"}</dd>
        </div>
        <div>
          <dt>Stripe Mode</dt>
          <dd>{livemode === null ? "Unknown" : livemode ? "Live" : "Test"}</dd>
        </div>
        <div>
          <dt>Attempt Expires</dt>
          <dd>{formatDateTime(attempt?.expiresAt ?? null)}</dd>
        </div>
        <div>
          <dt>Last Stripe Update</dt>
          <dd>{lastStripeUpdateAt ? formatDateTime(lastStripeUpdateAt) : "Never"}</dd>
        </div>
      </dl>

      {payment.attempts.length > 0 ? (
        <details className="stripe-attempts">
          <summary>Attempts ({payment.attempts.length})</summary>
          <ol className="status-event-list" aria-label="Stripe payment attempts">
            {payment.attempts.map((item) => (
              <li key={item.id}>
                <span>{formatDateTime(item.createdAt)}</span>
                <strong>
                  {item.status} - {formatMoney(item.amount, item.currency)}
                </strong>
                <small>Checkout: {item.providerAttemptId}</small>
                {item.providerPaymentIntentId ? (
                  <small>Payment intent: {item.providerPaymentIntentId}</small>
                ) : null}
                {item.completedAt ? <small>Completed: {formatDateTime(item.completedAt)}</small> : null}
                {item.expiredAt ? <small>Expired: {formatDateTime(item.expiredAt)}</small> : null}
                {item.failedAt ? <small>Failed: {formatDateTime(item.failedAt)}</small> : null}
                {item.canceledAt ? <small>Canceled: {formatDateTime(item.canceledAt)}</small> : null}
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </div>
  );
}

export default function AdminPage() {
  const [status, setStatus] = useState<ApiStatus>("checking");
  const [activeView, setActiveView] = useState<AdminView>("orders");
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminOrderTotal, setAdminOrderTotal] = useState(0);
  const [adminOrderPageCount, setAdminOrderPageCount] = useState(1);
  const [selectedAdminOrderId, setSelectedAdminOrderId] = useState("");
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productStatusFilter, setProductStatusFilter] = useState<"ALL" | ProductStatus>("ALL");
  const [productDraft, setProductDraft] = useState(emptyProductDraft);
  const [categoryDraft, setCategoryDraft] = useState(emptyCategoryDraft);
  const [productEditDrafts, setProductEditDrafts] = useState<Record<string, typeof emptyProductDraft>>({});
  const [variantDrafts, setVariantDrafts] = useState<Record<string, typeof emptyVariantDraft>>({});
  const [variantEditDrafts, setVariantEditDrafts] = useState<Record<string, typeof emptyVariantDraft>>({});
  const [imageDrafts, setImageDrafts] = useState<Record<string, typeof emptyImageDraft>>({});
  const [categorySelectDrafts, setCategorySelectDrafts] = useState<Record<string, string>>({});
  const [newShipmentCarrier, setNewShipmentCarrier] = useState("UPS");
  const [newShipmentTrackingNumber, setNewShipmentTrackingNumber] = useState("");
  const [newShipmentItemDrafts, setNewShipmentItemDrafts] = useState<Record<string, Record<string, string>>>({});
  const [shipmentTrackingDrafts, setShipmentTrackingDrafts] = useState<
    Record<string, { carrier: string; trackingNumber: string }>
  >({});
  const [orderActivityOpen, setOrderActivityOpen] = useState<Record<string, boolean>>({});
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
  const filteredProducts = adminProducts.filter((product) => {
    const search = productSearch.trim().toLowerCase();
    const matchesStatus = productStatusFilter === "ALL" || product.status === productStatusFilter;
    const matchesSearch =
      !search ||
      product.name.toLowerCase().includes(search) ||
      product.slug.toLowerCase().includes(search) ||
      product.variants.some(
        (variant) =>
          variant.sku.toLowerCase().includes(search) || variant.title.toLowerCase().includes(search)
      ) ||
      product.categories.some((item) => item.category.name.toLowerCase().includes(search));

    return matchesStatus && matchesSearch;
  });
  const selectedProduct =
    filteredProducts.find((product) => product.id === selectedProductId) ?? filteredProducts[0] ?? null;

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
        const [ordersResponse, productsResponse, categoriesResponse] = await Promise.all([
          listAdminOrders(adminOrderQuery(1)),
          listAdminProducts(),
          listCategories()
        ]);

        if (!isMounted) {
          return;
        }

        applyAdminOrders(ordersResponse);
        applyCatalog(productsResponse, categoriesResponse);
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

  function applyCatalog(products: Product[], nextCategories = categories, preferredProductId?: string) {
    setAdminProducts(products);
    setCategories(nextCategories);
    setSelectedProductId((current) => {
      if (preferredProductId && products.some((product) => product.id === preferredProductId)) {
        return preferredProductId;
      }

      return current && products.some((product) => product.id === current)
        ? current
        : products[0]?.id ?? "";
    });
    syncCatalogDrafts(products, nextCategories);
  }

  function syncCatalogDrafts(products: Product[], nextCategories = categories) {
    setProductEditDrafts((current) => {
      const next = { ...current };

      for (const product of products) {
        next[product.id] = {
          slug: product.slug,
          name: product.name,
          description: product.description ?? "",
          status: product.status,
          categoryId: next[product.id]?.categoryId ?? ""
        };
      }

      return next;
    });
    setVariantDrafts((current) => {
      const next = { ...current };

      for (const product of products) {
        next[product.id] = next[product.id] ?? emptyVariantDraft;
      }

      return next;
    });
    setImageDrafts((current) => {
      const next = { ...current };

      for (const product of products) {
        next[product.id] = next[product.id] ?? emptyImageDraft;
      }

      return next;
    });
    setCategorySelectDrafts((current) => {
      const next = { ...current };
      const firstCategoryId = nextCategories[0]?.id ?? "";

      for (const product of products) {
        next[product.id] = next[product.id] ?? firstCategoryId;
      }

      return next;
    });
    setVariantEditDrafts((current) => {
      const next = { ...current };

      for (const product of products) {
        for (const variant of product.variants) {
          next[variant.id] = {
            sku: variant.sku,
            title: variant.title,
            price: variant.price,
            currency: variant.currency,
            inventoryQuantity: String(variant.inventoryQuantity)
          };
        }
      }

      return next;
    });
  }

  async function reloadCatalog(preferredProductId?: string) {
    const [productsResponse, categoriesResponse] = await Promise.all([listAdminProducts(), listCategories()]);
    applyCatalog(productsResponse, categoriesResponse, preferredProductId);

    return productsResponse;
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

  async function refreshCatalog() {
    setPendingAction("catalog");
    setError(null);
    setNotice(null);

    try {
      await reloadCatalog(selectedProduct?.id);
      setStatus("online");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not refresh catalog");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleCreateCategory() {
    const slug = categoryDraft.slug.trim();
    const name = categoryDraft.name.trim();

    if (!slug || !name) {
      return;
    }

    setPendingAction("create-category");
    setError(null);
    setNotice(null);

    try {
      const category = await createCategory({
        slug,
        name
      });
      const products = await reloadCatalog(selectedProduct?.id);
      setCategoryDraft(emptyCategoryDraft);
      setProductDraft((current) => ({
        ...current,
        categoryId: category.id
      }));
      setNotice(`Created category ${category.name}`);
      if (products.length === 0) {
        setSelectedProductId("");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create category");
    } finally {
      setPendingAction(null);
    }
  }

  function createProductInput(): CreateProductInput {
    return {
      slug: productDraft.slug.trim(),
      name: productDraft.name.trim(),
      description: productDraft.description.trim() || undefined,
      status: productDraft.status,
      categoryIds: productDraft.categoryId ? [productDraft.categoryId] : []
    };
  }

  async function handleCreateProduct() {
    const input = createProductInput();

    if (!input.slug || !input.name) {
      return;
    }

    setPendingAction("create-product");
    setError(null);
    setNotice(null);

    try {
      const product = await createProduct(input);
      await reloadCatalog(product.id);
      setProductDraft(emptyProductDraft);
      setActiveView("catalog");
      setNotice(`Created product ${product.name}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create product");
    } finally {
      setPendingAction(null);
    }
  }

  function updateProductEditDraft(productId: string, field: keyof typeof emptyProductDraft, value: string) {
    setProductEditDrafts((current) => ({
      ...current,
      [productId]: {
        ...(current[productId] ?? emptyProductDraft),
        [field]: value
      }
    }));
  }

  function productUpdateInput(product: Product): UpdateProductInput {
    const draft = productEditDrafts[product.id] ?? {
      ...emptyProductDraft,
      slug: product.slug,
      name: product.name,
      description: product.description ?? "",
      status: product.status
    };

    return {
      slug: draft.slug.trim(),
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      status: draft.status
    };
  }

  async function handleUpdateProduct(product: Product) {
    setPendingAction(`product-${product.id}`);
    setError(null);
    setNotice(null);

    try {
      const updatedProduct = await updateProduct(product.id, productUpdateInput(product));
      await reloadCatalog(updatedProduct.id);
      setNotice(`Updated ${updatedProduct.name}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update product");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleProductStatus(product: Product, statusAction: "publish" | "archive") {
    setPendingAction(`product-status-${product.id}`);
    setError(null);
    setNotice(null);

    try {
      const updatedProduct =
        statusAction === "publish" ? await publishProduct(product.id) : await archiveProduct(product.id);
      await reloadCatalog(updatedProduct.id);
      setNotice(`${updatedProduct.name} is ${updatedProduct.status}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update product status");
    } finally {
      setPendingAction(null);
    }
  }

  function updateVariantDraft(
    productId: string,
    field: keyof typeof emptyVariantDraft,
    value: string
  ) {
    setVariantDrafts((current) => ({
      ...current,
      [productId]: {
        ...(current[productId] ?? emptyVariantDraft),
        [field]: value
      }
    }));
  }

  function variantInput(productId: string) {
    const draft = variantDrafts[productId] ?? emptyVariantDraft;

    return {
      sku: draft.sku.trim(),
      title: draft.title.trim(),
      price: draft.price.trim(),
      currency: draft.currency.trim() || "USD",
      inventoryQuantity: Number(draft.inventoryQuantity || 0)
    };
  }

  async function handleCreateVariant(product: Product) {
    const input = variantInput(product.id);

    if (!input.sku || !input.title || !input.price || Number.isNaN(input.inventoryQuantity)) {
      return;
    }

    setPendingAction(`variant-create-${product.id}`);
    setError(null);
    setNotice(null);

    try {
      await createProductVariant(product.id, input);
      await reloadCatalog(product.id);
      setVariantDrafts((current) => ({
        ...current,
        [product.id]: emptyVariantDraft
      }));
      setNotice(`Added variant to ${product.name}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create variant");
    } finally {
      setPendingAction(null);
    }
  }

  function updateVariantEditDraft(
    variantId: string,
    field: keyof typeof emptyVariantDraft,
    value: string
  ) {
    setVariantEditDrafts((current) => ({
      ...current,
      [variantId]: {
        ...(current[variantId] ?? emptyVariantDraft),
        [field]: value
      }
    }));
  }

  function variantUpdateInput(variant: ProductVariant): UpdateProductVariantInput {
    const draft = variantEditDrafts[variant.id] ?? {
      sku: variant.sku,
      title: variant.title,
      price: variant.price,
      currency: variant.currency,
      inventoryQuantity: String(variant.inventoryQuantity)
    };

    return {
      sku: draft.sku.trim(),
      title: draft.title.trim(),
      price: draft.price.trim(),
      currency: draft.currency.trim() || "USD",
      inventoryQuantity: Number(draft.inventoryQuantity || 0)
    };
  }

  async function handleUpdateVariant(product: Product, variant: ProductVariant) {
    const input = variantUpdateInput(variant);

    if (!input.sku || !input.title || !input.price || Number.isNaN(input.inventoryQuantity)) {
      return;
    }

    setPendingAction(`variant-${variant.id}`);
    setError(null);
    setNotice(null);

    try {
      await updateProductVariant(variant.id, input);
      await reloadCatalog(product.id);
      setNotice(`Updated ${input.sku}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update variant");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleSetInventory(product: Product, variant: ProductVariant) {
    const draft = variantEditDrafts[variant.id] ?? emptyVariantDraft;
    const inventoryQuantity = Number(draft.inventoryQuantity || 0);

    if (Number.isNaN(inventoryQuantity)) {
      return;
    }

    setPendingAction(`inventory-${variant.id}`);
    setError(null);
    setNotice(null);

    try {
      await setVariantInventory(variant.id, inventoryQuantity);
      await reloadCatalog(product.id);
      setNotice(`Set ${variant.sku} inventory to ${inventoryQuantity}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update inventory");
    } finally {
      setPendingAction(null);
    }
  }

  function updateImageDraft(productId: string, field: keyof typeof emptyImageDraft, value: string) {
    setImageDrafts((current) => ({
      ...current,
      [productId]: {
        ...(current[productId] ?? emptyImageDraft),
        [field]: value
      }
    }));
  }

  async function handleAddImage(product: Product) {
    const draft = imageDrafts[product.id] ?? emptyImageDraft;
    const url = draft.url.trim();

    if (!url) {
      return;
    }

    setPendingAction(`image-${product.id}`);
    setError(null);
    setNotice(null);

    try {
      await addProductImage(product.id, {
        url,
        altText: draft.altText.trim() || undefined,
        sortOrder: Number(draft.sortOrder || 0)
      });
      await reloadCatalog(product.id);
      setImageDrafts((current) => ({
        ...current,
        [product.id]: emptyImageDraft
      }));
      setNotice(`Added image to ${product.name}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not add image");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleAssignCategory(product: Product) {
    const categoryId = categorySelectDrafts[product.id];

    if (!categoryId) {
      return;
    }

    setPendingAction(`category-${product.id}`);
    setError(null);
    setNotice(null);

    try {
      const updatedProduct = await assignProductCategory(product.id, categoryId);
      await reloadCatalog(updatedProduct.id);
      setNotice(`Updated categories for ${updatedProduct.name}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not assign category");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRemoveCategory(product: Product, categoryId: string) {
    setPendingAction(`category-${product.id}`);
    setError(null);
    setNotice(null);

    try {
      const updatedProduct = await removeProductCategory(product.id, categoryId);
      await reloadCatalog(updatedProduct.id);
      setNotice(`Updated categories for ${updatedProduct.name}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not remove category");
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

  function newShipmentInput(order: Order) {
    const itemDrafts = newShipmentItemDrafts[order.id] ?? {};
    const items = order.items
      .map((item) => {
        const remaining = remainingShipmentQuantity(order, item.id);
        const draft = itemDrafts[item.id];

        return {
          orderItemId: item.id,
          quantity: Number(draft ?? remaining)
        };
      })
      .filter((item) => item.quantity > 0);

    return {
      carrier: newShipmentCarrier.trim() || undefined,
      trackingNumber: newShipmentTrackingNumber.trim() || undefined,
      items: items.length > 0 ? items : undefined
    };
  }

  function updateNewShipmentItemDraft(orderId: string, orderItemId: string, value: string) {
    setNewShipmentItemDrafts((current) => ({
      ...current,
      [orderId]: {
        ...(current[orderId] ?? {}),
        [orderItemId]: value
      }
    }));
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
      const shipment = await createShipment(order.id, newShipmentInput(order));
      syncAdminOrder(shipment.order);
      await reloadAdminOrders(shipment.order.id);
      setNewShipmentItemDrafts((current) => ({
        ...current,
        [order.id]: {}
      }));
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

  function isOrderActivityOpen(orderId: string) {
    return orderActivityOpen[orderId] ?? false;
  }

  function toggleOrderActivity(orderId: string) {
    setOrderActivityOpen((current) => ({
      ...current,
      [orderId]: !(current[orderId] ?? false)
    }));
  }

  function renderCatalogSection() {
    return (
      <section className="catalog" aria-label="Catalog">
        <section className="panel admin-panel">
          <div className="panel-heading">
            <h2>Catalog</h2>
            <button
              className="secondary"
              type="button"
              disabled={pendingAction === "catalog"}
              onClick={() => void refreshCatalog()}
            >
              {pendingAction === "catalog" ? "Refreshing" : "Refresh"}
            </button>
          </div>

          <div className="admin-order-tools catalog-tools">
            <label className="admin-order-search">
              <span>Search</span>
              <input
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Product, slug, SKU, category"
              />
            </label>
            <label>
              <span>Status</span>
              <select
                value={productStatusFilter}
                onChange={(event) => setProductStatusFilter(event.target.value as "ALL" | ProductStatus)}
              >
                <option value="ALL">All products</option>
                {productStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <section className="admin-work-section" aria-label="Create product">
            <div className="panel-heading">
              <h3>Create Product</h3>
            </div>
            <div className="catalog-form-grid">
              <label>
                <span>Name</span>
                <input
                  value={productDraft.name}
                  onChange={(event) =>
                    setProductDraft((current) => ({
                      ...current,
                      name: event.target.value
                    }))
                  }
                  placeholder="Dev Mug"
                />
              </label>
              <label>
                <span>Slug</span>
                <input
                  value={productDraft.slug}
                  onChange={(event) =>
                    setProductDraft((current) => ({
                      ...current,
                      slug: event.target.value
                    }))
                  }
                  placeholder="dev-mug"
                />
              </label>
              <label>
                <span>Status</span>
                <select
                  value={productDraft.status}
                  onChange={(event) =>
                    setProductDraft((current) => ({
                      ...current,
                      status: event.target.value as ProductStatus
                    }))
                  }
                >
                  {productStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Category</span>
                <select
                  value={productDraft.categoryId}
                  onChange={(event) =>
                    setProductDraft((current) => ({
                      ...current,
                      categoryId: event.target.value
                    }))
                  }
                >
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="catalog-wide-field">
                <span>Description</span>
                <textarea
                  value={productDraft.description}
                  onChange={(event) =>
                    setProductDraft((current) => ({
                      ...current,
                      description: event.target.value
                    }))
                  }
                  placeholder="Short product description"
                />
              </label>
              <button
                type="button"
                disabled={
                  pendingAction === "create-product" ||
                  productDraft.name.trim().length === 0 ||
                  productDraft.slug.trim().length === 0
                }
                onClick={() => void handleCreateProduct()}
              >
                {pendingAction === "create-product" ? "Creating" : "Create Product"}
              </button>
            </div>
          </section>

          <section className="admin-work-section" aria-label="Create category">
            <div className="panel-heading">
              <h3>Create Category</h3>
            </div>
            <div className="catalog-inline-form">
              <label>
                <span>Name</span>
                <input
                  value={categoryDraft.name}
                  onChange={(event) =>
                    setCategoryDraft((current) => ({
                      ...current,
                      name: event.target.value
                    }))
                  }
                  placeholder="Drinkware"
                />
              </label>
              <label>
                <span>Slug</span>
                <input
                  value={categoryDraft.slug}
                  onChange={(event) =>
                    setCategoryDraft((current) => ({
                      ...current,
                      slug: event.target.value
                    }))
                  }
                  placeholder="drinkware"
                />
              </label>
              <button
                type="button"
                disabled={
                  pendingAction === "create-category" ||
                  categoryDraft.name.trim().length === 0 ||
                  categoryDraft.slug.trim().length === 0
                }
                onClick={() => void handleCreateCategory()}
              >
                {pendingAction === "create-category" ? "Creating" : "Create Category"}
              </button>
            </div>
          </section>

          <div className="admin-order-list-summary">
            <span>{filteredProducts.length} matching products</span>
            <span>{categories.length} categories</span>
          </div>

          <div className="catalog-product-list" aria-label="Products">
            {filteredProducts.length === 0 ? (
              <div className="empty-state compact">No matching products</div>
            ) : null}

            {filteredProducts.map((product) => {
              const isSelected = product.id === selectedProduct?.id;
              const editDraft = productEditDrafts[product.id] ?? {
                ...emptyProductDraft,
                slug: product.slug,
                name: product.name,
                description: product.description ?? "",
                status: product.status
              };
              const variantDraft = variantDrafts[product.id] ?? emptyVariantDraft;
              const imageDraft = imageDrafts[product.id] ?? emptyImageDraft;

              return (
                <article className={`catalog-product-row${isSelected ? " selected" : ""}`} key={product.id}>
                  <button
                    aria-expanded={isSelected}
                    aria-pressed={isSelected}
                    className="admin-order-row-trigger"
                    type="button"
                    onClick={() => setSelectedProductId(product.id)}
                  >
                    <div className="admin-order-row-main">
                      <div>
                        <strong>{product.name}</strong>
                        <span>{product.slug}</span>
                        <small>{productCategoryNames(product)}</small>
                      </div>
                      <strong>{variantCount(product)}</strong>
                    </div>
                    <div className="admin-order-row-meta">
                      <span>{totalInventory(product)} in stock</span>
                      <span>Updated {formatDateTime(product.updatedAt)}</span>
                    </div>
                    <div className="status-row">
                      <span className={`pill ${statusClass(product.status)}`}>{product.status}</span>
                    </div>
                  </button>

                  {isSelected ? (
                    <div className="catalog-product-expanded">
                      <section className="admin-work-section" aria-label="Edit product">
                        <div className="panel-heading">
                          <h3>Product</h3>
                          <div className="catalog-row-actions">
                            <button
                              className="secondary"
                              type="button"
                              disabled={pendingAction === `product-status-${product.id}` || product.status === "ACTIVE"}
                              onClick={() => void handleProductStatus(product, "publish")}
                            >
                              Publish
                            </button>
                            <button
                              className="secondary"
                              type="button"
                              disabled={
                                pendingAction === `product-status-${product.id}` ||
                                product.status === "ARCHIVED"
                              }
                              onClick={() => void handleProductStatus(product, "archive")}
                            >
                              Archive
                            </button>
                          </div>
                        </div>
                        <div className="catalog-form-grid">
                          <label>
                            <span>Name</span>
                            <input
                              value={editDraft.name}
                              onChange={(event) =>
                                updateProductEditDraft(product.id, "name", event.target.value)
                              }
                            />
                          </label>
                          <label>
                            <span>Slug</span>
                            <input
                              value={editDraft.slug}
                              onChange={(event) =>
                                updateProductEditDraft(product.id, "slug", event.target.value)
                              }
                            />
                          </label>
                          <label>
                            <span>Status</span>
                            <select
                              value={editDraft.status}
                              onChange={(event) =>
                                updateProductEditDraft(product.id, "status", event.target.value)
                              }
                            >
                              {productStatusOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="catalog-wide-field">
                            <span>Description</span>
                            <textarea
                              value={editDraft.description}
                              onChange={(event) =>
                                updateProductEditDraft(product.id, "description", event.target.value)
                              }
                            />
                          </label>
                          <button
                            type="button"
                            disabled={pendingAction === `product-${product.id}`}
                            onClick={() => void handleUpdateProduct(product)}
                          >
                            {pendingAction === `product-${product.id}` ? "Saving" : "Save Product"}
                          </button>
                        </div>
                      </section>

                      <section className="admin-work-section" aria-label="Product categories">
                        <div className="panel-heading">
                          <h3>Categories</h3>
                        </div>
                        <div className="category-row catalog-category-row">
                          {product.categories.length === 0 ? <span>No categories</span> : null}
                          {product.categories.map((item) => (
                            <button
                              className="category-chip"
                              key={item.categoryId}
                              type="button"
                              disabled={pendingAction === `category-${product.id}`}
                              onClick={() => void handleRemoveCategory(product, item.categoryId)}
                            >
                              {item.category.name}
                            </button>
                          ))}
                        </div>
                        <div className="catalog-inline-form">
                          <label>
                            <span>Add category</span>
                            <select
                              value={categorySelectDrafts[product.id] ?? categories[0]?.id ?? ""}
                              onChange={(event) =>
                                setCategorySelectDrafts((current) => ({
                                  ...current,
                                  [product.id]: event.target.value
                                }))
                              }
                            >
                              <option value="">Select category</option>
                              {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <button
                            type="button"
                            disabled={
                              pendingAction === `category-${product.id}` ||
                              !categorySelectDrafts[product.id]
                            }
                            onClick={() => void handleAssignCategory(product)}
                          >
                            Add Category
                          </button>
                        </div>
                      </section>

                      <section className="admin-work-section" aria-label="Product variants">
                        <div className="panel-heading">
                          <h3>Variants</h3>
                        </div>
                        <div className="variant-list">
                          {product.variants.length === 0 ? (
                            <div className="empty-state compact">No variants</div>
                          ) : null}
                          {product.variants.map((variant) => {
                            const variantEditDraft = variantEditDrafts[variant.id] ?? {
                              sku: variant.sku,
                              title: variant.title,
                              price: variant.price,
                              currency: variant.currency,
                              inventoryQuantity: String(variant.inventoryQuantity)
                            };

                            return (
                              <article className="variant-row" key={variant.id}>
                                <div className="variant-row-heading">
                                  <div>
                                    <strong>{variant.sku}</strong>
                                    <span>{variant.title}</span>
                                  </div>
                                  <strong>{formatMoney(variant.price, variant.currency)}</strong>
                                </div>
                                <div className="catalog-form-grid variant-edit-grid">
                                  <label>
                                    <span>SKU</span>
                                    <input
                                      value={variantEditDraft.sku}
                                      onChange={(event) =>
                                        updateVariantEditDraft(variant.id, "sku", event.target.value)
                                      }
                                    />
                                  </label>
                                  <label>
                                    <span>Title</span>
                                    <input
                                      value={variantEditDraft.title}
                                      onChange={(event) =>
                                        updateVariantEditDraft(variant.id, "title", event.target.value)
                                      }
                                    />
                                  </label>
                                  <label>
                                    <span>Price</span>
                                    <input
                                      value={variantEditDraft.price}
                                      inputMode="decimal"
                                      onChange={(event) =>
                                        updateVariantEditDraft(variant.id, "price", event.target.value)
                                      }
                                    />
                                  </label>
                                  <label>
                                    <span>Currency</span>
                                    <input
                                      value={variantEditDraft.currency}
                                      onChange={(event) =>
                                        updateVariantEditDraft(variant.id, "currency", event.target.value)
                                      }
                                    />
                                  </label>
                                  <label>
                                    <span>Inventory</span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={variantEditDraft.inventoryQuantity}
                                      onChange={(event) =>
                                        updateVariantEditDraft(
                                          variant.id,
                                          "inventoryQuantity",
                                          event.target.value
                                        )
                                      }
                                    />
                                  </label>
                                  <div className="catalog-row-actions">
                                    <button
                                      type="button"
                                      disabled={pendingAction === `variant-${variant.id}`}
                                      onClick={() => void handleUpdateVariant(product, variant)}
                                    >
                                      Save Variant
                                    </button>
                                    <button
                                      className="secondary"
                                      type="button"
                                      disabled={pendingAction === `inventory-${variant.id}`}
                                      onClick={() => void handleSetInventory(product, variant)}
                                    >
                                      Set Stock
                                    </button>
                                  </div>
                                </div>
                              </article>
                            );
                          })}
                        </div>

                        <div className="catalog-form-grid">
                          <label>
                            <span>New SKU</span>
                            <input
                              value={variantDraft.sku}
                              onChange={(event) => updateVariantDraft(product.id, "sku", event.target.value)}
                              placeholder="MUG-001"
                            />
                          </label>
                          <label>
                            <span>Title</span>
                            <input
                              value={variantDraft.title}
                              onChange={(event) => updateVariantDraft(product.id, "title", event.target.value)}
                              placeholder="Default"
                            />
                          </label>
                          <label>
                            <span>Price</span>
                            <input
                              value={variantDraft.price}
                              inputMode="decimal"
                              onChange={(event) => updateVariantDraft(product.id, "price", event.target.value)}
                              placeholder="24.00"
                            />
                          </label>
                          <label>
                            <span>Currency</span>
                            <input
                              value={variantDraft.currency}
                              onChange={(event) =>
                                updateVariantDraft(product.id, "currency", event.target.value)
                              }
                            />
                          </label>
                          <label>
                            <span>Inventory</span>
                            <input
                              type="number"
                              min="0"
                              value={variantDraft.inventoryQuantity}
                              onChange={(event) =>
                                updateVariantDraft(product.id, "inventoryQuantity", event.target.value)
                              }
                            />
                          </label>
                          <button
                            type="button"
                            disabled={
                              pendingAction === `variant-create-${product.id}` ||
                              variantDraft.sku.trim().length === 0 ||
                              variantDraft.title.trim().length === 0 ||
                              variantDraft.price.trim().length === 0
                            }
                            onClick={() => void handleCreateVariant(product)}
                          >
                            {pendingAction === `variant-create-${product.id}` ? "Adding" : "Add Variant"}
                          </button>
                        </div>
                      </section>

                      <section className="admin-work-section" aria-label="Product images">
                        <div className="panel-heading">
                          <h3>Images</h3>
                        </div>
                        <div className="image-list">
                          {product.images.length === 0 ? (
                            <div className="empty-state compact">No images</div>
                          ) : null}
                          {product.images.map((image) => (
                            <div className="image-row" key={image.id}>
                              <span>{image.sortOrder}</span>
                              <a href={image.url} rel="noreferrer" target="_blank">
                                {image.altText ?? image.url}
                              </a>
                            </div>
                          ))}
                        </div>
                        <div className="catalog-form-grid">
                          <label className="catalog-wide-field">
                            <span>Image URL</span>
                            <input
                              value={imageDraft.url}
                              onChange={(event) => updateImageDraft(product.id, "url", event.target.value)}
                              placeholder="https://..."
                            />
                          </label>
                          <label>
                            <span>Alt text</span>
                            <input
                              value={imageDraft.altText}
                              onChange={(event) =>
                                updateImageDraft(product.id, "altText", event.target.value)
                              }
                            />
                          </label>
                          <label>
                            <span>Sort</span>
                            <input
                              type="number"
                              min="0"
                              value={imageDraft.sortOrder}
                              onChange={(event) =>
                                updateImageDraft(product.id, "sortOrder", event.target.value)
                              }
                            />
                          </label>
                          <button
                            type="button"
                            disabled={
                              pendingAction === `image-${product.id}` ||
                              imageDraft.url.trim().length === 0
                            }
                            onClick={() => void handleAddImage(product)}
                          >
                            {pendingAction === `image-${product.id}` ? "Adding" : "Add Image"}
                          </button>
                        </div>
                      </section>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      </section>
    );
  }

  function renderPaymentSection(order: Order) {
    return (
      <section className="admin-work-section" aria-label="Admin payments">
        <div className="panel-heading">
          <h3>Payments</h3>
        </div>

        <div className="payment-list">
          {order.payments.length === 0 ? (
            <details className="manual-payment-actions">
              <summary>Manual actions</summary>
              <div className="payment-controls">
                <button
                  type="button"
                  disabled={pendingAction === `create-payment-${order.id}`}
                  onClick={() => void handleCreatePayment(order)}
                >
                  {pendingAction === `create-payment-${order.id}` ? "Creating" : "Create Manual Payment"}
                </button>
              </div>
            </details>
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
                    {payment.provider === "stripe" ? (
                      <StripePaymentDetails order={order} payment={payment} />
                    ) : null}
                    <div className="payment-quick-actions">
                      <div className="payment-controls">
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
                      <details className="manual-payment-actions">
                        <summary>Manual actions</summary>
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
                        </div>
                      </details>
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
      </section>
    );
  }

  function renderFulfillmentSection(order: Order) {
    const hasRemainingItems = order.items.some((item) => remainingShipmentQuantity(order, item.id) > 0);

    return (
      <section className="admin-work-section" aria-label="Admin fulfillment">
        <div className="panel-heading">
          <h3>Fulfillment</h3>
        </div>

        {!canFulfillOrder(order) ? (
          <p className="warning">Payment is {order.paymentStatus}; do not fulfill this order.</p>
        ) : null}

        {hasRemainingItems ? (
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
            <div className="shipment-item-picker">
              {order.items.map((item) => {
                const remaining = remainingShipmentQuantity(order, item.id);
                const shipped = shippedShipmentQuantity(order, item.id);

	                return (
	                  <label key={item.id}>
	                    <span>
                      {item.sku} ordered {item.quantity} / fulfilled {shipped} / unallocated {remaining}
	                    </span>
	                    <input
	                      type="number"
	                      min="0"
	                      max={remaining}
	                      value={newShipmentItemDrafts[order.id]?.[item.id] ?? String(remaining)}
	                      disabled={remaining === 0}
	                      onChange={(event) =>
	                        updateNewShipmentItemDraft(order.id, item.id, event.target.value)
	                      }
	                      placeholder={String(remaining)}
	                    />
	                  </label>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="shipment-list">
          {hasRemainingItems ? (
            <button
              type="button"
              disabled={pendingAction === `create-shipment-${order.id}` || !canFulfillOrder(order)}
              onClick={() => void handleCreateShipment(order)}
            >
              {pendingAction === `create-shipment-${order.id}` ? "Creating" : "Create Shipment"}
            </button>
          ) : (
            <div className="empty-state compact">All order items are allocated to shipments</div>
          )}

          {order.shipments.length === 0 ? (
            hasRemainingItems ? null : <div className="empty-state compact">No shipments</div>
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
                  {shipment.items.length > 0 ? (
                    <div className="shipment-item-list" aria-label="Shipment items">
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
          <p className="eyebrow">Health</p>
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
          <span>Products</span>
          <strong>{adminProducts.length}</strong>
        </div>
        <div className="metric">
          <span>View</span>
          <strong>{activeView === "orders" ? "Orders" : "Catalog"}</strong>
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
          <nav className="admin-tabs" aria-label="Admin sections">
            <button
              className={activeView === "orders" ? "status-action active" : "status-action"}
              type="button"
              onClick={() => setActiveView("orders")}
            >
              Orders
            </button>
            <button
              className={activeView === "catalog" ? "status-action active" : "status-action"}
              type="button"
              onClick={() => setActiveView("catalog")}
            >
              Catalog
            </button>
          </nav>

          {activeView === "catalog" ? renderCatalogSection() : null}

          {activeView === "orders" ? (
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
                            <span className={`pill ${statusClass(order.status)}`}>{order.status}</span>
                            <span className={`pill ${statusClass(order.paymentStatus)}`}>
                              {order.paymentStatus}
                            </span>
                            <span className={`pill ${statusClass(order.fulfillmentStatus)}`}>
                              {order.fulfillmentStatus}
                            </span>
                            {order.inventoryReleasedAt ? (
                              <span className="pill inventory-released">Inventory released</span>
                            ) : null}
                          </div>
                        </button>

                        {isSelected ? (
                          <div className="admin-order-expanded">
                            <AdminOrderSnapshot order={order} />
                            <section className="admin-work-section activity-accordion">
                              <div className="panel-heading">
                                <div>
                                  <h3>Fulfillment & Payment</h3>
                                  <small>
                                    {orderTimeline(order).length} events, {order.payments.length} payments,{" "}
                                    {order.shipments.length} shipments, {order.notificationEvents?.length ?? 0} notifications
                                  </small>
                                </div>
                                <button
                                  aria-expanded={isOrderActivityOpen(order.id)}
                                  className="status-action section-toggle"
                                  type="button"
                                  onClick={() => toggleOrderActivity(order.id)}
                                >
                                  {isOrderActivityOpen(order.id) ? "Collapse" : "Expand"}
                                </button>
                              </div>

                              {isOrderActivityOpen(order.id) ? (
                                <div className="activity-stack">
                                  {renderFulfillmentSection(order)}
                                  {renderPaymentSection(order)}
                                  <AdminNotificationSection order={order} />
                                  <AdminOrderTimeline order={order} />
                                </div>
                              ) : null}
                            </section>
                            {renderNotesSection(order)}
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
          ) : null}
      </section>
      )}
    </main>
  );
}
