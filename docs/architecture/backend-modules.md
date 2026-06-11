# Backend Modules

This doc inventories the backend modules in `apps/backend/src/modules`. Backend conventions and request flow live in [Backend Conventions](backend-conventions.md). Backend module collaboration lives in [Backend Flows](backend-flows.md). Exact route contracts live in [API](../reference/api.md).

Last verified against backend route and service exports on 2026-06-07.

## Modules

| Module | Owns | Routes | Details |
| --- | --- | --- | --- |
| `auth` | Cognito identity, current user profile, admin checks | `GET /me`, `PATCH /me`, `GET /me/orders` | [Auth](auth.md) |
| `users` | admin user listing/creation and saved addresses | `GET /admin/users`, `POST /admin/users`, `/me/addresses` routes | [Users](users.md) |
| `catalog` | products, variants, images, categories, inventory edits | `/products`, `/categories`, `/admin/products`, `/admin/variants`, `/admin/categories` | [Catalog](catalog.md) |
| `assessments` | assessment templates, questions, submissions, answers, and recommendations for care-program and goal intake | `GET /products/:slug/assessment`, `POST /products/:slug/assessment/submissions`, `GET /goals/:goalKey/assessment`, `POST /goals/:goalKey/assessment/submissions`, `GET /admin/assessment-submissions` | [Assessments](assessments.md) |
| `checkout-authorizations` | short-lived assessment approval records used by carts and checkout | none | [Assessments](assessments.md), [Checkout](checkout.md) |
| `carts` | anonymous carts, user carts, cart item operations, cart totals | `/carts`, `/carts/:id/items`, `/me/cart` | [Carts](carts.md) |
| `checkout` | cart-to-order conversion and customer Stripe checkout handoff | `POST /checkout`, `POST /checkout/stripe` | [Checkout](checkout.md) |
| `orders` | customer order lookup, admin order search, placement, cancellation, notes | `GET /orders/:orderNumber`, `/admin/orders` routes | [Orders](orders.md) |
| `payments` | local payment state, Stripe Checkout, webhooks, admin payment actions | `/orders/:id/stripe-checkout-session`, `/admin/orders/:id/payments`, `/admin/payments/:id/*`, `POST /webhooks/stripe` | [Payments](payments.md) |
| `shipments` | shipment creation, tracking, shipment state transitions | `/admin/orders/:id/shipments`, `/admin/shipments` routes | [Fulfillment](fulfillment.md) |
| `notifications` | notification event sending and retry | none | [Notifications](notifications.md) |

## Service Functions

This section is an export inventory, not full function-level documentation. Key function notes live in the individual module docs:

- [Auth](auth.md#key-functions)
- [Users](users.md#key-functions)
- [Catalog](catalog.md#key-functions)
- [Assessments](assessments.md#key-functions)
- [Carts](carts.md#key-functions)
- [Checkout](checkout.md#key-functions)
- [Orders](orders.md#key-functions)
- [Payments](payments.md#key-functions)
- [Fulfillment](fulfillment.md#key-functions)
- [Notifications](notifications.md#key-functions)

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

### Assessments

- `getActiveAssessmentForProductSlug`
- `getActiveAssessmentForGoalKey`
- `submitAssessmentForProductSlug`
- `submitAssessmentForGoalKey`
- `listAdminAssessmentSubmissions`

### Checkout Authorizations

- `createCheckoutAuthorization`
- `findActiveCheckoutAuthorization`
- `hasActiveCheckoutAuthorization`
- `markCheckoutAuthorizationUsed`

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

### Payments

- `createStripeCheckoutSession`
- `reconcileStripeCheckoutSessions`
- `handleStripeWebhook`
- `createPayment`
- `markPaymentAuthorized`
- `markPaymentPaid`
- `markPaymentFailed`
- `markPaymentRefunded`
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
