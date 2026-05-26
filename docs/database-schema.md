# Database Schema

The Prisma schema lives at `apps/backend/prisma/schema.prisma`. Prisma migrations in `apps/backend/prisma/migrations` are the source of truth for database changes.

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
- `paymentStatus`: `UNPAID`, `AUTHORIZED`, `PAID`, `FAILED`, or `REFUNDED`
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

Current backend payment routes are provider-agnostic. Marking a payment `AUTHORIZED`, `PAID`, `FAILED`, or `REFUNDED` also updates the parent order `paymentStatus` in the same transaction.

## Fulfillment

### `shipments`

Shipment or delivery record for an order.

Important fields:

- `carrier`
- `trackingNumber`
- `status`: `PENDING`, `SHIPPED`, `DELIVERED`, or `RETURNED`
- `shippedAt`
- `deliveredAt`

Current shipment records are order-level, not line-item-level. Marking a shipment shipped or delivered marks the parent order `FULFILLED`; marking a shipment returned marks the parent order `RETURNED`. Add shipment line items before using `PARTIAL` fulfillment for split shipments.

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
