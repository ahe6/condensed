# Backend Flows

This doc describes how backend code should be organized and how information should move through the system. Endpoint details live in `docs/backend-api.md`; database table details live in `docs/database-schema.md`.

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
- Create/update products through dev-admin routes
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

## Planned Modules

### Checkout

Purpose: convert a valid cart into an order.

Main service functions:

- `checkoutCart`
- `validateCartForCheckout`
- `createOrderFromCart`
- `snapshotOrderItems`
- `snapshotOrderAddresses`
- `deductInventory`
- `clearCartAfterOrder`

Expected flow:

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

Inventory changes and order creation should happen in a Prisma transaction.

### Orders

Purpose: durable post-checkout records.

Main service functions:

- `listOrders`
- `getOrder`
- `getOrderByNumber`
- `cancelOrder`
- `markOrderPlaced`
- `updatePaymentStatus`
- `updateFulfillmentStatus`

Expected flow:

```text
client requests order by order number
  -> fetch order with addresses, items, payments, and shipments
  -> return order detail
```

Admin order status changes should be explicit service functions, not arbitrary patch objects, so state transitions stay controlled.

### Payments

Purpose: record payment attempts and status changes.

Main service functions:

- `createPayment`
- `markPaymentAuthorized`
- `markPaymentPaid`
- `markPaymentFailed`
- `refundPayment`

Early implementation can be internal and provider-agnostic. Later, Stripe or another provider can call these functions from webhook handlers.

Payment updates should also update the parent order `paymentStatus` when appropriate.

### Shipments

Purpose: track fulfillment and delivery.

Main service functions:

- `createShipment`
- `addTrackingNumber`
- `markShipmentShipped`
- `markShipmentDelivered`
- `markShipmentReturned`

Shipment updates should also update the parent order `fulfillmentStatus` when appropriate.

## Main Business Flows

### Catalog Management

```text
admin creates category
admin creates product as DRAFT or ACTIVE
admin creates variants and images
admin assigns categories
admin publishes product
```

Public product lists should only show `ACTIVE` products. Admin product lists show every status.

### Product Browsing

```text
client lists products
client opens product by slug
client selects variant
client adds variant to cart
```

The frontend should treat variants as purchasable items. Product records are for display and grouping.

### Cart Management

```text
client creates or resumes cart
client adds variant
client updates quantities
backend recalculates totals from current variant prices
```

Cart totals are previews. Order totals become authoritative at checkout.

### Checkout

```text
client submits cart and checkout details
backend validates current catalog/inventory state
backend creates order snapshots
backend reduces inventory
backend returns order
```

Order creation is the boundary where mutable cart data becomes durable purchase data.

### Payment Update

```text
payment provider or dev-admin action updates payment
backend records payment state
backend updates order payment status
```

Do not mark an order paid only from the frontend. Payment state should come from backend-controlled provider confirmation or a dev-admin path.

### Shipment Update

```text
admin creates shipment
admin adds tracking
admin marks shipment shipped or delivered
backend updates order fulfillment status
```

## Design Rules

Admin routes are dev-only until authentication and authorization exist.

Order items snapshot product name, variant title, SKU, unit price, quantity, and total.

Order addresses snapshot shipping and billing fields.

Prices enter the API as decimal strings. This avoids accidental JSON floating point precision issues at the boundary.

Prisma migrations own database shape. Do not manually edit local databases to add schema.

Local database records are disposable during early development unless we add seed scripts or backups.

## Next Implementation Order

Recommended sequence:

1. Add `checkout` module with order creation transaction.
2. Add order read routes.
3. Add simple payment and shipment status routes.
4. Add auth before exposing admin routes outside local development.
