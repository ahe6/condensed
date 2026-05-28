import Link from "next/link";
import type { Order } from "../lib/api";
import { formatDateTime, formatMoney, statusClass, trackingUrl } from "../lib/format";

export function OrderSummary({ order }: { order: Order }) {
  return (
    <article className="order-summary">
      <div className="order-summary-heading">
        <div>
          <span>Order</span>
          <strong>{order.orderNumber}</strong>
        </div>
        <div>
          <strong>{formatMoney(order.total, order.currency)}</strong>
          <Link className="text-link" href={`/orders/${encodeURIComponent(order.orderNumber)}`}>
            View details
          </Link>
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
