# Orders

This doc covers backend order behavior, customer order lookup, and admin order operations. Route contracts live in [API](../reference/api.md), module inventory lives in [Backend Modules](backend-modules.md), payment behavior lives in [Payments](payments.md), and fulfillment behavior lives in [Fulfillment](fulfillment.md).

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

The Stripe Checkout reconciliation job uses the same inventory-release guard and only expires/cancels local orders when Stripe reports the Checkout Session as expired.
