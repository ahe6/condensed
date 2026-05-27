# Backend Architecture

This doc describes how backend code should be organized. Endpoint details live in [Backend API](backend-api.md), ecommerce process details live in [Ecommerce Flows](ecommerce-flows.md), and database table details live in [Database Schema](database-schema.md).

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
- Return the current user's order history

Current routes:

- `GET /me`
- `GET /me/orders`

Checkout accepts the same bearer token and links the created order to the authenticated user when one is present.

Backend `/admin/*` routes are protected by a global Fastify pre-handler in `server.ts`.

### Users

Current responsibilities:

- List users
- Create users

Current routes:

- `GET /users`
- `POST /users`

Likely next user responsibilities:

- Get one user
- Update user profile fields
- Add/list/update addresses
- Set default shipping and billing addresses

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

- Create anonymous or user-owned carts
- Get a cart with items and calculated totals
- Add variants to a cart
- Increment existing cart item quantities
- Update cart item quantities
- Remove cart items
- Clear a cart

Current routes:

- `POST /carts`
- `GET /carts/:id`
- `POST /carts/:id/items`
- `PATCH /carts/:id/items/:itemId`
- `DELETE /carts/:id/items/:itemId`
- `DELETE /carts/:id/items`

Cart totals are calculated from current variant prices and returned in the response. They are not stored in the database.

### Checkout

Current responsibilities:

- Convert a valid cart into an order
- Validate cart items, product status, currency, and inventory
- Snapshot order items
- Snapshot shipping and billing addresses
- Deduct variant inventory
- Clear the cart after order creation

Current routes:

- `POST /checkout`

Inventory changes and order creation happen in a Prisma transaction.

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

Admin order status changes should be explicit service functions, not arbitrary patch objects, so state transitions stay controlled.

### Payments

Current responsibilities:

- Record provider-agnostic payment attempts
- Mark payments authorized
- Mark payments paid
- Mark payments failed
- Mark payments refunded
- Update the parent order `paymentStatus` when payment state changes

Current routes:

- `POST /admin/orders/:id/payments`
- `POST /admin/payments/:id/authorize`
- `POST /admin/payments/:id/pay`
- `POST /admin/payments/:id/fail`
- `POST /admin/payments/:id/refund`

Main service functions:

- `createPayment`
- `markPaymentAuthorized`
- `markPaymentPaid`
- `markPaymentFailed`
- `refundPayment`

Payment status changes happen in a Prisma transaction with the parent order update. Early implementation is internal and provider-agnostic. Later, Stripe or another provider can call these functions from webhook handlers.

### Shipments

Current responsibilities:

- Create shipment placeholders
- Add or update tracking details
- Mark shipments shipped
- Mark shipments delivered
- Mark shipments returned
- Update the parent order `fulfillmentStatus` when shipment state changes

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

Shipment status changes happen in a Prisma transaction with the parent order update.
