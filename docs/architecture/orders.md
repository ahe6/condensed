# Orders

This doc covers backend order behavior, customer order lookup, and admin order operations. Route contracts live in [API](../reference/api.md), module inventory lives in [Backend Modules](backend-modules.md), payment behavior lives in [Payments](payments.md), and fulfillment behavior lives in [Fulfillment](fulfillment.md).

Last verified against backend order routes and services on 2026-06-05.

## Customer Orders

Customer order detail is fetched by order number:

- `GET /orders/:orderNumber`

The route requires the signed-in customer's Cognito bearer token and only returns an order when it belongs to that user.

Order detail includes addresses, items, payments, and shipments. Customer responses do not include internal admin notes.

## Admin Orders

Admin order routes are protected by the global `/admin/*` Cognito admin pre-handler.

Admin routes:

- `GET /admin/orders`
- `POST /admin/orders/:id/place`
- `POST /admin/orders/:id/cancel`
- `POST /admin/orders/:id/notes`

Admin order status changes should use explicit service functions and routes, not arbitrary patch objects.

## Search And Filtering

The admin order list accepts search, payment/fulfillment filters, event date ranges, sort, page, and page size query params.

The backend uses SQL for matching, counting, ranking, and pagination, then fetches the selected order rows with admin-only relations for the response envelope.

Admin search includes:

- order number and email
- customer names from addresses
- line item names and SKUs
- payment and fulfillment status text
- note bodies and note authors

## Admin Notes

Admin notes are internal order records created by `POST /admin/orders/:id/notes`.

Notes store:

- `orderId`
- `body`
- `authorEmail` when Cognito provides it
- `createdAt`

Notes are included in admin order responses only. Customer order detail and customer order history do not include internal notes.

## Timeline

The admin frontend builds a combined order timeline from the admin order response.

Timeline rows include:

- order creation and placement
- admin notes
- payment status events
- shipment status events
- shipment tracking changes
- notification events

Detailed payment, shipment, and notification histories remain available behind folded per-record sections.

## Cancellation And Inventory

Cancelling an unpaid, failed, or expired unfulfilled order can release inventory back to variants. The backend uses `orders.inventoryReleasedAt` to make release idempotent.

Admin cancellation still marks the order `CANCELLED` even when inventory is not eligible for release. Before cancelling, the backend checks non-paid/non-refunded local Stripe Checkout Session records against Stripe; if Stripe reports one is complete or paid, cancellation is blocked.

The Stripe Checkout reconciliation job uses the same inventory-release guard and only expires/cancels local orders when Stripe reports the Checkout Session as expired.

## Key Functions

- `listOrders(query)`: admin-only SQL-backed search/filter/sort/page query. The raw SQL returns IDs first, then Prisma loads full order relations with `adminOrderInclude`.
- `cancelOrder(orderId)`: retrieves live Stripe Checkout Sessions before the DB transaction; it refuses to cancel if Stripe says a session is complete/paid. Inside the transaction it cancels the order and releases inventory only for unfulfilled unpaid/failed/expired orders that have not already released inventory.
- `cancelUnpaidOrderAndReleaseInventory(orderId, releasedAt)`: idempotent unpaid-order cancellation path used by payment reconciliation and expiry jobs. It only affects unfulfilled pending/placed unpaid/failed/expired orders with `inventoryReleasedAt = null`.
- `expireUnpaidOrders(options)`: batch job entry point that finds old unpaid orders, checks/optionally expires open Stripe Checkout Sessions, and releases inventory only when Stripe does not report a completed payment.
- `markOrderPlaced(orderId)`, `updatePaymentStatus(orderId, paymentStatus)`, and `updateFulfillmentStatus(orderId, fulfillmentStatus)`: low-level state writers. Prefer higher-level payment and shipment functions when an action should also create audit events or recalculate aggregate status.
