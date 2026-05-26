import type { Order } from "../lib/api";
import { formatMoney, statusClass } from "../lib/format";

export function OrderSummary({ order }: { order: Order }) {
  return (
    <article className="order-summary">
      <div className="order-summary-heading">
        <div>
          <span>Order</span>
          <strong>{order.orderNumber}</strong>
        </div>
        <strong>{formatMoney(order.total, order.currency)}</strong>
      </div>

      <div className="status-row">
        <span className={`pill ${statusClass(order.status)}`}>{order.status}</span>
        <span className={`pill ${statusClass(order.paymentStatus)}`}>{order.paymentStatus}</span>
        <span className={`pill ${statusClass(order.fulfillmentStatus)}`}>
          {order.fulfillmentStatus}
        </span>
      </div>

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
    </article>
  );
}
