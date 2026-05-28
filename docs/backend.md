# Backend

This doc describes how backend code should be organized. Endpoint details live in [API](api.md), ecommerce process details live in [Flows](flows.md), fulfillment details live in [Fulfillment](fulfillment.md), and database table details live in [Database](database.md).

## Request Flow

All HTTP requests should follow this path:

```text
Fastify route
  -> Zod schema validation
  -> service function
  -> Prisma
  -> response
```

Route handlers should stay thin. They should parse params/body, call one service function, and decide the HTTP status code.

Service functions own business rules and Prisma calls. They should not know about Fastify request or reply objects.

Schema files own input validation. They should also export TypeScript types inferred from Zod so services receive typed inputs.

Shared error handling lives in `apps/backend/src/server.ts`.

## Module Convention

Backend modules live in `apps/backend/src/modules`.

Each module should use this shape:

```text
module-name/
  module-name.routes.ts
  module-name.schemas.ts
  module-name.service.ts
```

File responsibilities:

- `*.routes.ts`: Fastify route registration and HTTP response codes
- `*.schemas.ts`: Zod schemas and inferred input types
- `*.service.ts`: business logic and Prisma reads/writes

Avoid adding a repository layer until there is a real repeated data-access pattern to extract.

## Current Modules

### Auth

Current responsibilities:

- Verify Cognito ID tokens
- Upsert or link local users by Cognito subject and email
- Require Cognito `admin` group membership for backend admin routes
- Return the current account profile
- Update local profile name and phone
- Return and manage the current user's saved addresses
- Return the current user's order history

Current routes:

- `GET /me`
- `PATCH /me`
- `GET /me/addresses`
- `POST /me/addresses`
- `PATCH /me/addresses/:id`
- `DELETE /me/addresses/:id`
- `GET /me/orders`

Checkout requires the same bearer token and links the created order to the authenticated user.

Backend `/admin/*` routes are protected by a global Fastify pre-handler in `server.ts`.

### Users

Current responsibilities:

- List users
- Create users
- List current user's saved addresses
- Create current user's saved addresses
- Update current user's saved addresses
- Delete current user's saved addresses
- Set default shipping and billing addresses

Current routes:

- `GET /users`
- `POST /users`
- `GET /me/addresses`
- `POST /me/addresses`
- `PATCH /me/addresses/:id`
- `DELETE /me/addresses/:id`

### Catalog

Current responsibilities:

- List public active products
- Get product by slug
- List categories
- Create/update products through admin routes
- Publish/archive products
- Create/update variants
- Set variant inventory
- Add product images
- Assign/remove categories

Catalog services are the foundation for cart and checkout. Cart items should reference `product_variants`, not `products`.

### Carts

Current responsibilities:

- Create anonymous carts
- Create or reuse signed-in customer carts
- Adopt or merge an anonymous browser-local cart into a signed-in customer cart
- Enforce cart ownership for user-owned carts
- Get a cart with items and calculated totals
- Add variants to a cart
- Increment existing cart item quantities
- Update cart item quantities
- Reject inactive products and cart quantities above current variant inventory
- Remove cart items
- Clear a cart

Current routes:

- `GET /me/cart`
- `POST /me/cart`
- `POST /carts`
- `GET /carts/:id`
- `POST /carts/:id/items`
- `PATCH /carts/:id/items/:itemId`
- `DELETE /carts/:id/items/:itemId`
- `DELETE /carts/:id/items`

Cart totals are calculated from current variant prices and returned in the response. They are not stored in the database.

Signed-in clients should use `POST /me/cart` at startup. Passing a browser-local `cartId` lets the backend attach that cart to the user or merge its items into the user's existing cart.

### Checkout

Current responsibilities:

- Convert a valid cart into an order
- Validate cart items, product status, currency, and inventory
- Snapshot order items
- Snapshot shipping and billing addresses
- Deduct variant inventory
- Clear the cart after order creation
- Create a Stripe Checkout Session with the order in one customer checkout call
- Expire unpaid orders after a configurable age and release inventory once

Current routes:

- `POST /checkout`
- `POST /checkout/stripe`

Inventory changes and order creation happen in a Prisma transaction.

Unpaid expiry is run by `npm run orders:expire` or `make orders-expire`. By default it cancels `PLACED`/`PENDING`, `UNPAID`/`FAILED`, unfulfilled orders older than 15 minutes, expires open Stripe Checkout Sessions, sets `inventoryReleasedAt`, and increments variant inventory for each order item. Configure with `ORDER_EXPIRY_MINUTES` and `ORDER_EXPIRY_BATCH_SIZE`.

### Orders

Current responsibilities:

- Get one order by order number
- List all orders through an admin route
- Mark an order placed through a controlled admin route
- Cancel an order through a controlled admin route

Current routes:

- `GET /orders/:orderNumber`
- `GET /admin/orders`
- `POST /admin/orders/:id/place`
- `POST /admin/orders/:id/cancel`
- `POST /admin/orders/:id/notes`

The admin order list accepts search, payment/fulfillment filters, event date ranges, sort, page, and page size query params. The backend uses SQL for matching, counting, ranking, and pagination, then fetches the selected order rows with their admin relations for the response envelope. Search includes order fields, customer names, line items, SKUs, note bodies/authors, and status text.

Admin notes are internal order records. They are included only in admin order responses and store the signed-in admin email when Cognito provides it.

The admin frontend builds a combined order timeline from the admin order response. Timeline rows include order creation/placement, notes, payment status events, shipment status events, and tracking changes. Detailed payment and shipment histories remain available behind folded per-record history controls.

Admin order status changes should be explicit service functions, not arbitrary patch objects, so state transitions stay controlled.

### Payments

Current responsibilities:

- Create Stripe Checkout Sessions for checkout and unpaid-order recovery
- Handle Stripe Checkout Session webhook status updates
- Support Checkout Elements from the frontend checkout
- Record provider-agnostic payment attempts
- Mark payments authorized
- Mark payments paid
- Mark payments failed
- Mark payments refunded
- Update the parent order `paymentStatus` when payment state changes

Current routes:

- `POST /orders/:id/stripe-checkout-session` for existing unpaid order recovery
- `POST /admin/orders/:id/payments`
- `POST /admin/payments/:id/authorize`
- `POST /admin/payments/:id/pay`
- `POST /admin/payments/:id/fail`
- `POST /admin/payments/:id/refund`
- `POST /webhooks/stripe`

Main service functions:

- `createStripeCheckoutSession`
- `handleStripeWebhook`
- `createPayment`
- `markPaymentAuthorized`
- `markPaymentPaid`
- `markPaymentFailed`
- `refundPayment`

Payment status changes happen in a Prisma transaction with the parent order update. Stripe webhooks update the local Stripe payment row and parent order status from Checkout Session events. PaymentIntent events are still handled for older local payment rows.

### Shipments

Current responsibilities:

- Create shipment placeholders
- Assign order item quantities to shipments
- Add or update tracking details
- Mark shipments shipped
- Mark shipments delivered
- Mark shipments returned
- Recalculate the parent order `fulfillmentStatus` when shipment state changes

Current routes:

- `POST /admin/orders/:id/shipments`
- `PATCH /admin/shipments/:id/tracking`
- `POST /admin/shipments/:id/ship`
- `POST /admin/shipments/:id/deliver`
- `POST /admin/shipments/:id/return`

Main service functions:

- `createShipment`
- `addTrackingNumber`
- `markShipmentShipped`
- `markShipmentDelivered`
- `markShipmentReturned`

Shipment status changes happen in a Prisma transaction with the parent order update. Parent order fulfillment status is calculated from shipped, delivered, and returned `shipment_items`.

Shipment creation plus shipped/delivered transitions are guarded by payment status. The backend only allows fulfillment when the order is `PAID` or `AUTHORIZED`; existing shipments can still be marked returned.

Shipment creation and status changes write `shipment_status_events` rows for admin history.

Tracking creation and edits write `shipment_tracking_events` rows when carrier or tracking number values are present and actually change.

See [Fulfillment](fulfillment.md) for the full shipment workflow and tracking-link behavior.
