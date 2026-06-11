# Backend Flows

This doc maps how backend modules cooperate across major application flows. Product and business-level flow descriptions live in [Flows](../reference/flows.md). Implementation conventions live in [Backend Conventions](backend-conventions.md), module inventory lives in [Backend Modules](backend-modules.md), and exact route contracts live in [API](../reference/api.md).

Last verified against backend routes and services on 2026-06-07.

## Auth, Users, And Addresses

Modules:

- `auth`
- `users`

Flow:

```text
Cognito ID token
  -> auth verifies token and links/upserts local user
  -> users reads or mutates saved addresses for current local user
```

The `auth` module owns Cognito token verification, local user linking, current profile, current user orders, and admin identity checks. The `users` module owns saved addresses and default shipping/billing behavior.

Read:

- [Auth](auth.md)
- [Users](users.md)
- [Database](database.md)

## Goal Intake To Recommendation

Modules:

- `assessments`
- `catalog`

Flow:

```text
customer starts from a goal key
  -> assessments exposes active goal-intake questions
  -> auth verifies the customer before submit
  -> assessments saves submitted answers
  -> recommendation policy creates ranked product recommendations
  -> client can route the customer into a recommended product intake
```

Goal intake is discovery, not approval. The `assessments` module owns goal templates, goal submissions, and recommendation rows. The `catalog` module owns the products referenced by recommendations.

Read:

- [Assessments](assessments.md)
- [Catalog](catalog.md)

## Product Intake To Cart

Modules:

- `catalog`
- `assessments`
- `checkout-authorizations`
- `carts`

Flow:

```text
catalog exposes active products and variants
  -> assessments exposes active intake questions for assessment-required products
  -> auth verifies the customer before assessment submit
  -> assessments persists submitted intake answers and policy decision for that user
  -> approved submissions create checkout authorization
  -> client adds selected variant to cart
  -> carts validates product status, purchase mode, checkout authorization, and inventory
  -> carts returns live totals from current variant prices
```

The `catalog` module owns product, category, variant, image, purchase mode, and inventory records. The `assessments` module owns intake templates, questions, submissions, answers, recommendations, and the first product-intake policy decision. The `checkout-authorizations` module owns short-lived approval records. The `carts` module owns mutable cart rows and rejects inactive, unauthorized assessment-required, or over-inventory variants.

Read:

- [Catalog](catalog.md)
- [Assessments](assessments.md)
- [Carts](carts.md)

## Cart To Checkout To Order

Modules:

- `carts`
- `checkout`
- `orders`
- `payments`

Flow:

```text
cart contains selected variants
  -> checkout validates cart, checkout authorizations, and inventory in a transaction
  -> checkout decrements inventory
  -> checkout snapshots order addresses and items
  -> checkout clears cart
  -> checkout marks used checkout authorizations
  -> checkout optionally asks payments to create Stripe Checkout Session
```

The `checkout` module owns the mutable-cart to durable-order boundary. `orders` owns later lookup, cancellation, and expiry inventory release. `payments` owns Stripe Checkout Session creation and payment reconciliation.

Read:

- [Carts](carts.md)
- [Checkout](checkout.md)
- [Orders](orders.md)
- [Payments](payments.md)

## Payment Reconciliation

Modules:

- `payments`
- `orders`

Flow:

```text
Stripe webhook or admin sync enters payments
  -> payments updates attempt and aggregate payment state
  -> payments writes payment status event
  -> payments updates parent order paymentStatus
```

Stripe Checkout Session expiration is owned by Stripe. The scheduled reconciliation path retrieves old open Checkout Sessions from Stripe, updates local attempt/payment/order state, and releases inventory only when Stripe reports expiration.

Read:

- [Payments](payments.md)
- [Orders](orders.md)

## Admin Order Management

Modules:

- `orders`
- `payments`
- `shipments`
- `notifications`

Flow:

```text
admin opens order list/detail
  -> orders returns admin order envelope with notes, payments, shipments, notifications
  -> admin payment actions call payments
  -> admin shipment actions call shipments
  -> delivered shipment queues notification event
```

Admin order timelines are assembled from order state, notes, payment events, shipment events, tracking events, and notification events. Admin state changes use explicit service functions instead of arbitrary patch objects.

Read:

- [Admin](admin.md)
- [Orders](orders.md)
- [Payments](payments.md)
- [Fulfillment](fulfillment.md)
- [Notifications](notifications.md)

## Fulfillment To Notification

Modules:

- `shipments`
- `notifications`

Flow:

```text
admin marks shipment delivered
  -> shipments updates shipment and order fulfillment state
  -> shipments creates or updates delivered notification event
  -> notifications sends through SES when configured
```

Shipment delivery notification records are idempotent per shipment and notification type. If email is not configured, the event remains pending and can be retried later.

Read:

- [Fulfillment](fulfillment.md)
- [Notifications](notifications.md)
