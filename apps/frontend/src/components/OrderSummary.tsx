import Link from "next/link";
import type { Order } from "../lib/api";
import { formatDateTime, formatMoney, statusClass, trackingUrl } from "../lib/format";
import { OrderReservationStatus, canPayOrder, useReservationNow } from "./OrderReservationStatus";

export function OrderSummary({ order }: { order: Order }) {
  const orderHref = `/orders/${encodeURIComponent(order.orderNumber)}`;
  const reservationNow = useReservationNow(order);

  return (
    <article className="order-summary">
      <div className="order-summary-heading">
        <div>
          <span>Order</span>
          <strong>{order.orderNumber}</strong>
        </div>
        <div>
          <strong>{formatMoney(order.total, order.currency)}</strong>
          <div className="order-summary-actions">
            {canPayOrder(order, reservationNow) ? (
              <Link className="nav-link" href={orderHref}>
                Pay Now
              </Link>
            ) : null}
            <Link className="text-link" href={orderHref}>
              View details
            </Link>
          </div>
        </div>
      </div>

      <div className="status-row">
        <span className={`pill ${statusClass(order.status)}`}>{order.status}</span>
        <span className={`pill ${statusClass(order.paymentStatus)}`}>{order.paymentStatus}</span>
        <span className={`pill ${statusClass(order.fulfillmentStatus)}`}>
          {order.fulfillmentStatus}
        </span>
      </div>

      <dl className="order-meta">
        <div>
          <dt>Ordered</dt>
          <dd>{formatDateTime(order.placedAt ?? order.createdAt)}</dd>
        </div>
      </dl>
      <OrderReservationStatus order={order} compact />

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
    </article>
  );
}
