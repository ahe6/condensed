# Frontend

The frontend is a single Next.js app in `apps/frontend`. It serves both the public shop and the admin order tools.

Last verified against the frontend source on 2026-06-07.

## App Structure

Important files:

- `app/layout.tsx`: root Next.js shell, metadata, and global CSS import
- `app/page.tsx`: outcome-first public storefront landing page
- `app/shop/page.tsx`: outcome/program storefront that routes into goal intakes and keeps catalog/cart/orders as utilities
- `app/care/page.tsx`: care-layer entry page for goals, history, labs, and clinician-review concepts
- `app/my-health/page.tsx`: frontend-only Patient Portal dashboard shell for future care context
- `app/catalog/page.tsx`: public product catalog and add-to-cart flow
- `app/intake/[slug]/page.tsx`: assessment entry flow for care-program products
- `app/products/[slug]/page.tsx`: public product detail page with variant selection and add-to-cart
- `app/cart/page.tsx`: cart review, signed-in checkout, and Stripe Checkout Elements
- `app/account/page.tsx`: signed-in customer profile settings, account links, and sign out
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
- `src/components/CustomerNav.tsx`: shared customer navigation for Shop, Get Care, and Patient Portal
- `src/components/OrderSummary.tsx`: reusable customer-facing order summary

The app currently keeps shop, care, account, and admin in one Next app. Customer pages use a placeholder HEALTH brand link to `/` plus a centered Shop, Get Care, and Patient Portal nav. Cart stays available at `/cart`, but it is treated as a checkout utility instead of a primary centered navigation mode. The public shop does not link to `/admin`; admins open that route directly.

The frontend target architecture is documented in [Frontend Care And Commerce](frontend-care-commerce.md). The new `/shop`, `/care`, and `/my-health` routes are frontend-only shell routes for that model; they reuse existing product, assessment, account, and order routes instead of introducing new backend schema.

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
- Defaults generic successful sign-in to `/my-health`.
- Preserves explicit return paths for protected flows such as cart checkout, admin, orders, addresses, and assessment drafts.

Admin access requires the signed-in Cognito user to be in the `admin` group. See [Auth](auth.md).

## Public Shop

`app/page.tsx` owns the public storefront entry flow:

- Shows customer-facing goal and routine prompts before exposing the full SKU list.
- Filters static outcome cards from the in-page search input.
- Links customers into `/care`, `/shop`, `/goals/[goalKey]`, `/cart`, and product detail routes.
- Avoids loading the product catalog directly on the home page, so an empty catalog or API issue does not turn the first page into a raw product dump or backend error.

`app/shop/page.tsx` is the commerce-layer entry shell:

- Shows image-led outcome/program cards for weight loss, hair loss, skin care, and labs.
- Routes primary CTAs into `/goals/[goalKey]` flows instead of exposing a cart-first shopping model.
- Keeps `/catalog`, `/cart`, and `/orders` available as secondary utility links.
- Does not load product catalog or cart data directly.

`app/care/page.tsx` is the care-layer entry shell:

- Explains goals, medical history, labs, and clinician review as care-layer concepts.
- Links current working flows such as `/goals/weight-loss` and `/goals/wellness-labs`.
- Marks medical history and clinician review as planned frontend areas rather than implemented backend data.

`app/goals/[goalKey]/page.tsx` owns the goal-intake flow:

- Loads goal assessment questions from `GET /goals/:goalKey/assessment`.
- Renders backend-owned question definitions as a one-question-at-a-time stepper.
- Requires sign-in after answers are complete and before saving the submission.
- Stores a browser-local draft under `health.goalAssessmentDraft.<goalKey>` so answers survive the Cognito redirect.
- Submits answers to `POST /goals/:goalKey/assessment/submissions`.
- Shows ranked product recommendations with links into product intake for assessment-required products or product detail for direct products.
- Does not create checkout authorizations; recommendation is discovery, not approval.

`app/catalog/page.tsx` owns the public catalog flow:

- Checks backend readiness with `GET /ready`.
- Lists active products from `GET /products`.
- Shows a catalog intro with a featured active product.
- Links product cards to `/products/[slug]`.
- Links care-program product cards to `/intake/[slug]`.
- Uses `product.purchaseMode` to show assessment-first CTAs for care-program products and add-to-cart controls for direct-purchase products.
- Stores the active cart ID in browser local storage under `health.cartId`.
- Uses `POST /me/cart` when signed in to load the account cart and adopt or merge the browser-local cart.
- Creates or resumes carts and adds variants to the cart.
- Disables add controls when the cart already has the current available stock.

`app/products/[slug]/page.tsx` owns the public product detail flow:

- Loads one active product from `GET /products/:slug`.
- Shows the product image, description, categories, variants, price, and stock.
- Uses the same browser-local or signed-in account cart behavior as the catalog page for direct-purchase products.
- Adds the selected variant to the active cart for direct-purchase products.
- Shows an assessment-first CTA instead of cart controls for products with `purchaseMode=ASSESSMENT_REQUIRED`.

`app/intake/[slug]/page.tsx` owns the current assessment entry prototype:

- Loads one active product from `GET /products/:slug`.
- Loads assessment questions from `GET /products/:slug/assessment` for care-program products.
- Renders backend-owned question definitions as a one-question-at-a-time stepper.
- Starts required selects blank so untouched assessments cannot be submitted.
- Requires sign-in after answers are complete and before saving the submission.
- Stores a browser-local assessment draft under `health.assessmentDraft.<slug>` so answers survive the Cognito redirect.
- Submits answers to `POST /products/:slug/assessment/submissions` and shows the saved submission state.
- Shows approved, review-required, and rejected decision states from the submission response.
- Lets approved customers continue to the signed-in cart by adding the first available product variant.
- Sends direct-purchase products back to their product detail page.
- Does not create orders, prescriptions, or provider review records yet.

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

`app/my-health/page.tsx` is a frontend-only Patient Portal dashboard shell:

- Uses the current Cognito session to show signed-in account context when available.
- Acts as the default signed-in customer destination after generic Cognito login.
- Uses Patient Portal as the visible nav/product label while keeping `/my-health` as the route for now.
- Frames care plans, medical history, labs/results, and clinician review as customer dashboard areas.
- Links to existing `/orders`, `/account`, and `/care` routes for currently implemented actions.
- Does not create or mutate any care-specific backend data yet.

`app/account/page.tsx` is the signed-in customer account settings view:

- Requires Cognito session before loading customer data.
- Loads the current profile with `GET /me`.
- Updates local profile name and phone with `PATCH /me`.
- Links back to `/my-health` and out to `/orders` and `/addresses`.
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

`app/orders/[orderNumber]/page.tsx` shows a full signed-in customer order detail page with items, totals, addresses, payments, shipments, and tracking links. The backend only returns the order if it belongs to the signed-in user. For unpaid or failed-payment orders, the page shows the backend-owned reservation countdown from `reservationExpiresAt`; payment recovery is hidden once that deadline passes.

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

Local frontend dev uses Next.js with the webpack dev bundler through `npm run frontend:dev`. Keep webpack explicit until Turbopack is re-verified locally; Turbopack has caused account-page reload loops during auth testing.

Use `npm run frontend:dev:aws` for frontend/design iteration against AWS dev. It starts the local Next.js dev server with hot reload, points `NEXT_PUBLIC_API_URL` at the deployed AWS dev backend, and uses the dev Cognito config from Terraform or local env fallbacks. It reads the Stripe publishable key from the environment, `apps/frontend/.env.local`, or `.env.test`, in that order.

Deploy the frontend to AWS dev when the public frontend service is enabled:

```sh
make frontend-deploy-aws
```

Get the deployed frontend URL with:

```sh
terraform -chdir=infra/envs/dev output frontend_public_url
```
