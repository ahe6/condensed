# Backend Modules

This doc inventories the backend modules in `apps/backend/src/modules`. Backend conventions and request flow live in [Backend Conventions](backend-conventions.md). Backend module collaboration lives in [Backend Flows](backend-flows.md). Exact route contracts live in [API](../reference/api.md).

Last verified against backend route and service exports on 2026-06-05.

## Modules

| Module | Owns | Routes | Details |
| --- | --- | --- | --- |
| `auth` | Cognito identity, current user profile, admin checks | `GET /me`, `PATCH /me`, `GET /me/orders` | [Auth](auth.md) |
| `users` | basic users and saved addresses | `GET /users`, `POST /users`, `/me/addresses` routes | [Users](users.md) |
| `catalog` | products, variants, images, categories, inventory edits | `/products`, `/categories`, `/admin/products`, `/admin/variants`, `/admin/categories` | [Catalog](catalog.md) |
| `carts` | anonymous carts, user carts, cart item operations, cart totals | `/carts`, `/carts/:id/items`, `/me/cart` | [Carts](carts.md) |
| `checkout` | cart-to-order conversion and customer Stripe checkout handoff | `POST /checkout`, `POST /checkout/stripe` | [Checkout](checkout.md) |
| `orders` | customer order lookup, admin order search, placement, cancellation, notes | `GET /orders/:orderNumber`, `/admin/orders` routes | [Orders](orders.md) |
| `payments` | local payment state, Stripe Checkout, webhooks, admin payment actions | `/orders/:id/stripe-checkout-session`, `/admin/orders/:id/payments`, `/admin/payments/:id/*`, `POST /webhooks/stripe` | [Payments](payments.md) |
| `shipments` | shipment creation, tracking, shipment state transitions | `/admin/orders/:id/shipments`, `/admin/shipments` routes | [Fulfillment](fulfillment.md) |
| `notifications` | notification event sending and retry | none | [Notifications](notifications.md) |

## Service Functions

This section is an export inventory, not full function-level documentation. Add extra notes only for functions with non-obvious contracts, cross-module side effects, external providers, transactions, or state transitions.

### Auth

- `getOptionalCurrentUser`
- `getCurrentUser`
- `listCurrentUserOrders`
- `updateCurrentUserProfile`
- `requireAdmin`
- `getAdminIdentity`

### Users

- `listUsers`
- `createUser`
- `listUserAddresses`
- `createUserAddress`
- `updateUserAddress`
- `deleteUserAddress`

### Catalog

- `listProducts`
- `listAdminProducts`
- `getProductBySlug`
- `listCategories`
- `createCategory`
- `createProduct`
- `updateProduct`
- `setProductStatus`
- `assignProductCategory`
- `removeProductCategory`
- `addProductImage`
- `createProductVariant`
- `updateProductVariant`
- `setVariantInventory`

### Carts

- `createCart`
- `getOrCreateUserCart`
- `getCart`
- `addCartItem`
- `updateCartItemQuantity`
- `removeCartItem`
- `clearCart`

### Checkout

- `checkoutCart`

`POST /checkout/stripe` also calls `createStripeCheckoutSession` from the `payments` module after the order is created.

### Orders

- `getOrderByNumber`
- `getOrderByNumberForUser`
- `listOrders`
- `createOrderNote`
- `cancelOrder`
- `cancelUnpaidOrderAndReleaseInventory`
- `markOrderPlaced`
- `updatePaymentStatus`
- `updateFulfillmentStatus`
- `expireUnpaidOrders`

### Payments

- `createStripeCheckoutSession`
- `reconcileStripeCheckoutSessions`
- `handleStripeWebhook`
- `createPayment`
- `markPaymentAuthorized`
- `markPaymentPaid`
- `markPaymentFailed`
- `refundPayment`
- `syncStripePayment`

### Shipments

- `createShipment`
- `addTrackingNumber`
- `markShipmentShipped`
- `markShipmentDelivered`
- `markShipmentReturned`

### Notifications

- `sendPendingNotificationEvent`
- `retryNotificationEvents`

## Key Function Notes

### Auth

- `getCurrentUser(authorization)`: verifies a Cognito ID token, links the token subject to a local user, and can attach an existing local user by matching email. It rejects emails already linked to another Cognito subject.
- `getOptionalCurrentUser(authorization)`: returns `null` without a header but otherwise behaves like `getCurrentUser`; callers should only use it where anonymous access is valid.
- `requireAdmin(authorization)` / `getAdminIdentity(authorization)`: verifies the Cognito ID token and requires the `admin` group. `server.ts` runs this guard for every `/admin/*` route.

### Users

- `createUserAddress(userId, input)`: creates an address in a transaction and automatically makes the first address the default shipping and billing address unless the input overrides that behavior.
- `updateUserAddress(userId, addressId, input)`: first proves the address belongs to the user, then clears any previous default shipping or billing address when the update makes this address default.
- `deleteUserAddress(userId, addressId)`: first proves ownership, then deletes the address. It does not currently promote a replacement default address.

### Catalog

- `listProducts()` / `getProductBySlug(slug)`: public catalog reads only return `ACTIVE` products.
- `listAdminProducts()`: admin catalog reads include draft, active, and archived products.
- `setProductStatus(productId, status)`: controls public visibility through product status. It does not change cart contents or already-created orders.
- `setVariantInventory(variantId, input)`: directly sets inventory for a variant. Checkout still performs transactional stock decrement checks before creating orders.

### Carts

- `getOrCreateUserCart(userId, input)`: loads the latest user cart, creates one when needed, or adopts/merges the provided browser-local cart ID into the signed-in user's cart.
- `addCartItem(cartId, input, actorUserId)` / `updateCartItemQuantity(...)`: enforce cart ownership when the cart has a user, require the product to be active, and reject quantities above current inventory.
- `clearCart(cartId, actorUserId)`: deletes cart items only after the same cart access check used by item operations.
- `adoptCartForUser(userId, cartId)`: private helper that validates source cart access, validates merged quantities against current inventory, merges duplicate variants into the user's existing cart when present, and deletes the source cart after a successful merge.

### Checkout

- `checkoutCart(input, options)`: single transaction that validates cart ownership, rejects empty carts, rejects inactive products and mixed currencies, decrements inventory with `updateMany` guards, creates the placed order and addresses/items, then clears the cart. This is the inventory reservation point for customer checkout.
- `POST /checkout/stripe`: route-level flow that calls `checkoutCart` first, then calls `createStripeCheckoutSession` from the payments module for the newly created order. If Stripe session creation fails after the order transaction commits, the order exists with reserved inventory and needs normal unpaid-order reconciliation/cancellation handling.

### Orders

- `listOrders(query)`: admin-only SQL-backed search/filter/sort/page query. The raw SQL returns IDs first, then Prisma loads full order relations with `adminOrderInclude`.
- `cancelOrder(orderId)`: retrieves live Stripe Checkout Sessions before the DB transaction; it refuses to cancel if Stripe says a session is complete/paid. Inside the transaction it cancels the order and releases inventory only for unfulfilled unpaid/failed/expired orders that have not already released inventory.
- `cancelUnpaidOrderAndReleaseInventory(orderId, releasedAt)`: idempotent unpaid-order cancellation path used by payment reconciliation and expiry jobs. It only affects unfulfilled pending/placed unpaid/failed/expired orders with `inventoryReleasedAt = null`.
- `expireUnpaidOrders(options)`: batch job entry point that finds old unpaid orders, checks/optionally expires open Stripe Checkout Sessions, and releases inventory only when Stripe does not report a completed payment.
- `markOrderPlaced(orderId)`, `updatePaymentStatus(orderId, paymentStatus)`, and `updateFulfillmentStatus(orderId, fulfillmentStatus)`: low-level state writers. Prefer higher-level payment and shipment functions when an action should also create audit events or recalculate aggregate status.

### Payments

- `createStripeCheckoutSession(orderId, input)`: creates or reuses an open Stripe Checkout Session for an unpaid order, records a local `payment` and `paymentAttempt`, stores Stripe metadata, and records an initial payment status event. It rejects already-paid/refunded orders and orders without items.
- `handleStripeWebhook(rawBody, signature)`: verifies the Stripe signature against `STRIPE_WEBHOOK_SECRET`, handles Checkout Session, PaymentIntent, and dispute events, and updates local payment/order state through the same internal Stripe update helpers used by sync/reconciliation.
- `syncStripePayment(paymentId)`: admin-triggered Stripe read. It only supports Stripe payments, retrieves either a Checkout Session or PaymentIntent, records a same-status sync event when useful, and updates attempts/payment/order state from Stripe rather than browser state.
- `reconcileStripeCheckoutSessions(options)`: batch job entry point for stale open Stripe Checkout attempts. It retrieves Stripe state, updates attempts/payment/order status, and cancels/releases inventory for expired attempts through the orders module.
- `createPayment(orderId, input)` and manual status functions: admin/manual payment path. They update the payment and aggregate order payment status and record `ADMIN_MANUAL` status events; they do not contact Stripe.

### Shipments

- `createShipment(orderId, input)`: transactionally validates payment status, allocates only remaining unfulfilled order-item quantities, creates shipment line items, and records initial shipment status/tracking events.
- `addTrackingNumber(shipmentId, input)`: updates carrier/tracking fields and records a tracking event only when tracking values exist and changed.
- `markShipmentShipped(shipmentId)`, `markShipmentDelivered(shipmentId)`, and `markShipmentReturned(shipmentId)`: transition shipment status, recalculate order fulfillment status from all non-returned shipments, and record shipment status events. Non-returned transitions require paid or authorized payment status.
- `markShipmentDelivered(shipmentId)`: additionally upserts a `SHIPMENT_DELIVERED` notification event inside the shipment transaction, then sends it after commit through `sendPendingNotificationEvent`.
- `resolveShipmentItems(order, requestedItems)`: private allocation guard that defaults to all remaining quantities when no item list is provided, merges duplicate requested rows, rejects items from other orders, and rejects over-allocation.

### Notifications

- `sendPendingNotificationEvent(notificationEventId)`: sends only `PENDING` events. It skips without DB mutation when email is disabled, fails when SES is configured but `EMAIL_FROM` is missing, skips unsupported event types, and marks SES success/failure on the notification record.
- `retryNotificationEvents(options)`: batch job entry point for `PENDING` and `FAILED` notifications. It resets failed events to pending before calling `sendPendingNotificationEvent`.
