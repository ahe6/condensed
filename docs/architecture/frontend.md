# Frontend

The frontend is a single Next.js app in `apps/frontend`. It serves both the public shop and the admin order tools.

Last verified against the frontend source and deployment scripts on 2026-06-05.

## App Structure

Important files:

- `app/layout.tsx`: root Next.js shell, metadata, and global CSS import
- `app/page.tsx`: public product catalog and add-to-cart flow
- `app/products/[slug]/page.tsx`: public product detail page with variant selection and add-to-cart
- `app/cart/page.tsx`: cart review, signed-in checkout, and Stripe Checkout Elements
- `app/account/page.tsx`: signed-in customer profile, account actions, and sign out
- `app/addresses/page.tsx`: signed-in customer saved address management
- `app/orders/page.tsx`: signed-in customer order history, search, and filters
- `app/orders/[orderNumber]/page.tsx`: signed-in customer order detail view
- `app/style-lab/page.tsx`: isolated static storefront design prototype route
- `app/admin/page.tsx`: admin order search, notes, payments, fulfillment, and order timeline
- `app/auth/callback/page.tsx`: Cognito hosted UI callback
- `app/auth/confirm/page.tsx`: Cognito confirmation helper route
- `app/globals.css`: shared styling for shop and admin
- `src/lib/api.ts`: typed API client and response shapes
- `src/lib/auth.ts`: Cognito PKCE login, session storage, sign-out, and confirmation helpers
- `src/lib/format.ts`: money, date, status, button, and tracking-link formatting
- `src/components/CustomerBrand.tsx`: placeholder customer brand link back to the shop home
- `src/components/CustomerNav.tsx`: shared customer navigation for Cart, Orders, and Account
- `src/components/OrderSummary.tsx`: reusable customer-facing order summary

The app currently keeps shop and admin in one Next app. Customer pages use a placeholder HEALTH brand link to `/` plus a compact Cart, Orders, and Account nav with a Cart item-count badge. The public shop does not link to `/admin`; admins open that route directly.

`/style-lab` is an unlinked design sandbox for frontend-only iteration. It uses static mock data and scoped `style-lab-*` classes, so experiments should not change cart, auth, checkout, admin, backend, or database behavior. Remove or gate this route before production if it is no longer useful.

## Environment

Frontend env is read from `apps/frontend/.env.local`. `apps/frontend/.env.example` documents the browser-exposed keys.

Important variables:

```text
NEXT_PUBLIC_API_URL=http://127.0.0.1:3000
NEXT_PUBLIC_COGNITO_DOMAIN=
NEXT_PUBLIC_COGNITO_CLIENT_ID=
NEXT_PUBLIC_COGNITO_REGION=us-east-2
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

`NEXT_PUBLIC_API_URL` points browser requests at the Fastify backend. Cognito variables enable hosted UI login. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` enables Stripe Checkout Elements.

For deployed AWS frontend builds, `scripts/deploy-aws-frontend.sh` passes these values as Docker build arguments. It reads Terraform's `backend_public_url` output, so builds use `https://<backend_domain>` after certificate validation is enabled and fall back to the backend ALB HTTP URL otherwise. The Docker context ignores `.env*` files, so ignored local env files are not baked into the image by accident.

Current AWS dev frontend builds use `NEXT_PUBLIC_API_URL=https://api-dev.condensedhealth.com` and `frontend_public_url=https://dev.condensedhealth.com`. The deploy script includes Cognito config automatically because the Terraform frontend URL is HTTPS. If the domain changes, redeploy the frontend after Terraform and ACM validation are complete so the image contains the new API and Cognito URLs.

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

- Stores the ID token, access token, optional refresh token, and expiry in `localStorage` under `health.auth`.
- Stores PKCE verifier and state in `sessionStorage` during login.
- Clears expired sessions on read.
- Uses the ID token for backend identity and admin authorization.

Admin access requires the signed-in Cognito user to be in the `admin` group. See [Auth](auth.md).

## Public Shop

`app/page.tsx` owns the public catalog flow:

- Checks backend readiness with `GET /ready`.
- Lists active products from `GET /products`.
- Shows a storefront intro with a featured active product.
- Links product cards to `/products/[slug]`.
- Stores the active cart ID in browser local storage under `health.cartId`.
- Uses `POST /me/cart` when signed in to load the account cart and adopt or merge the browser-local cart.
- Creates or resumes carts and adds variants to the cart.
- Disables add controls when the cart already has the current available stock.

`app/products/[slug]/page.tsx` owns the public product detail flow:

- Loads one active product from `GET /products/:slug`.
- Shows the product image, description, categories, variants, price, and stock.
- Uses the same browser-local or signed-in account cart behavior as the catalog page.
- Adds the selected variant to the active cart and updates the shared cart-count badge.

`app/cart/page.tsx` owns cart review and checkout:

- Loads the same active cart from browser local storage under `health.cartId`.
- Uses `POST /me/cart` when signed in to load, adopt, or merge the browser-local cart.
- Shows customer-facing cart count, total, and signed-in account context without exposing internal API diagnostics.
- Updates item quantities, removes items, and clears carts through cart API routes.
- Collects checkout email, shipping address, and billing address.
- Lets signed-in customers select saved shipping and billing addresses, while still allowing custom address entry.
- Requires sign-in before checkout.
- Creates a local order and Stripe Checkout Session together with `POST /checkout/stripe` when Stripe is configured.
- Falls back to order-only checkout with `POST /checkout` when Stripe is not configured.
- Renders Stripe Checkout Elements through `CheckoutElementsProvider` and `PaymentElement`.
- Confirms checkout in the browser.

## Customer Account

`app/account/page.tsx` is the signed-in customer account view:

- Requires Cognito session before loading customer data.
- Loads the current profile with `GET /me`.
- Updates local profile name and phone with `PATCH /me`.
- Links to `/orders` and `/addresses`.
- Owns customer sign out.

`app/addresses/page.tsx` is the signed-in customer address view:

- Requires Cognito session before loading customer address data.
- Loads the current profile with `GET /me`.
- Loads saved addresses with `GET /me/addresses`.
- Creates saved addresses with `POST /me/addresses`.
- Sets default shipping and billing addresses with `PATCH /me/addresses/:id`.
- Deletes saved addresses with `DELETE /me/addresses/:id`.
- Shows saved-address counts and default shipping/billing state.

`app/orders/page.tsx` is the signed-in customer order history view:

- Requires Cognito session before loading customer order data.
- Loads the current profile with `GET /me`.
- Shows signed-in customer order history with `GET /me/orders`.
- Shows order counts, open order count, paid total, search, and status filters.
- Links order history summaries to `/orders/[orderNumber]`.
- Lets customers refresh order history after payment, shipment, or status changes.

`app/orders/[orderNumber]/page.tsx` shows a full signed-in customer order detail page with items, totals, addresses, payments, shipments, and tracking links. The backend only returns the order if it belongs to the signed-in user.

Payment state should not be trusted from the browser alone. Stripe webhooks or admin sync update the backend payment/order state.

## Admin

`app/admin/page.tsx` is a single-page admin workspace with order and catalog tabs.

See [Admin](admin.md) for the admin workspace, order operations, payment/fulfillment/catalog actions, and guardrails.

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
npm run frontend:dev:aws
```

Run the app locally at `http://localhost:3001`.

Use `npm run frontend:dev:aws` for frontend/design iteration against AWS dev. It starts the local Next.js dev server with hot reload, points `NEXT_PUBLIC_API_URL` at the deployed AWS dev backend, and uses the dev Cognito config from Terraform or local env fallbacks. It reads the Stripe publishable key from the environment, `apps/frontend/.env.local`, or `.env.test`, in that order.

Deploy the frontend to AWS dev when the public frontend service is enabled:

```sh
make frontend-deploy-aws
```

Get the deployed frontend URL with:

```sh
terraform -chdir=infra/envs/dev output frontend_public_url
```
