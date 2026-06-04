# Backend Modules

This doc inventories the backend modules in `apps/backend/src/modules`. Backend architecture and request flow live in [Backend](backend.md). Exact route contracts live in [API](../reference/api.md).

## Auth

Current responsibilities:

- Verify Cognito ID tokens
- Upsert or link local users by Cognito subject and email
- Require Cognito `admin` group membership for backend admin routes
- Return the current account profile
- Update local profile name and phone
- Return the current user's order history

Current routes:

- `GET /me`
- `PATCH /me`
- `GET /me/orders`

Address routes are implemented in the `users` module but require the same current-user auth helper. Checkout also requires the same bearer token and links the created order to the authenticated user.

## Users

Current responsibilities:

- List users
- Create users
- List current user's saved addresses
- Create current user's saved addresses
- Update current user's saved addresses
- Delete current user's saved addresses
- Set default shipping and billing addresses

Current routes:

- `GET /users`
- `POST /users`
- `GET /me/addresses`
- `POST /me/addresses`
- `PATCH /me/addresses/:id`
- `DELETE /me/addresses/:id`

Main service functions:

- `listUsers`
- `createUser`
- `listUserAddresses`
- `createUserAddress`
- `updateUserAddress`
- `deleteUserAddress`

## Catalog

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

Current public routes:

- `GET /products`
- `GET /products/:slug`
- `GET /categories`

Current admin routes:

- `GET /admin/products`
- `POST /admin/products`
- `PATCH /admin/products/:id`
- `POST /admin/products/:id/publish`
- `POST /admin/products/:id/archive`
- `POST /admin/products/:id/categories`
- `DELETE /admin/products/:id/categories/:categoryId`
- `POST /admin/products/:id/images`
- `POST /admin/products/:id/variants`
- `PATCH /admin/variants/:id`
- `PATCH /admin/variants/:id/inventory`
- `POST /admin/categories`

Main service functions:

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

See [Catalog](catalog.md) for behavior details.

## Carts

Current responsibilities:

- Create anonymous carts
- Create or reuse signed-in customer carts
- Adopt or merge an anonymous browser-local cart into a signed-in customer cart
- Enforce cart ownership for user-owned carts
- Get a cart with items and calculated totals
- Add variants to a cart
- Increment existing cart item quantities
- Update cart item quantities
- Reject inactive products and cart quantities above current variant inventory
- Remove cart items
- Clear a cart

Current routes:

- `GET /me/cart`
- `POST /me/cart`
- `POST /carts`
- `GET /carts/:id`
- `POST /carts/:id/items`
- `PATCH /carts/:id/items/:itemId`
- `DELETE /carts/:id/items/:itemId`
- `DELETE /carts/:id/items`

Cart totals are calculated from current variant prices and returned in the response. They are not stored in the database.

Signed-in clients should use `POST /me/cart` at startup. Passing a browser-local `cartId` lets the backend attach that cart to the user or merge its items into the user's existing cart.

## Checkout

Current responsibilities:

- Convert a valid cart into an order
- Validate cart items, product status, currency, and inventory
- Snapshot order items
- Snapshot shipping and billing addresses
- Deduct variant inventory
- Clear the cart after order creation
- Create a Stripe Checkout Session with the order in one customer checkout call
- Reconcile stale Stripe Checkout attempts and release inventory once Stripe reports expiration

Current routes:

- `POST /checkout`
- `POST /checkout/stripe`

Inventory changes and order creation happen in a Prisma transaction.

Stripe reconciliation is run by `npm run orders:expire` or `make orders-expire`. By default it scans open Stripe Checkout attempts older than 15 minutes, retrieves each Checkout Session from Stripe, and only expires/cancels local orders when Stripe reports the session as expired. It sets `inventoryReleasedAt` and increments variant inventory once for each expired order. Configure with `ORDER_EXPIRY_MINUTES` and `ORDER_EXPIRY_BATCH_SIZE`.

AWS dev can run the same command from EventBridge Scheduler through an ECS Fargate one-shot task. Terraform controls that with `deploy_jobs_stack`, `orders_expiry_enabled`, and `orders_expiry_schedule_expression`; it does not require the public backend or frontend services.

## Orders

Current responsibilities:

- Get one order by order number
- List all orders through an admin route
- Mark an order placed through a controlled admin route
- Cancel an order through a controlled admin route
- Create internal admin order notes

Current routes:

- `GET /orders/:orderNumber`
- `GET /admin/orders`
- `POST /admin/orders/:id/place`
- `POST /admin/orders/:id/cancel`
- `POST /admin/orders/:id/notes`

See [Orders](orders.md) for search, timeline, notes, and state-transition behavior.

## Payments

Current responsibilities:

- Create Stripe Checkout Sessions for checkout and unpaid-order recovery
- Record one local payment attempt per Stripe Checkout Session
- Handle Stripe Checkout Session webhook status updates
- Support Checkout Elements from the frontend checkout
- Record provider-agnostic payment attempts
- Mark payments authorized
- Mark payments paid
- Mark payments failed
- Mark payments refunded
- Update the parent order `paymentStatus` when payment state changes

Current routes:

- `POST /orders/:id/stripe-checkout-session` for existing unpaid order recovery
- `POST /admin/orders/:id/payments`
- `POST /admin/payments/:id/authorize`
- `POST /admin/payments/:id/pay`
- `POST /admin/payments/:id/fail`
- `POST /admin/payments/:id/refund`
- `POST /admin/payments/:id/sync-stripe`
- `POST /webhooks/stripe`

Main service functions:

- `createStripeCheckoutSession`
- `handleStripeWebhook`
- `createPayment`
- `markPaymentAuthorized`
- `markPaymentPaid`
- `markPaymentFailed`
- `refundPayment`
- `syncStripePayment`

See [Payments](payments.md) for behavior details.

## Shipments

Current responsibilities:

- Create shipment placeholders
- Assign order item quantities to shipments
- Add or update tracking details
- Mark shipments shipped
- Mark shipments delivered
- Mark shipments returned
- Recalculate the parent order `fulfillmentStatus` when shipment state changes
- Queue a pending delivered notification event when a shipment is delivered

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

See [Fulfillment](fulfillment.md) for behavior details.

## Notifications

Current responsibilities:

- Store notification intent/audit records in `notification_events`
- Create or update delivered-shipment notification events from shipment delivery
- Send pending notification events through SES when `EMAIL_PROVIDER=ses`
- Mark notification events `SENT` or `FAILED`
- Retry pending and failed notification events from a script

Current routes:

- None

Main service functions:

- `sendPendingNotificationEvent`
- `retryNotificationEvents`

Notifications are triggered by backend business events, not direct HTTP requests. Retry is run with `npm run notifications:retry` or `make notifications-retry`.
