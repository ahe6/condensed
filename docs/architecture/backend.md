# Backend

This doc describes how backend code should be organized and how backend requests move through the system. Module inventory lives in [Backend Modules](backend-modules.md). User/address behavior lives in [Users](users.md). Cart behavior lives in [Carts](carts.md). Checkout behavior lives in [Checkout](checkout.md). Catalog behavior lives in [Catalog](catalog.md). Order/admin-order behavior lives in [Orders](orders.md). Endpoint contracts live in [API](../reference/api.md), ecommerce process context lives in [Flows](../reference/flows.md), and database table details live in [Database](database.md).

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

Each route-backed module should use this shape:

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

Route-backed modules should keep all three files even when the module is small. `notifications` is service-only because notifications are created from business events and retried from a script instead of exposed through public routes.

Avoid adding a repository layer until there is a real repeated data-access pattern to extract.

## Server-Level Flow

`apps/backend/src/server.ts` owns process-level behavior:

- registers CORS
- preserves the raw JSON body for `POST /webhooks/stripe`
- maps known Zod, domain, and Prisma errors to HTTP responses
- exposes `GET /health` for lightweight process health
- exposes `GET /ready` for database readiness
- registers all backend modules

The `/ready` endpoint checks database availability with Prisma. The `/health` endpoint only confirms the process is responding.

## Admin Flow

Admin routes are spread across the owning business modules instead of a separate `admin` module:

- Catalog admin routes live in `catalog`.
- Order admin routes live in `orders`.
- Payment admin routes live in `payments`.
- Shipment admin routes live in `shipments`.

All `/admin/*` routes pass through the global Fastify pre-handler in `server.ts`. That hook requires a Cognito ID token whose user belongs to the `admin` group before the module route handler runs.

This keeps admin behavior near the service code that owns the state transition. Exact request and response shapes belong in [API](../reference/api.md).

## Transaction Flow

Any state change that updates multiple records should happen in one Prisma transaction. Current examples:

- checkout creates an order, snapshots items/addresses, deducts inventory, and clears the cart
- payment status changes update the payment and parent order together
- shipment status changes update the shipment and parent order fulfillment status together
- delivered shipments create or update the delivered notification event before the transaction returns

Services should expose explicit state-transition functions such as `markPaymentPaid`, `markShipmentDelivered`, or `cancelOrder`. Avoid accepting arbitrary patch objects for business states like payment, fulfillment, or order status.

## External Event Flow

Stripe webhooks enter through `POST /webhooks/stripe`. The server keeps the raw body for signature verification, then the payments service updates local payment attempts, aggregate payment state, payment history, and parent order status.

Scheduled jobs should call service functions instead of reimplementing business rules. Current examples:

- `orders:expire` reconciles old open Stripe Checkout attempts against Stripe and releases inventory only when Stripe reports expiration
- `notifications:retry` retries pending or failed notification events through the notification service

## Related Docs

- [Backend Modules](backend-modules.md): module ownership, route inventory, and main service functions.
- [Users](users.md): user records, saved addresses, and default address behavior.
- [Carts](carts.md): anonymous/user carts, cart ownership, item operations, and totals.
- [Checkout](checkout.md): cart-to-order conversion, inventory decrement, and Stripe checkout handoff.
- [Catalog](catalog.md): public catalog and admin product/category/variant/image/inventory behavior.
- [Orders](orders.md): customer order lookup, admin search, order notes, cancellation, and timeline behavior.
- [Payments](payments.md): Stripe Checkout, webhooks, admin sync, disputes, and refunds.
- [Fulfillment](fulfillment.md): shipments, tracking, fulfillment guardrails, and tracking links.
- [Notifications](notifications.md): notification events, SES sending, and retry behavior.
