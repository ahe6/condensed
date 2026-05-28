# Flows

This doc describes how ecommerce information moves through the backend. Code organization lives in [Backend](backend.md), endpoint details live in [API](api.md), fulfillment details live in [Fulfillment](fulfillment.md), and database table details live in [Database](database.md).

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
signed-in client loads /me/cart and may pass browser-local cartId for adoption or merge
client adds variant
client updates quantities
backend recalculates totals from current variant prices
```

Anonymous carts are browser-local by cart ID. Signed-in carts are attached to the current user, and user-owned carts can only be changed by that user. Cart totals are previews. Order totals become authoritative at checkout.

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

The admin order list is queried through SQL-backed search, filters, sorting, and pagination. Admin search covers order fields, customer names, line items, SKUs, status text, and internal notes.

Expanded admin orders include an internal timeline built from order creation/placement, admin notes, payment status events, shipment status events, and shipment tracking changes. Detailed payment and fulfillment histories stay folded until an admin opens the relevant history control.

## Payment Update

```text
Stripe Checkout Session webhook or admin action updates payment
backend records payment state
backend updates order payment status
```

Do not mark an order paid only from the frontend. Payment state should come from backend-controlled Stripe webhook confirmation or an admin path.

Current payment status changes update the payment and parent order in the same Prisma transaction.

## Shipment Update

```text
admin creates shipment
admin assigns order item quantities
admin adds tracking
admin marks shipment shipped or delivered
backend recalculates order fulfillment status
```

Shipments contain `shipment_items`, so one order can be split across multiple packages. Marking shipments shipped or delivered recalculates the parent order as `UNFULFILLED`, `PARTIAL`, or `FULFILLED` based on shipped quantity. Returned shipments are excluded from shipped quantity and can mark the order `RETURNED` when returned quantity covers the full order.

Fulfillment actions are blocked unless payment is `PAID` or `AUTHORIZED`. Orders with `UNPAID`, `FAILED`, `DISPUTED`, or `REFUNDED` payment status should not be shipped.

Shipment creation and status changes are recorded in `shipment_status_events` so admin can see the fulfillment timeline. Carrier and tracking number changes are recorded in `shipment_tracking_events` so corrected labels remain auditable.

When a shipment has a supported carrier and tracking number, the frontend builds a public tracking link. Supported carrier names currently include UPS, USPS, FedEx, and DHL. This is a link-out only; the app does not call carrier APIs for live tracking updates.

See [Fulfillment](fulfillment.md) for the full shipment and tracking behavior.

## Design Rules

Admin routes require a Cognito ID token with membership in the `admin` group.

Order items snapshot product name, variant title, SKU, unit price, quantity, and total.

Order addresses snapshot shipping and billing fields.

Prices enter the API as decimal strings. This avoids accidental JSON floating point precision issues at the boundary.

Prisma migrations own database shape. Do not manually edit local databases to add schema.

Local database records are disposable during early development unless we add seed scripts or backups.

## Next Implementation Order

Recommended sequence:

1. Improve checkout so payment is collected before the cart is cleared.
2. Add carrier label purchase or live carrier status sync when fulfillment leaves manual operations.
