# Frontend

The frontend is a single Next.js app in `apps/frontend`. It serves both the public shop and the admin order tools.

## App Structure

Important files:

- `app/page.tsx`: public shop, cart, and signed-in checkout
- `app/account/page.tsx`: signed-in customer profile summary and order history
- `app/orders/[orderNumber]/page.tsx`: signed-in customer order detail view
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
- Requires sign-in before checkout.
- Creates a local order with `POST /checkout`.
- Creates a Stripe Checkout Session with `POST /orders/:id/stripe-checkout-session`.
- Renders Stripe Checkout Elements through `CheckoutElementsProvider` and `PaymentElement`.
- Confirms checkout in the browser.

## Customer Account

`app/account/page.tsx` is the signed-in customer account view:

- Requires Cognito session before loading customer data.
- Loads the current profile with `GET /me`.
- Shows order counts, open order count, paid total, and basic profile fields.
- Shows signed-in customer order history with `GET /me/orders`.
- Links order history summaries to `/orders/[orderNumber]`.
- Lets customers refresh order history after payment, shipment, or status changes.

`app/orders/[orderNumber]/page.tsx` shows a full signed-in customer order detail page with items, totals, addresses, payments, shipments, and tracking links. The backend only returns the order if it belongs to the signed-in user.

Payment state should not be trusted from the browser alone. Stripe webhooks or admin sync update the backend payment/order state.

## Admin

`app/admin/page.tsx` is a single-page admin workspace with order and catalog tabs.

Main admin capabilities:

- Switch between order operations and catalog management.
- Search/filter/sort/page admin orders through SQL-backed `GET /admin/orders`.
- Search across order fields, customer names, line items, SKUs, statuses, note bodies, and note authors.
- Filter by payment status, fulfillment status, event date range, and page size.
- Sort by created, edited, placed, shipped, delivered, or total.
- Expand one order row inline.
- Keep notes visible on expanded orders and open the activity/actions accordion for payments, fulfillment, and timeline.
- Add internal admin-only notes.
- Show a combined order timeline.
- Create manual payments and mark payments authorized, paid, failed, or refunded.
- Sync Stripe payment status for Stripe payments.
- Create shipments with remaining line item quantities prefilled, save carrier/tracking edits, and mark shipments shipped, delivered, or returned.
- Open public carrier tracking links for UPS, USPS, FedEx, and DHL.
- Search/filter admin products.
- Create products and categories.
- Edit product name, slug, description, and status.
- Publish or archive products.
- Assign and remove product categories.
- Add product images.
- Add and edit product variants, prices, currencies, and inventory.

The expanded order row is the main work surface. It includes:

- Order timestamps, customer, line items, and shipment summary
- Notes composer and note list
- Payments and payment actions
- Fulfillment line item allocation and shipment actions
- Chronological timeline built from order events, notes, payment events, shipment events, and tracking changes

Detailed payment and shipment audit history is folded behind per-record `History` buttons so the current operational controls stay visible.
Notes stay visible on expanded orders. The activity and actions accordion starts collapsed per order so admins can scan orders first, then open the operational workspace when needed.

The expanded catalog row is the main product work surface. It includes product fields, category chips, variant editing, inventory controls, and image links.

See [Fulfillment](fulfillment.md) for shipment guardrails and tracking-link behavior.

## Styling

Shared CSS lives in `app/globals.css`.

Current UI conventions:

- Panels use restrained borders and compact spacing.
- Admin order rows are clickable and expand inline.
- Catalog product rows are clickable and expand inline.
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
