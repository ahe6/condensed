# API

The backend is a Fastify app in `apps/backend`.

Backend module conventions live in [Backend Conventions](../architecture/backend-conventions.md), module collaboration lives in [Backend Flows](../architecture/backend-flows.md), and module route inventory lives in [Backend Modules](../architecture/backend-modules.md). User/address behavior lives in [Users](../architecture/users.md), cart behavior lives in [Carts](../architecture/carts.md), and checkout behavior lives in [Checkout](../architecture/checkout.md). Business flows live in [Flows](flows.md). Fulfillment workflow details live in [Fulfillment](../architecture/fulfillment.md).

## Structure

Routes are organized by module:

```text
apps/backend/src/modules/
  users/
    users.routes.ts
    users.schemas.ts
    users.service.ts
  auth/
    auth.routes.ts
    auth.service.ts
  catalog/
    catalog.routes.ts
    catalog.schemas.ts
    catalog.service.ts
  carts/
    carts.routes.ts
    carts.schemas.ts
    carts.service.ts
  checkout/
    checkout.routes.ts
    checkout.schemas.ts
    checkout.service.ts
  orders/
    orders.routes.ts
    orders.schemas.ts
    orders.service.ts
  payments/
    payments.routes.ts
    payments.schemas.ts
    payments.service.ts
  shipments/
    shipments.routes.ts
    shipments.schemas.ts
    shipments.service.ts
```

Route files should stay thin: parse input, call a service, and shape the HTTP response. Service files own Prisma calls and business logic. Schema files own Zod request validation.

`apps/backend/src/server.ts` owns shared Fastify setup, CORS, health/readiness routes, error handling, and module registration.

All `/admin/*` routes require a valid Cognito ID token with membership in the `admin` group.

Authenticated customer routes expect a Cognito ID token in the `Authorization: Bearer <token>` header.

See [Auth](../architecture/auth.md) for the Cognito flow and admin group setup.

## Health

```text
GET /health
GET /ready
```

`/health` checks that the process can answer. `/ready` checks database connectivity.

## Users

```text
GET  /users
POST /users
```

`GET /users` returns users newest first.

`POST /users` accepts:

```json
{
  "email": "customer@example.com",
  "name": "Customer Name",
  "phone": "555-123-4567"
}
```

Only `email` is required.

## Auth

```text
GET /me
PATCH /me
GET /me/addresses
POST /me/addresses
PATCH /me/addresses/:id
DELETE /me/addresses/:id
GET /me/orders
```

`GET /me` verifies the Cognito ID token, upserts a local `users` row keyed by `externalAuthId`, and returns the local user.

`PATCH /me` updates local profile fields:

```json
{
  "name": "Test User",
  "phone": "555-0100"
}
```

Send `null` for `name` or `phone` to clear it. Email is controlled by Cognito and is refreshed from the ID token.

`GET /me/addresses` returns saved addresses owned by the current user. `POST /me/addresses` creates a saved address:

```json
{
  "label": "Home",
  "recipientName": "Test User",
  "line1": "1 Main St",
  "city": "Austin",
  "state": "TX",
  "postalCode": "78701",
  "country": "US",
  "phone": "555-0100",
  "isDefaultShipping": true,
  "isDefaultBilling": true
}
```

`PATCH /me/addresses/:id` updates address fields or default flags. Setting `isDefaultShipping` or `isDefaultBilling` to `true` clears that default flag from the user's other addresses. `DELETE /me/addresses/:id` removes a saved address. Order addresses are snapshots, so deleting a saved address does not change historical orders.

`GET /me/orders` returns orders linked to the current local user.

`POST /checkout`, `POST /checkout/stripe`, and `GET /orders/:orderNumber` also require the same bearer token. Checkout links the created order to the authenticated user. Order detail only returns an order when it belongs to that user.

The frontend confirmation page at `/auth/confirm` uses Cognito public signup APIs directly for confirm-code and resend-email recovery.

## Catalog

Public catalog routes:

```text
GET /products
GET /products/:slug
GET /categories
```

`GET /products` returns active products only, newest first.

Product responses include:

- `purchaseMode`: `DIRECT` or `ASSESSMENT_REQUIRED`
- `variants`
- `images`
- `categories` with nested `category`

`GET /products/:slug` returns one active product by slug for public product detail pages.

`GET /categories` returns categories ordered by name.

Dev-admin catalog routes:

```text
GET    /admin/products
POST   /admin/products
PATCH  /admin/products/:id
POST   /admin/products/:id/publish
POST   /admin/products/:id/archive
POST   /admin/products/:id/categories
DELETE /admin/products/:id/categories/:categoryId
POST   /admin/products/:id/images
POST   /admin/products/:id/variants
PATCH  /admin/variants/:id
PATCH  /admin/variants/:id/inventory
POST   /admin/categories
```

`POST /admin/products` accepts:

```json
{
  "slug": "dev-mug",
  "name": "Dev Mug",
  "description": "A mug for local testing",
  "status": "ACTIVE",
  "purchaseMode": "DIRECT",
  "categoryIds": [],
  "images": [
    {
      "url": "https://example.com/mug.jpg",
      "altText": "Dev Mug",
      "sortOrder": 0
    }
  ],
  "variants": [
    {
      "sku": "DEV-MUG-001",
      "title": "Default",
      "price": "19.99",
      "currency": "USD",
      "inventoryQuantity": 25
    }
  ]
}
```

`slug` must be lowercase URL-safe text. `purchaseMode` is optional and defaults to `DIRECT`; use `ASSESSMENT_REQUIRED` for care-program products that should not enter normal cart checkout. Prices are accepted as decimal strings with up to two cents.

`GET /admin/products` returns all products, including drafts and archived products.

The admin frontend uses these routes for the catalog tab in `/admin`. Product row changes are saved through product, variant, image, category, and inventory routes, then the frontend reloads the admin product list.

`PATCH /admin/products/:id` accepts any subset of:

```json
{
  "slug": "updated-dev-mug",
  "name": "Updated Dev Mug",
  "description": "Updated description",
  "status": "ACTIVE",
  "purchaseMode": "DIRECT"
}
```

Use `POST /admin/products/:id/publish` and `POST /admin/products/:id/archive` for common status changes.

`POST /admin/products/:id/categories` accepts:

```json
{
  "categoryId": "00000000-0000-0000-0000-000000000000"
}
```

`DELETE /admin/products/:id/categories/:categoryId` removes the category assignment and returns the updated product.

`POST /admin/products/:id/images` accepts:

```json
{
  "url": "https://example.com/mug.jpg",
  "altText": "Dev Mug",
  "sortOrder": 0
}
```

`POST /admin/products/:id/variants` accepts:

```json
{
  "sku": "DEV-MUG-002",
  "title": "Large",
  "price": "24.99",
  "currency": "USD",
  "inventoryQuantity": 10
}
```

`PATCH /admin/variants/:id` accepts any subset of SKU, title, price, currency, and inventory quantity:

```json
{
  "title": "Large Mug",
  "price": "21.50"
}
```

Use `PATCH /admin/variants/:id/inventory` when only adjusting stock:

```json
{
  "inventoryQuantity": 12
}
```

## Validation Notes

IDs in route params must be UUIDs.

Product and category slugs must be lowercase URL-safe text, for example `dev-mug`.

Currency codes are normalized to uppercase three-character values.

Prices are accepted as strings instead of JSON numbers so callers do not accidentally send imprecise floating point values.

## Carts

```text
GET    /me/cart
POST   /me/cart
POST   /carts
GET    /carts/:id
POST   /carts/:id/items
PATCH  /carts/:id/items/:itemId
DELETE /carts/:id/items/:itemId
DELETE /carts/:id/items
```

`GET /me/cart` requires a Cognito ID token. It returns the current user's latest cart or creates one.

`POST /me/cart` also requires a Cognito ID token and can adopt or merge an existing browser-local anonymous cart into the signed-in user's cart:

```json
{
  "cartId": "00000000-0000-0000-0000-000000000000"
}
```

If the user already has a cart, anonymous cart items are merged by variant and the anonymous cart is deleted. If the provided cart does not exist, the route still returns the user's current cart or creates one.

`POST /carts` creates an anonymous cart when no bearer token is present. With a valid bearer token, it creates a cart for the signed-in user. Clients should prefer `POST /me/cart` for signed-in cart startup so existing user carts are reused.

`GET /carts/:id` and cart item mutations allow anonymous carts without auth. User-owned carts can only be read or changed by the owning signed-in user.

Cart responses include:

- `items`
- each item `variant`
- each variant `product`
- response-only `totals`

Example totals:

```json
{
  "totals": {
    "itemCount": 2,
    "subtotal": "43.00",
    "total": "43.00"
  }
}
```

`POST /carts/:id/items` accepts:

```json
{
  "variantId": "00000000-0000-0000-0000-000000000000",
  "quantity": 2
}
```

Adding the same variant again increments the existing cart item quantity.

`PATCH /carts/:id/items/:itemId` accepts:

```json
{
  "quantity": 4
}
```

Quantity must be positive and cannot exceed current variant inventory. Adding or updating cart items also rejects inactive products. Use `DELETE /carts/:id/items/:itemId` to remove an item.

`DELETE /carts/:id/items` clears all items from the cart.

## Checkout

```text
POST /checkout
POST /checkout/stripe
```

`POST /checkout` converts a cart into an order in a database transaction. It requires a Cognito ID token and links the order to the current local user.

It validates:

- cart exists
- cart has items
- products are active
- all items use one currency
- inventory is available

It then:

- creates the order
- snapshots shipping and billing addresses
- snapshots order items
- decrements variant inventory
- clears the cart

Request body:

```json
{
  "cartId": "00000000-0000-0000-0000-000000000000",
  "email": "buyer@example.com",
  "shippingAddress": {
    "recipientName": "Buyer Example",
    "line1": "123 Market St",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94105",
    "country": "US",
    "phone": "555-0100"
  },
  "billingAddress": {
    "recipientName": "Buyer Example",
    "line1": "123 Market St",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94105",
    "country": "US",
    "phone": "555-0100"
  }
}
```

Checkout returns the created order with addresses, items, payments, and shipments.

`POST /checkout/stripe` accepts the same fields plus `returnBaseUrl`:

```json
{
  "cartId": "00000000-0000-0000-0000-000000000000",
  "email": "buyer@example.com",
  "shippingAddress": {
    "recipientName": "Buyer Example",
    "line1": "123 Market St",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94105",
    "country": "US"
  },
  "billingAddress": {
    "recipientName": "Buyer Example",
    "line1": "123 Market St",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94105",
    "country": "US"
  },
  "returnBaseUrl": "http://localhost:3001"
}
```

It creates the order, builds the order-detail Stripe return URL on the backend, creates a Stripe Checkout Session, and returns:

```json
{
  "order": {},
  "checkoutSession": {
    "clientSecret": "cs_test_...",
    "checkoutSessionId": "cs_test_...",
    "payment": {}
  }
}
```

## Orders

```text
GET  /orders/:orderNumber
GET  /admin/orders
POST /admin/orders/:id/place
POST /admin/orders/:id/cancel
POST /admin/orders/:id/notes
```

`GET /orders/:orderNumber` returns one order by its human-facing order number only when the signed-in user owns that order.

`GET /admin/orders` returns a paged admin order result:

```json
{
  "orders": [],
  "total": 24,
  "page": 1,
  "pageSize": 5,
  "pageCount": 5
}
```

Supported query params:

- `search`: order number, customer email/name, item name, SKU, note text/author, or status text
- `payment`: `ALL`, `UNPAID`, `AUTHORIZED`, `PAID`, `FAILED`, `EXPIRED`, `REFUNDED`, or `DISPUTED`
- `fulfillment`: `ALL`, `UNFULFILLED`, `PARTIAL`, `FULFILLED`, or `RETURNED`
- `dateField`: `ANY`, `ORDER_CREATED`, `ORDER_PLACED`, `ORDER_UPDATED`, `SHIPMENT_CREATED`, `SHIPMENT_SHIPPED`, or `SHIPMENT_DELIVERED`
- `dateFrom` / `dateTo`: `YYYY-MM-DD`
- `sort`: `CREATED_DESC`, `CREATED_ASC`, `UPDATED_DESC`, `PLACED_DESC`, `SHIPPED_DESC`, `DELIVERED_DESC`, `TOTAL_DESC`, or `TOTAL_ASC`
- `page` and `pageSize`

The backend applies admin order matching, counting, sorting, and pagination in SQL, then fetches the selected page of order records with admin-only relations.

`POST /admin/orders/:id/place` marks an order as `PLACED` and sets `placedAt`.

`POST /admin/orders/:id/cancel` marks an order as `CANCELLED`.

`POST /admin/orders/:id/notes` creates an internal admin-only note:

```json
{
  "body": "Customer asked us to confirm shipping address before label purchase."
}
```

The backend stores the signed-in admin email when available from Cognito. Notes are returned by admin order responses and are not included in customer order detail or customer order history.

Order status changes use explicit routes so callers cannot arbitrarily patch order state.

## Payments

```text
POST /orders/:id/stripe-checkout-session
POST /admin/orders/:id/payments
POST /admin/payments/:id/authorize
POST /admin/payments/:id/pay
POST /admin/payments/:id/fail
POST /admin/payments/:id/refund
POST /admin/payments/:id/sync-stripe
POST /webhooks/stripe
```

`POST /orders/:id/stripe-checkout-session` creates or reuses a card-only Stripe Checkout Session with `ui_mode: "elements"` for an existing unpaid order and records a local Stripe payment plus a `payment_attempts` row for the Checkout Session. The normal customer checkout path uses `POST /checkout/stripe`; this route is kept for payment recovery. The session uses the order email as `customer_email` and enables phone collection, so the frontend confirms checkout with the shipping phone number.

Request:

```json
{
  "returnUrl": "http://localhost:3001/?order=HEALTH-123456&session_id={CHECKOUT_SESSION_ID}"
}
```

Response:

```json
{
  "clientSecret": "cs_...",
  "checkoutSessionId": "cs_...",
  "paymentAttempt": {},
  "payment": {}
}
```

`POST /admin/orders/:id/payments` records a provider-agnostic payment attempt:

```json
{
  "provider": "manual",
  "providerPaymentId": "dev-payment-001",
  "amount": "19.99",
  "currency": "USD"
}
```

`provider` and `amount` are required. `currency` defaults to `USD`; `providerPaymentId` is optional. Amounts are accepted as decimal strings with up to two cents.

Payment status routes update the payment and the parent order `paymentStatus` in one transaction:

- `authorize` sets both to `AUTHORIZED`
- `pay` sets both to `PAID`
- `fail` sets both to `FAILED`
- `refund` sets both to `REFUNDED`

`POST /admin/payments/:id/sync-stripe` retrieves the latest Checkout Session or PaymentIntent from Stripe and updates the local payment attempt, aggregate payment, and parent order. It stores Stripe details such as `paymentIntentId`, `chargeId`, Stripe status, and dispute flags in metadata. It only supports payments whose provider is `stripe`.

Payment responses include `attempts` and `statusEvents`. `attempts` is the ordered list of provider-side attempts under the aggregate payment. `statusEvents` is the ordered audit trail of payment status changes and includes `paymentAttemptId` when the event is tied to a specific attempt. Admin manual actions, Stripe webhooks, and admin Stripe sync write status event rows when they change payment status.

`POST /webhooks/stripe` verifies the Stripe signature when `STRIPE_WEBHOOK_SECRET` is configured and updates local payment/order status for:

- `checkout.session.completed` -> `PAID` when Stripe reports paid or no payment required
- `checkout.session.async_payment_succeeded` -> `PAID`
- `checkout.session.async_payment_failed` -> `FAILED`
- `checkout.session.expired` -> `EXPIRED`
- `payment_intent.succeeded` -> `PAID`
- `payment_intent.payment_failed` -> `FAILED`
- `payment_intent.canceled` -> `FAILED`
- `payment_intent.amount_capturable_updated` -> `AUTHORIZED`
- `charge.dispute.created`, `charge.dispute.updated`, `charge.dispute.closed` -> `DISPUTED`, or `PAID` if Stripe reports the dispute was won

## Shipments

```text
POST  /admin/orders/:id/shipments
PATCH /admin/shipments/:id/tracking
POST  /admin/shipments/:id/ship
POST  /admin/shipments/:id/deliver
POST  /admin/shipments/:id/return
```

`POST /admin/orders/:id/shipments` creates a shipment placeholder:

```json
{
  "carrier": "UPS",
  "trackingNumber": "1Z9999999999999999",
  "items": [
    {
      "orderItemId": "00000000-0000-0000-0000-000000000000",
      "quantity": 1
    }
  ]
}
```

Carrier, tracking number, and items are optional when creating a shipment, because fulfillment may be staged before a label exists. If `items` is omitted or empty, the backend assigns all remaining unallocated order item quantities to the shipment.

Shipment item quantities must belong to the order and cannot exceed remaining unallocated quantity.

Shipment creation requires the parent order payment status to be `PAID` or `AUTHORIZED`.

`PATCH /admin/shipments/:id/tracking` accepts at least one tracking field:

```json
{
  "carrier": "UPS",
  "trackingNumber": "1Z9999999999999999"
}
```

Carrier and tracking fields are stored as raw values. The frontend derives public tracking links for UPS, USPS, FedEx, and DHL; no carrier API lookup is performed.
Tracking updates overwrite the stored carrier/tracking values, which lets admins correct an incorrectly entered tracking number. Changes are also written to `shipment_tracking_events`, so the current shipment row stays simple while admin can still audit old carrier/tracking values.

Shipment status routes update the shipment and the parent order `fulfillmentStatus` in one transaction:

- `ship` sets shipment status to `SHIPPED`, sets `shippedAt`, and recalculates order fulfillment
- `deliver` sets shipment status to `DELIVERED`, sets `deliveredAt`, and recalculates order fulfillment
- `return` sets shipment status to `RETURNED` and recalculates order fulfillment

The `ship` and `deliver` actions require payment status `PAID` or `AUTHORIZED`. Returned shipment status can still be set for existing shipments so admin can clean up already-shipped orders.

The `deliver` action also creates or updates a pending `SHIPMENT_DELIVERED` notification event for the shipment. Notification events are idempotent per shipment/type and are included on admin order responses.

Shipment responses include `items`, `statusEvents`, an ordered audit trail of shipment status changes, and `trackingEvents`, an ordered audit trail of carrier/tracking changes. The nested admin order response includes `notificationEvents`.

See [Fulfillment](../architecture/fulfillment.md) for operator workflow, tracking links, and current limitations.

## Error Handling

Zod validation errors return `400`.

Checkout business rule failures return `400`.

Known Prisma uniqueness conflicts return `409`, including duplicate product slugs, category slugs, SKUs, and user emails.

Known invalid foreign key references return `400`.

Missing records return `404` when Prisma reports a known not-found condition or when product detail lookup misses.

Unhandled errors return `500` and are logged by Fastify.
