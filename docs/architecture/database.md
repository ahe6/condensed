# Database

The Prisma schema lives at `apps/backend/prisma/schema.prisma`. Prisma migrations in `apps/backend/prisma/migrations` are the source of truth for database changes. Fulfillment workflow behavior lives in [Fulfillment](fulfillment.md).

Last verified against the Prisma schema and migration history on 2026-06-06.

## Current Scope

The schema covers a practical ecommerce core:

- Identity: users and addresses
- Catalog: products, variants, images, and categories
- Shopping: carts and cart items
- Checkout: orders, order addresses, order items, and admin order notes
- Money movement: payments, payment attempts, and payment status events
- Fulfillment: shipments, shipment line items, shipment status events, and shipment tracking events
- Notifications: customer notification event records

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
- `purchaseMode`: `DIRECT` or `ASSESSMENT_REQUIRED`

Products have variants, images, and categories.

`purchaseMode` controls checkout eligibility. `DIRECT` products can be added to carts and checked out. `ASSESSMENT_REQUIRED` products are visible as active care-program entries, but cart and checkout services reject their variants until an assessment/review flow exists.

### `assessment_templates`

Versioned assessment definition for an assessment-required product.

Important fields:

- `productId`
- `slug`
- `title`
- `description`
- `status`: `DRAFT`, `ACTIVE`, or `ARCHIVED`
- `version`

The current public assessment route returns the latest active template for a product.

### `assessment_questions`

Ordered question definitions for an assessment template.

Important fields:

- `templateId`
- `key`: stable answer key within the template
- `label`
- `helpText`
- `type`: `SINGLE_SELECT`, `MULTI_SELECT`, `TEXT`, `NUMBER`, or `BOOLEAN`
- `required`
- `options`: JSON option list for select-style questions
- `sortOrder`

Assessment questions are definitions only. User submissions are not persisted yet.

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

Current carts can belong to a user, but `userId` is nullable so anonymous browser-local carts can be created before sign-in. Signed-in startup can adopt an anonymous cart or merge it into the user's latest cart.

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
- `paymentStatus`: `UNPAID`, `AUTHORIZED`, `PAID`, `FAILED`, `EXPIRED`, `REFUNDED`, or `DISPUTED`
- `fulfillmentStatus`: `UNFULFILLED`, `PARTIAL`, `FULFILLED`, or `RETURNED`
- `subtotal`, `discountTotal`, `shippingTotal`, `taxTotal`, `total`
- `placedAt`
- `inventoryReleasedAt`: set when cancelled unpaid-order inventory has been restored

Orders can keep `userId` nullable so historical orders survive user deletion.

Unpaid expiry and manual cancellation use `inventoryReleasedAt` to make inventory release idempotent. Once it is set, rerunning the expiry job or cancelling again will not add item quantities back a second time.

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

Notes are included in admin order responses only. Customer order detail and customer order history do not include internal notes.

Admin order search includes note body and author email.

## Payments

### `payments`

Aggregate payment records for an order.

Important fields:

- `provider`: payment provider name
- `providerPaymentId`: provider-side payment identifier
- `status`
- `amount`
- `currency`
- `processedAt`
- `metadata`: provider-specific JSON

The pair `provider + providerPaymentId` is unique when a provider payment ID exists.

Current backend payment routes support provider-agnostic manual payments and Stripe Checkout. Stripe Checkout payments keep the latest Checkout Session ID in `providerPaymentId` for compatibility and store provider details in `metadata`, including synced `paymentIntentId`, `chargeId`, Stripe status, and dispute fields when available. Older or direct Stripe PaymentIntent-compatible rows may still use a PaymentIntent ID as `providerPaymentId`.

Payment status transitions update the parent order `paymentStatus` in the same transaction. Stripe webhooks and the admin Stripe sync action apply aggregate updates from Checkout Sessions, compatible PaymentIntent events, and disputes.

### `payment_attempts`

Provider-side attempts under a payment. For Stripe Checkout, each Checkout Session gets one row.

Important fields:

- `paymentId`
- `orderId`
- `provider`
- `providerAttemptId`: provider-side attempt ID, such as a Stripe Checkout Session ID
- `providerPaymentIntentId`: Stripe PaymentIntent ID when available
- `status`: `OPEN`, `COMPLETED`, `EXPIRED`, `FAILED`, or `CANCELED`
- `expiresAt`
- `completedAt`, `expiredAt`, `failedAt`, `canceledAt`
- `metadata`: provider-specific attempt JSON

The pair `provider + providerAttemptId` is unique. The pair `provider + providerPaymentIntentId` is unique when the payment intent ID exists.

Stripe owns Checkout Session expiration. The scheduled job reconciles old open local attempts against Stripe; it does not locally decide that an open Stripe session has expired. An expired or failed attempt only moves the aggregate payment and parent order when no other open or completed attempt remains.

The `payment_attempts` migration backfilled existing Stripe Checkout Session payment rows where `providerPaymentId` started with `cs_`. It also linked existing payment status events to matching attempts when the event `providerObjectId` matched the attempt ID.

### `payment_status_events`

Append-only history of payment status transitions.

Important fields:

- `paymentId`
- `paymentAttemptId`: optional attempt associated with the event
- `orderId`
- `fromStatus`
- `toStatus`
- `source`: `SYSTEM`, `ADMIN_MANUAL`, `ADMIN_SYNC`, or `STRIPE_WEBHOOK`
- `providerEventId`: Stripe webhook event ID when available
- `providerObjectId`: provider-side object ID such as a Checkout Session, PaymentIntent, Charge, or Dispute ID
- `reason`
- `metadata`
- `createdAt`

`providerEventId` is unique when present so the same Stripe webhook event cannot create duplicate status history.

Existing payments were backfilled with one `SYSTEM` event that records their current status at migration time. A later migration linked those backfilled events to payment attempts where possible.

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

Marking a shipment shipped, delivered, or returned recalculates the parent order fulfillment status from shipment item quantities:

- `UNFULFILLED`: no order item quantity is shipped
- `PARTIAL`: some, but not all, order item quantity is shipped
- `FULFILLED`: all order item quantity is shipped
- `RETURNED`: all order item quantity is attached to returned shipments

The calculation treats `SHIPPED` and `DELIVERED` shipments as shipped quantity. It treats `RETURNED` shipments as returned quantity and checks returned quantity first, so a fully returned order reports `RETURNED`.

### `shipment_items`

Line items assigned to a shipment.

Important fields:

- `shipmentId`
- `orderItemId`
- `quantity`

`shipment_items` lets one order split across multiple shipments. Quantity must be positive; this is enforced by a migration-level check constraint. A shipment cannot contain the same order item more than once.

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

## Notifications

### `notification_events`

Email/notification intent records created from business events.

Important fields:

- `orderId`
- `shipmentId`
- `type`: currently `SHIPMENT_DELIVERED`
- `recipientEmail`
- `status`: `PENDING`, `SENT`, `FAILED`, or `SKIPPED`
- `provider`
- `providerMessageId`
- `errorMessage`
- `sentAt`
- `metadata`
- `createdAt`
- `updatedAt`

Marking a shipment delivered creates or updates one `SHIPMENT_DELIVERED` notification event for that shipment. The unique key on `shipmentId + type` prevents duplicate delivered email records when an admin clicks delivered more than once.

Notification events can be sent through SES when email is configured, and failed or pending events can be retried with `npm run notifications:retry`. See [Notifications](notifications.md).

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

Apply already-created migrations without creating a new local migration:

```sh
npm run db:deploy
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

Validate the schema when a database URL is available:

```sh
DATABASE_URL=postgresql://user:password@localhost:5432/health npx prisma validate --schema apps/backend/prisma/schema.prisma
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
