# Frontend

The frontend is a single Next.js app in `apps/frontend`. It serves both the public shop and the admin order tools.

## App Structure

Important files:

- `app/page.tsx`: public shop, cart, checkout, order lookup, and customer order history
- `app/admin/page.tsx`: admin order search, notes, payments, fulfillment, and order timeline
- `app/auth/callback/page.tsx`: Cognito hosted UI callback
- `app/auth/confirm/page.tsx`: Cognito confirmation helper route
- `app/globals.css`: shared styling for shop and admin
- `src/lib/api.ts`: typed API client and response shapes
- `src/lib/auth.ts`: Cognito PKCE login, session storage, sign-out, and confirmation helpers
- `src/lib/format.ts`: money, date, status, button, and tracking-link formatting
- `src/components/OrderSummary.tsx`: reusable customer-facing order summary

The app currently keeps shop and admin in one Next app. The public shop does not link to `/admin`; admins open that route directly.

## Environment

Frontend env is read from `apps/frontend/.env.local`.

Important variables:

```text
NEXT_PUBLIC_API_URL=http://127.0.0.1:3000
NEXT_PUBLIC_COGNITO_DOMAIN=
NEXT_PUBLIC_COGNITO_CLIENT_ID=
NEXT_PUBLIC_COGNITO_REGION=us-east-2
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

`NEXT_PUBLIC_API_URL` points browser requests at the Fastify backend. Cognito variables enable hosted UI login. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` enables Stripe Checkout Elements.

## API Client

`src/lib/api.ts` wraps `fetch`.

Current behavior:

- Adds `content-type: application/json` when a body exists.
- Adds `Authorization: Bearer <id token>` when a Cognito session exists.
- Throws an `Error` with backend response text when a request is not OK.
- Exposes typed helpers for products, carts, checkout, orders, payments, shipments, notes, and admin order query.

Admin order query is server-side. The frontend sends search/filter/sort/page params to `GET /admin/orders`; the backend returns a paged envelope with `orders`, `total`, `page`, `pageSize`, and `pageCount`.

## Auth

`src/lib/auth.ts` implements Cognito hosted UI login with PKCE.

Session behavior:

- Stores the ID token, access token, optional refresh token, and expiry in `localStorage` under `tele.auth`.
- Stores PKCE verifier and state in `sessionStorage` during login.
- Clears expired sessions on read.
- Uses the ID token for backend identity and admin authorization.

Admin access requires the signed-in Cognito user to be in the `admin` group. See [Auth](auth.md).

## Public Shop

`app/page.tsx` owns the current public shopping flow:

- Checks backend readiness with `GET /ready`.
- Lists active products from `GET /products`.
- Stores the active cart ID in browser local storage under `tele.cartId`.
- Creates, resumes, updates, clears, and removes cart items through cart API routes.
- Collects checkout email, shipping address, and billing address.
- Creates a local order with `POST /checkout`.
- Creates a Stripe Checkout Session with `POST /orders/:id/stripe-checkout-session`.
- Renders Stripe Checkout Elements through `CheckoutElementsProvider` and `PaymentElement`.
- Confirms checkout in the browser.
- Shows order lookup by order number.
- Shows signed-in customer order history with `GET /me/orders`.

Payment state should not be trusted from the browser alone. Stripe webhooks or admin sync update the backend payment/order state.

## Admin

`app/admin/page.tsx` is a single-page admin order workspace.

Main admin capabilities:

- Search/filter/sort/page admin orders through SQL-backed `GET /admin/orders`.
- Search across order fields, customer names, line items, SKUs, statuses, note bodies, and note authors.
- Filter by payment status, fulfillment status, event date range, and page size.
- Sort by created, edited, placed, shipped, delivered, or total.
- Expand one order row inline.
- Add internal admin-only notes.
- Show a combined order timeline.
- Create manual payments and mark payments authorized, paid, failed, or refunded.
- Sync Stripe payment status for Stripe payments.
- Create shipments, save carrier/tracking edits, and mark shipments shipped, delivered, or returned.
- Open public carrier tracking links for UPS, USPS, FedEx, and DHL.

The expanded order row is the main work surface. It includes:

- Order timestamps, customer, line items, and shipment summary
- Timeline built from order events, notes, payment events, shipment events, and tracking changes
- Notes composer and note list
- Payments and payment actions
- Fulfillment and shipment actions

Detailed payment and shipment audit history is folded behind per-record `History` buttons so the current operational controls stay visible.

See [Fulfillment](fulfillment.md) for shipment guardrails and tracking-link behavior.

## Styling

Shared CSS lives in `app/globals.css`.

Current UI conventions:

- Panels use restrained borders and compact spacing.
- Admin order rows are clickable and expand inline.
- Status values use pill styling from `statusClass`.
- Payment and shipment action buttons use `actionButtonClass`.
- Tracking URLs are derived in `trackingUrl`; the app does not call carrier APIs.
- Layouts should remain responsive through grid tracks and wrapping controls.

Keep admin screens dense and operational. Avoid marketing-style page structure in the admin app.

## Checks

Useful frontend commands:

```sh
npm run frontend:check
npm run frontend:build
npm run frontend:dev
```

Run the app locally at `http://localhost:3001`.
