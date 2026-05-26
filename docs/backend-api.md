# Backend API

The backend is a Fastify app in `apps/backend`.

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

`GET /products` returns active products only. `GET /products/:slug` can return any product by slug so a direct product detail URL works during development.

Dev-admin catalog routes:

```text
GET  /admin/products
POST /admin/products
POST /admin/products/:id/variants
POST /admin/categories
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

## Error Handling

Zod validation errors return `400`.

Known Prisma uniqueness conflicts return `409`, including duplicate product slugs, category slugs, SKUs, and user emails.

Unhandled errors return `500` and are logged by Fastify.

## Next Modules

The next backend modules should be:

- `carts`: create carts, add/update/remove cart items, calculate cart totals
- `checkout`: validate cart, create order snapshots, clear cart
- `orders`: read order details and manage order state
- `payments`: record payment attempts and status changes
- `shipments`: add tracking and fulfillment status
