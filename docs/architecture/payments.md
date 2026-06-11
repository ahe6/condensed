# Payments

Payments are modeled locally, with Stripe used as the external payment processor. The backend owns the local order and payment state; Stripe webhooks and admin sync keep that state aligned with Stripe.

Last verified against the backend payment routes/services and admin UI on 2026-06-05.

## Local Model

Each order has a top-level `paymentStatus` for quick reads. The `payments` table stores the aggregate payment state for an order. The `payment_attempts` table stores provider-side attempts under a payment.

Current payment statuses:

- `UNPAID`
- `AUTHORIZED`
- `PAID`
- `FAILED`
- `EXPIRED`
- `REFUNDED`
- `DISPUTED`

Stripe payments keep the latest Checkout Session ID in `providerPaymentId` for compatibility. Each Stripe Checkout Session is stored as a `payment_attempts` row with `providerAttemptId=cs_...`, optional `providerPaymentIntentId=pi_...`, attempt status, Stripe expiration time, terminal timestamps, and attempt metadata. Payment metadata stores aggregate Stripe details that are useful for debugging and reconciliation, such as `checkoutSessionId`, `paymentIntentId`, `chargeId`, `stripeStatus`, and dispute fields.

Payment status changes are stored in `payment_status_events`. This table is the audit trail for transitions like:

```text
UNPAID -> PAID -> DISPUTED
UNPAID -> PAID -> REFUNDED
UNPAID -> FAILED
UNPAID -> EXPIRED
```

Each event stores:

- `fromStatus`
- `toStatus`
- `paymentAttemptId` when the transition is tied to a specific attempt
- `source`: `SYSTEM`, `ADMIN_MANUAL`, `ADMIN_SYNC`, or `STRIPE_WEBHOOK`
- `providerEventId`: Stripe webhook event ID when available
- `providerObjectId`: provider object such as Checkout Session, PaymentIntent, Charge, or Dispute ID
- `reason`
- `metadata`
- `createdAt`

Admin payment rows keep the current payment state and actions visible. Stripe rows show structured Stripe details, dashboard links, attempt history, and warning states for cases like missing webhook/sync confirmation, stale open attempts, manual last updates, or payment/order status mismatches. Status history is folded behind a per-payment `History` control and is also summarized in the combined admin order timeline.

## Stripe Checkout

The customer checkout path uses Stripe Checkout Sessions with Checkout Elements.

Flow:

1. The frontend asks the backend for `POST /checkout/stripe`.
2. The backend creates the local order and a card-only Stripe Checkout Session with `ui_mode: "elements"`.
3. The backend stores or reuses a local Stripe payment attempt and returns the order plus Checkout Session client secret.
4. The frontend confirms the session in the browser.
5. Stripe sends webhook events to the backend.
6. The backend updates the local payment and parent order.

`POST /orders/:id/stripe-checkout-session` exists for signed-in payment recovery on an existing `UNPAID` or `FAILED` order. It requires the current local user to own the order and the order reservation deadline to still be active; order history/detail uses it to let customers pay an incomplete order without creating a duplicate order.

The backend sets the order email on the Stripe session and enables phone collection. The frontend passes the shipping phone number when confirming the Checkout Session.

## Webhooks

Local webhook URL:

```text
http://127.0.0.1:3000/webhooks/stripe
```

The normal local startup command refreshes the Stripe CLI webhook signing secret and starts forwarding:

```sh
make local-dev-restart
```

Manual forwarding command:

```sh
stripe listen --forward-to http://127.0.0.1:3000/webhooks/stripe
```

The backend verifies Stripe webhook signatures with `STRIPE_WEBHOOK_SECRET`. For local testing, this secret comes from the Stripe CLI listener. The local dev script writes it to `.env` and `apps/backend/.env` before starting the backend.

Handled Stripe events:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`
- `payment_intent.amount_capturable_updated`
- `charge.dispute.created`
- `charge.dispute.updated`
- `charge.dispute.closed`

New checkout payments are reconciled from Checkout Session and dispute events. PaymentIntent events are still handled for compatibility with older local payment rows and direct PaymentIntent references.

`checkout.session.expired` maps the provider attempt to `EXPIRED`, not `FAILED`. It means the customer did not complete that hosted Checkout Session before it closed. It does not expire/cancel the order while the order reservation is still active. `FAILED` is reserved for actual failed payment attempts such as `checkout.session.async_payment_failed` or `payment_intent.payment_failed`.

Stripe is the source of truth for Checkout Session expiration. Health is the source of truth for order reservation expiration through `orders.reservationExpiresAt`, currently 24 hours after checkout order creation. The local scheduled job reconciles old open attempts by retrieving the Checkout Session from Stripe and also expires overdue order reservations. If Stripe reports a session as expired before the reservation deadline, the order remains payable and `Pay Now` can create another Stripe Checkout Session for the same order. If the order reservation is overdue, the reservation expiration path expires/cancels the local order and releases inventory once through `orders.inventoryReleasedAt`.

## Admin Sync

Admin Stripe payment rows include per-payment `Sync Stripe`. The admin orders toolbar also includes `Sync Stripe`, which syncs all Stripe payments currently in `UNPAID`, `AUTHORIZED`, or `FAILED` local status across the database; it is not limited to the visible order page.

`POST /admin/payments/:id/sync-stripe` retrieves the latest Checkout Session or PaymentIntent from Stripe and updates the local attempt, aggregate payment, and parent order. This is useful when:

- The webhook listener was stopped during local testing.
- A webhook failed signature verification because the secret was stale.
- An admin wants to manually reconcile a suspicious payment.

Sync does not replace webhooks. Webhooks are still the normal source of truth for automatic updates.

When sync changes payment status, it writes a `payment_status_events` row with source `ADMIN_SYNC`.

`POST /admin/payments/sync-stripe` runs the same Stripe read/update logic for all unsettled local Stripe payments and returns sync counts plus any per-payment failures.

## Key Functions

- `createStripeCheckoutSession(orderId, input, options)`: first applies the order reservation expiration guard, then creates or reuses an open Stripe Checkout Session for an `UNPAID` or `FAILED` order, records a local `payment` and `paymentAttempt`, stores Stripe metadata, and records an initial payment status event. It rejects orders in other payment states, expired reservations, orders without items, and customer recovery attempts where the signed-in user does not own the order.
- `handleStripeWebhook(rawBody, signature)`: verifies the Stripe signature against `STRIPE_WEBHOOK_SECRET`, handles Checkout Session, PaymentIntent, and dispute events, and updates local payment/order state through the same internal Stripe update helpers used by sync/reconciliation.
- `syncStripePayment(paymentId)`: admin-triggered Stripe read. It only supports Stripe payments, retrieves either a Checkout Session or PaymentIntent, records a same-status sync event when useful, and updates attempts/payment/order state from Stripe rather than browser state.
- `syncUnsettledStripePayments()`: admin-triggered batch sync for local Stripe payments in `UNPAID`, `AUTHORIZED`, or `FAILED` status. It returns candidate, synced, settled, and failure counts.
- `reconcileStripeCheckoutSessions(options)`: batch job entry point for stale open Stripe Checkout attempts. It retrieves Stripe state and updates attempt/payment/order payment state. Stripe-expired Checkout Sessions close their local attempt; overdue order reservation cleanup is handled separately through the orders module.
- `createPayment(orderId, input)` and manual status functions: admin/manual payment path. They update the payment and aggregate order payment status and record `ADMIN_MANUAL` status events; they do not contact Stripe.

## Disputes

Disputes are represented as `DISPUTED` locally.

Normal production timeline:

```text
UNPAID -> PAID -> DISPUTED
```

In Stripe test mode, this can happen very quickly, so admin may only see the final `DISPUTED` state.

Dispute events update payment metadata with fields such as:

- `disputeId`
- `disputeReason`
- `disputeStatus`
- `disputeAmount`
- `disputeCurrency`
- `chargeId`

If Stripe reports a dispute was won, the backend moves the local status back to `PAID`. Other dispute states stay `DISPUTED`.

Dispute webhook transitions are stored with source `STRIPE_WEBHOOK` and the Stripe event ID in `providerEventId`.

## Refunds

The current admin `Mark Refunded` button is a local/manual status update. It sets the local payment and order to `REFUNDED`, but it does not create a Stripe refund.

Important behavior:

- If a Stripe payment is marked locally as `REFUNDED` and then `Sync Stripe` is pressed, Stripe may move it back to `PAID` because no real Stripe refund exists.
- Real Stripe refunds should be implemented by calling Stripe's Refund API from the backend, then reconciling local state from the Stripe refund result/webhook.

## Test Cards

Use Stripe test mode only.

- Normal successful payment: `4242 4242 4242 4242`
- Dispute/chargeback: `4000 0000 0000 2685`

Common test values:

```text
Expiry: 12/30
CVC: 123
ZIP: 98004
Phone: 2015550123
```

## Smoke Test

Run the automated local Stripe checkout smoke test after Postgres, backend, frontend, and `stripe listen` are running:

```sh
npm run test:stripe-checkout
```

The smoke test restocks `dev-mug`, creates an order, pays with Stripe's successful test card, and polls the backend order API until `paymentStatus` is `PAID`.

## Future Work

- Make admin refunds call Stripe's Refund API.
- Store Stripe webhook deliveries in a local `webhook_events` table.
- Add a richer dispute model or `payment_disputes` table.
- Add automated reconciliation visibility for webhook delivery failures if Stripe webhooks are persisted locally.
