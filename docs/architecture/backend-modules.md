# Backend Modules

This doc inventories the backend modules in `apps/backend/src/modules`. Backend architecture and request flow live in [Backend](backend.md). Exact route contracts live in [API](../reference/api.md).

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
