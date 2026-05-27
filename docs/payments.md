# Payments

Payments are modeled locally, with Stripe used as the external payment processor. The backend owns the local order and payment state; Stripe webhooks and admin sync keep that state aligned with Stripe.

## Local Model

Each order has a top-level `paymentStatus` for quick reads. Each payment attempt is stored in `payments`.

Current payment statuses:

- `UNPAID`
- `AUTHORIZED`
- `PAID`
- `FAILED`
- `REFUNDED`
- `DISPUTED`

Stripe payments store the Checkout Session ID in `providerPaymentId`. Payment metadata stores Stripe details that are useful for debugging and reconciliation, such as `checkoutSessionId`, `paymentIntentId`, `chargeId`, `stripeStatus`, and dispute fields.

Payment status changes are stored in `payment_status_events`. This table is the audit trail for transitions like:

```text
UNPAID -> PAID -> DISPUTED
UNPAID -> PAID -> REFUNDED
UNPAID -> FAILED
```

Each event stores:

- `fromStatus`
- `toStatus`
- `source`: `SYSTEM`, `ADMIN_MANUAL`, `ADMIN_SYNC`, or `STRIPE_WEBHOOK`
- `providerEventId`: Stripe webhook event ID when available
- `providerObjectId`: provider object such as Checkout Session, PaymentIntent, Charge, or Dispute ID
- `reason`
- `metadata`
- `createdAt`

Admin payment rows keep the current payment state and actions visible. Status history is folded behind a per-payment `History` control and is also summarized in the combined admin order timeline.

## Stripe Checkout

The customer checkout path uses Stripe Checkout Sessions with Checkout Elements.

Flow:

1. The frontend creates a local order through `POST /checkout`.
2. The frontend asks the backend for `POST /orders/:id/stripe-checkout-session`.
3. The backend creates or reuses a card-only Stripe Checkout Session with `ui_mode: "elements"`.
4. The frontend confirms the session in the browser.
5. Stripe sends webhook events to the backend.
6. The backend updates the local payment and parent order.

The backend sets the order email on the Stripe session and enables phone collection. The frontend passes the shipping phone number when confirming the Checkout Session.

## Webhooks

Local webhook URL:

```text
http://127.0.0.1:3000/webhooks/stripe
```

Local forwarding command:

```sh
stripe listen --forward-to http://127.0.0.1:3000/webhooks/stripe
```

The backend verifies Stripe webhook signatures with `STRIPE_WEBHOOK_SECRET`. For local testing, this secret comes from the Stripe CLI listener and is synced into `apps/backend/.env` with:

```sh
make dev-test-env
```

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

## Admin Sync

Admin Stripe payment rows include `Sync Stripe`.

`POST /admin/payments/:id/sync-stripe` retrieves the Checkout Session or PaymentIntent from Stripe and updates the local payment plus parent order. This is useful when:

- The webhook listener was stopped during local testing.
- A webhook failed signature verification because the secret was stale.
- An admin wants to manually reconcile a suspicious payment.

Sync does not replace webhooks. Webhooks are still the normal source of truth for automatic updates.

When sync changes payment status, it writes a `payment_status_events` row with source `ADMIN_SYNC`.

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

The current admin `Refund` button is a local/manual status update. It sets the local payment and order to `REFUNDED`, but it does not create a Stripe refund.

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
- Show Stripe metadata in a structured admin details panel.
