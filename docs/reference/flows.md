# Flows

This doc describes product and business flows at a high level. Backend module collaboration lives in [Backend Flows](../architecture/backend-flows.md), endpoint contracts live in [API](api.md), and data shape lives in [Database](../architecture/database.md).

Last verified against the backend behavior docs on 2026-06-05.

## Catalog

Admins create products, variants, images, and categories. Public shoppers browse active products, choose a variant, and add that variant to a cart.

Product records describe the merchandised item. Variants are the purchasable SKUs with price, currency, and inventory.

Read:

- [Catalog](../architecture/catalog.md)
- [API](api.md)

## Cart

Shoppers build a cart from selected variants. Anonymous carts can exist before sign-in, and signed-in users can adopt or merge a browser-local cart into their account cart.

Cart totals are previews based on current variant prices. Checkout recalculates and snapshots final order totals.

Read:

- [Carts](../architecture/carts.md)
- [Catalog](../architecture/catalog.md)

## Checkout

Checkout turns a mutable cart into a durable order. The customer submits contact email plus shipping and billing addresses. The backend validates product status and inventory, snapshots order data, decrements inventory, and clears the cart.

When Stripe is configured, checkout also starts a Stripe Checkout Session so the customer can pay through Checkout Elements.

Read:

- [Checkout](../architecture/checkout.md)
- [Payments](../architecture/payments.md)

## Orders

Customers can view their own orders by order number. Admins can search, filter, sort, and review orders across customers.

Admin order detail brings together order records, notes, payments, shipments, tracking changes, and notification events so operators can understand what happened without manually joining tables.

Read:

- [Orders](../architecture/orders.md)
- [API](api.md)

## Payments

Payment state is owned by the backend and reconciled with Stripe. A payment can move through states such as unpaid, paid, failed, expired, refunded, or disputed.

Stripe webhooks are the normal source of truth for automatic payment updates. Admin sync exists for manual reconciliation when webhook delivery or local development setup gets out of step.

Read:

- [Payments](../architecture/payments.md)
- [Backend Flows](../architecture/backend-flows.md)

## Fulfillment

Admins create shipments, assign order item quantities, add tracking, and mark shipments shipped, delivered, or returned.

The order fulfillment status summarizes shipment progress. Fulfillment is blocked for unpaid, failed, expired, disputed, or refunded orders.

Read:

- [Fulfillment](../architecture/fulfillment.md)
- [Orders](../architecture/orders.md)

## Notifications

Delivered shipments create customer notification records. When SES email is configured, the backend sends the delivered email and records the provider result. Pending or failed notification events can be retried.

Customer emails should stay minimal and link back to authenticated order detail for sensitive information.

Read:

- [Notifications](../architecture/notifications.md)
- [Fulfillment](../architecture/fulfillment.md)

## Operational Priorities

Recommended next implementation priorities:

1. Keep scheduled Stripe Checkout reconciliation enabled and observable in AWS.
2. Add carrier label purchase or live carrier status sync when fulfillment leaves manual operations.
3. Make admin refunds call Stripe's Refund API instead of only changing local state.
4. Persist Stripe webhook deliveries locally if webhook debugging becomes recurring operational work.
