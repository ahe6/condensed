# Database

The Prisma schema lives at `apps/backend/prisma/schema.prisma`. Prisma migrations in `apps/backend/prisma/migrations` are the source of truth for database changes. Fulfillment workflow behavior lives in [Fulfillment](fulfillment.md).

## Current Scope

The schema covers a practical ecommerce core:

- Identity: users and addresses
- Catalog: products, variants, images, and categories
- Shopping: carts and cart items
- Checkout: orders, order addresses, and order items
- Money movement: payments
- Fulfillment: shipments

## Identity

### `users`

Customer or account identity.

Important fields:

- `externalAuthId`: optional unique external identity ID, currently Cognito `sub`
- `email`: unique login/contact email
- `name`: optional display name
- `phone`: optional contact phone

Related records:

- `addresses`
- `carts`
- `orders`

### `addresses`

Saved user addresses for shipping or billing.

Addresses belong to a user and can be marked as default shipping or default billing addresses. Deleting a user deletes their saved addresses.

## Catalog

### `products`

Product parent record. This is the merchandised item users browse.

Important fields:

- `slug`: unique URL-safe product identifier
- `name`
- `description`
- `status`: `DRAFT`, `ACTIVE`, or `ARCHIVED`

Products have variants, images, and categories.

### `product_variants`

The actual purchasable SKU.

Example: product `T-Shirt`, variants `Black / M`, `Black / L`, `White / M`.

Important fields:

- `sku`: unique inventory identifier
- `title`: variant label
- `price`
- `currency`
- `inventoryQuantity`

Cart items and order items point at variants, not just products.

### `product_images`

Image URLs for product display.

Important fields:

- `url`
- `altText`
- `sortOrder`

### `categories`

Product grouping and navigation taxonomy.

Categories support parent/child nesting through `parentId`.

### `product_categories`

Join table between products and categories.

This lets one product appear in multiple categories.

## Shopping Cart

### `carts`

Mutable shopping cart.

Current carts can belong to a user, but `userId` is nullable so anonymous carts can be supported later.

### `cart_items`

Variant and quantity in a cart.

The pair `cartId + variantId` is unique, so one cart cannot have duplicate rows for the same variant.

## Orders

### `orders`

Checkout result and source record for payment and fulfillment.

Important fields:

- `orderNumber`: unique human-facing order identifier
- `email`: order contact email
- `status`: `PENDING`, `PLACED`, `CANCELLED`, or `REFUNDED`
- `paymentStatus`: `UNPAID`, `AUTHORIZED`, `PAID`, `FAILED`, `REFUNDED`, or `DISPUTED`
- `fulfillmentStatus`: `UNFULFILLED`, `PARTIAL`, `FULFILLED`, or `RETURNED`
- `subtotal`, `discountTotal`, `shippingTotal`, `taxTotal`, `total`
- `placedAt`

Orders can keep `userId` nullable so historical orders survive user deletion.

### `order_addresses`

Snapshot of shipping and billing addresses used for an order.

This intentionally copies address fields instead of linking to `addresses`, because users can edit or delete saved addresses after placing an order.

The pair `orderId + type` is unique, so an order can have one shipping and one billing address.

### `order_items`

Snapshot of purchased line items.

Important fields:

- `productName`
- `variantTitle`
- `sku`
- `unitPrice`
- `quantity`
- `total`

Order items keep nullable links to `products` and `product_variants`, but the copied fields preserve the order history if catalog records change later.

### `order_notes`

Admin-only internal notes attached to an order.

Important fields:

- `orderId`
- `body`
- `authorEmail`
- `createdAt`

Notes are included in admin order responses only. Public order lookup and customer order history do not include internal notes.

Admin order search includes note body and author email.

## Payments

### `payments`

Payment attempts or captures for an order.

Important fields:

- `provider`: payment provider name
- `providerPaymentId`: provider-side payment identifier
- `status`
- `amount`
- `currency`
- `processedAt`
- `metadata`: provider-specific JSON

The pair `provider + providerPaymentId` is unique when a provider payment ID exists.

Current backend payment routes support provider-agnostic manual payments and Stripe Checkout Session records. Stripe payments store the Checkout Session ID in `providerPaymentId` and provider details in `metadata`, including synced `paymentIntentId`, `chargeId`, Stripe status, and dispute fields when available. Marking a payment `AUTHORIZED`, `PAID`, `FAILED`, `REFUNDED`, or `DISPUTED` also updates the parent order `paymentStatus` in the same transaction. Stripe webhooks and the admin Stripe sync action apply the same status updates for Stripe-created payments.

### `payment_status_events`

Append-only history of payment status transitions.

Important fields:

- `paymentId`
- `orderId`
- `fromStatus`
- `toStatus`
- `source`: `SYSTEM`, `ADMIN_MANUAL`, `ADMIN_SYNC`, or `STRIPE_WEBHOOK`
- `providerEventId`: Stripe webhook event ID when available
- `providerObjectId`: provider-side object ID such as a Checkout Session, PaymentIntent, Charge, or Dispute ID
- `reason`
- `metadata`
- `createdAt`

Existing payments were backfilled with one `SYSTEM` event that records their current status at migration time.

## Fulfillment

### `shipments`

Shipment or delivery record for an order.

Important fields:

- `carrier`
- `trackingNumber`
- `status`: `PENDING`, `SHIPPED`, `DELIVERED`, or `RETURNED`
- `shippedAt`
- `deliveredAt`

Shipment records contain package-level carrier and tracking state. The shipped quantities live in `shipment_items`.

Marking a shipment shipped or delivered recalculates the parent order fulfillment status from shipped/delivered shipment item quantities:

- `UNFULFILLED`: no order item quantity is shipped
- `PARTIAL`: some, but not all, order item quantity is shipped
- `FULFILLED`: all order item quantity is shipped
- `RETURNED`: all order item quantity is attached to returned shipments

### `shipment_items`

Line items assigned to a shipment.

Important fields:

- `shipmentId`
- `orderItemId`
- `quantity`

`shipment_items` lets one order split across multiple shipments. Quantity must be positive. A shipment cannot contain the same order item more than once.

Existing shipments were backfilled with every order item on the first shipment for each order, preserving the old order-level shipment behavior for local dev data.

Shipment creation plus shipped/delivered transitions require the parent order payment status to be `PAID` or `AUTHORIZED`. This prevents fulfillment on unpaid, failed, disputed, or refunded orders.

### `shipment_status_events`

Append-only history of shipment status transitions.

Important fields:

- `shipmentId`
- `orderId`
- `fromStatus`
- `toStatus`
- `source`: `SYSTEM` or `ADMIN_MANUAL`
- `reason`
- `metadata`
- `createdAt`

Existing shipments were backfilled with one `SYSTEM` event that records their current status at migration time. New shipment creation and shipment status changes write admin manual events.

### `shipment_tracking_events`

Append-only history of shipment carrier and tracking number changes.

Important fields:

- `shipmentId`
- `orderId`
- `fromCarrier`
- `toCarrier`
- `fromTrackingNumber`
- `toTrackingNumber`
- `source`: `SYSTEM` or `ADMIN_MANUAL`
- `reason`
- `metadata`
- `createdAt`

Existing shipments with carrier or tracking values were backfilled with one `SYSTEM` event that records their current tracking details at migration time. New shipment creation with tracking details and later tracking edits write admin manual events.

## Design Decisions

Products and variants are separate because product pages and purchasable SKUs are different concepts.

Orders snapshot item and address data because historical orders must remain accurate after users edit addresses or admins update products.

Prices use `Decimal(12, 2)` in the database. This is straightforward for USD-style ecommerce, but we may switch to integer minor units later if we need broader currency handling.

Local data is disposable during early development. Prisma migrations recreate the schema, but manually entered records only survive if the Docker Postgres volume remains intact or we add seed data.

## Migration Commands

Apply local migrations:

```sh
npm run db:migrate
```

Regenerate Prisma Client:

```sh
npm run db:generate
```

Check migration status from the backend workspace:

```sh
cd apps/backend
npx prisma migrate status --schema prisma/schema.prisma
```

When AWS dev is recreated, run deployed migrations inside AWS:

```sh
make backend-migrate-aws
```

## Deferred Tables

These are intentionally not in the first schema:

- Discounts and coupons
- Reviews
- Inventory movement ledger
- Return merchandise authorization workflow
- Tax rate engine
- Product option definitions
- Suppliers or vendors
- Wishlists
- Subscriptions

Add these when a feature needs them so we keep the schema shaped by actual workflows.
