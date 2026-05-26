# Backend API

The backend is a Fastify app in `apps/backend`.

Backend module conventions and business flows live in `docs/backend-flows.md`.

## Structure

Routes are organized by module:

```text
apps/backend/src/modules/
  users/
    users.routes.ts
    users.schemas.ts
    users.service.ts
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

## Catalog

Public catalog routes:

```text
GET /products
GET /products/:slug
GET /categories
```

`GET /products` returns active products only, newest first.

Product responses include:

- `variants`
- `images`
- `categories` with nested `category`

`GET /products/:slug` can return any product by slug so a direct product detail URL works during development.

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

These routes are intentionally unauthenticated for local development. Add auth before exposing them publicly.

`POST /admin/products` accepts:

```json
{
  "slug": "dev-mug",
  "name": "Dev Mug",
  "description": "A mug for local testing",
  "status": "ACTIVE",
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

`slug` must be lowercase URL-safe text. Prices are accepted as decimal strings with up to two cents.

`GET /admin/products` returns all products, including drafts and archived products.

`PATCH /admin/products/:id` accepts any subset of:

```json
{
  "slug": "updated-dev-mug",
  "name": "Updated Dev Mug",
  "description": "Updated description",
  "status": "ACTIVE"
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
POST   /carts
GET    /carts/:id
POST   /carts/:id/items
PATCH  /carts/:id/items/:itemId
DELETE /carts/:id/items/:itemId
DELETE /carts/:id/items
```

`POST /carts` accepts an optional user ID:

```json
{
  "userId": "00000000-0000-0000-0000-000000000000"
}
```

Send `{}` for an anonymous cart.

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

Quantity must be positive. Use `DELETE /carts/:id/items/:itemId` to remove an item.

`DELETE /carts/:id/items` clears all items from the cart.

## Checkout

```text
POST /checkout
```

`POST /checkout` converts a cart into an order in a database transaction.

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

## Orders

```text
GET  /orders/:orderNumber
GET  /admin/orders
POST /admin/orders/:id/place
POST /admin/orders/:id/cancel
```

`GET /orders/:orderNumber` returns one order by its human-facing order number.

`GET /admin/orders` returns all orders newest first.

`POST /admin/orders/:id/place` marks an order as `PLACED` and sets `placedAt`.

`POST /admin/orders/:id/cancel` marks an order as `CANCELLED`.

Order status changes use explicit routes so callers cannot arbitrarily patch order state.

## Payments

```text
POST /admin/orders/:id/payments
POST /admin/payments/:id/authorize
POST /admin/payments/:id/pay
POST /admin/payments/:id/fail
POST /admin/payments/:id/refund
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
  "trackingNumber": "1Z9999999999999999"
}
```

Both fields are optional when creating a shipment, because fulfillment may be staged before a label exists.

`PATCH /admin/shipments/:id/tracking` accepts at least one tracking field:

```json
{
  "carrier": "UPS",
  "trackingNumber": "1Z9999999999999999"
}
```

Shipment status routes update the shipment and the parent order `fulfillmentStatus` in one transaction:

- `ship` sets shipment status to `SHIPPED`, sets `shippedAt`, and marks the order `FULFILLED`
- `deliver` sets shipment status to `DELIVERED`, sets `deliveredAt`, and keeps the order `FULFILLED`
- `return` sets shipment status to `RETURNED` and marks the order `RETURNED`

## Error Handling

Zod validation errors return `400`.

Checkout business rule failures return `400`.

Known Prisma uniqueness conflicts return `409`, including duplicate product slugs, category slugs, SKUs, and user emails.

Known invalid foreign key references return `400`.

Missing records return `404` when Prisma reports a known not-found condition or when product detail lookup misses.

Unhandled errors return `500` and are logged by Fastify.
