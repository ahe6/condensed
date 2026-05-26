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

## Error Handling

Zod validation errors return `400`.

Known Prisma uniqueness conflicts return `409`, including duplicate product slugs, category slugs, SKUs, and user emails.

Known invalid foreign key references return `400`.

Missing records return `404` when Prisma reports a known not-found condition or when product detail lookup misses.

Unhandled errors return `500` and are logged by Fastify.

## Next Modules

The next backend modules should be:

- `carts`: create carts, add/update/remove cart items, calculate cart totals
- `checkout`: validate cart, create order snapshots, clear cart
- `orders`: read order details and manage order state
- `payments`: record payment attempts and status changes
- `shipments`: add tracking and fulfillment status
