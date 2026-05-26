# Ecommerce Flows

This doc describes how ecommerce information moves through the backend. Code organization lives in [Backend Architecture](backend-architecture.md), endpoint details live in [Backend API](backend-api.md), and database table details live in [Database Schema](database-schema.md).

## Catalog Management

```text
admin creates category
admin creates product as DRAFT or ACTIVE
admin creates variants and images
admin assigns categories
admin publishes product
```

Public product lists should only show `ACTIVE` products. Admin product lists show every status.

## Product Browsing

```text
client lists products
client opens product by slug
client selects variant
client adds variant to cart
```

The frontend should treat variants as purchasable items. Product records are for display and grouping.

## Cart Management

```text
client creates or resumes cart
client adds variant
client updates quantities
backend recalculates totals from current variant prices
```

Cart totals are previews. Order totals become authoritative at checkout.

## Checkout

```text
client submits cart, email, and addresses
  -> validate cart has items
  -> validate every variant still exists
  -> validate requested quantities are available
  -> calculate subtotal, shipping, tax, and total
  -> create order
  -> copy item details into order_items
  -> copy address details into order_addresses
  -> decrement inventory
  -> clear cart
  -> return order number
```

Order creation is the boundary where mutable cart data becomes durable purchase data. Inventory changes and order creation happen in a Prisma transaction.

## Order Lookup

```text
client requests order by order number
  -> fetch order with addresses, items, payments, and shipments
  -> return order detail
```

Admin order status changes should use explicit service functions and routes, not arbitrary patch objects.

## Payment Update

```text
payment provider or dev-admin action updates payment
backend records payment state
backend updates order payment status
```

Do not mark an order paid only from the frontend. Payment state should come from backend-controlled provider confirmation or a dev-admin path.

Current payment status changes update the payment and parent order in the same Prisma transaction.

## Shipment Update

```text
admin creates shipment
admin adds tracking
admin marks shipment shipped or delivered
backend updates order fulfillment status
```

Current shipment records are order-level. Marking a shipment shipped or delivered marks the parent order `FULFILLED`; marking a shipment returned marks the parent order `RETURNED`.

## Design Rules

Admin routes are dev-only until authentication and authorization exist.

Order items snapshot product name, variant title, SKU, unit price, quantity, and total.

Order addresses snapshot shipping and billing fields.

Prices enter the API as decimal strings. This avoids accidental JSON floating point precision issues at the boundary.

Prisma migrations own database shape. Do not manually edit local databases to add schema.

Local database records are disposable during early development unless we add seed scripts or backups.

## Next Implementation Order

Recommended sequence:

1. Add authentication and authorization before exposing admin routes outside local development.
2. Add provider webhook handlers when a real payment provider is chosen.
3. Add fulfillment quantity support if orders need split or partial shipments.
