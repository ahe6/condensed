# Getting Started

Local development uses Docker Postgres, the Fastify backend, and the Next.js frontend.

## Prerequisites

- Node.js with npm
- Docker
- Terraform only when working on infrastructure
- AWS CLI only when working on AWS

## Services

Local URLs:

- API: `http://127.0.0.1:3000`
- Shop frontend: `http://localhost:3001`
- Admin frontend: `http://localhost:3001/admin`
- Postgres: `127.0.0.1:5432`

Docker Compose Postgres settings:

```text
database: tele
username: tele_admin
password: tele_password
```

The backend reads local env from the repo root `.env` and `apps/backend/.env`. Backend-local values take precedence. Examples are `.env.example` and `apps/backend/.env.example`.

The frontend can read local env from `apps/frontend/.env.local`. The example is `apps/frontend/.env.example`.

## Start Local Development

Start Postgres:

```sh
docker compose up -d postgres
```

Install dependencies:

```sh
npm install
```

Apply local migrations:

```sh
npm run db:migrate
```

Run the backend:

```sh
npm run backend:dev
```

Run the frontend:

```sh
npm run frontend:dev
```

## Configuration

The frontend defaults to:

```text
NEXT_PUBLIC_API_URL=http://127.0.0.1:3000
```

Override `NEXT_PUBLIC_API_URL` when pointing the frontend at a deployed backend.

Auth setup, signup recovery, and admin access commands are covered in [Auth](auth.md).

Stripe payment testing needs:

```text
STRIPE_API_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
```

Use Stripe test keys for local development. Keep them in `.env.test` if `.env` has live-mode values. `STRIPE_API_KEY` is the secret backend key, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is the browser key, and `STRIPE_WEBHOOK_SECRET` is the local Stripe CLI signing secret. Sync `.env.test` into the app-local env files with:

```sh
make dev-test-env
```

`STRIPE_WEBHOOK_SECRET` is only required when testing Stripe webhooks.

The backend API key should start with `sk_test_`. The webhook secret should start with `whsec_`. The publishable browser key should start with `pk_test_` and use `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

Local Stripe checkout uses Checkout Sessions with Checkout Elements. The frontend requests `POST /checkout/stripe` to create the local order and Stripe Checkout Session together, then confirms the session in the browser. Webhooks are still the normal source of truth for marking the order paid. See [Payments](payments.md) for the full Stripe checkout, webhook, sync, dispute, and refund behavior.

Current frontend scope:

Shop route at `/`:

- Checks backend readiness through `GET /ready`.
- Lists active products through `GET /products`.
- Creates and resumes browser-local carts before sign-in.
- Loads, reuses, and adopts signed-in account carts through `POST /me/cart`.
- Adds, updates, removes, and clears cart items.
- Saves account addresses and uses them as checkout shipping or billing addresses.
- Submits Stripe checkout through `POST /checkout/stripe`.
- Requires sign-in for checkout and links checkout orders to the signed-in Cognito user.
- Shows signed-in customer order history through `GET /me/orders`.
- Shows signed-in customer order details through `GET /orders/:orderNumber`.

Admin route at `/admin`:

- Is opened directly; the public shop nav does not link to it.
- Lists, searches, filters, sorts, and pages admin orders through SQL-backed `GET /admin/orders`.
- Adds internal admin-only notes to orders.
- Shows a combined order timeline with order, note, payment, fulfillment, and tracking activity.
- Creates manual payments and marks them authorized, paid, failed, or refunded.
- Syncs Stripe payment status from Stripe for Stripe payments.
- Creates shipments, allocates order item quantities, updates tracking, and marks shipments shipped, delivered, or returned.
- Blocks shipment creation, shipped, and delivered actions unless payment is `PAID` or `AUTHORIZED`.
- Keeps detailed payment and shipment audit history folded behind per-record history controls.
- Shows public tracking links for UPS, USPS, FedEx, and DHL when carrier and tracking number are available.
- Allows admins to overwrite carrier/tracking values from each shipment row if tracking was entered incorrectly, with changes recorded in shipment tracking history.
- Switches to a catalog tab for product management.
- Creates products and categories.
- Edits product fields, publishes or archives products, assigns categories, adds images, creates variants, and updates inventory.
- Requires a signed-in Cognito user in the `admin` group.
- Runs on port `3001`.

See [Fulfillment](fulfillment.md) for shipment guardrails, tracking links, and fulfillment history.

## Useful Endpoints

- `GET /health`: process health
- `GET /ready`: database connectivity check
- `GET /me`, `PATCH /me`, `GET /me/orders`, `GET /me/addresses`, `POST /me/addresses`, `GET /me/cart`, `POST /me/cart`: authenticated account, order history, addresses, and account cart
- `GET /products`, `GET /products/:slug`, `GET /categories`: public catalog
- `POST /carts`, `GET /carts/:id`, `POST /carts/:id/items`: cart flow
- `POST /checkout`, `POST /checkout/stripe`: convert a cart into an order for the signed-in customer, with Stripe session creation on the Stripe path
- `GET /orders/:orderNumber`: signed-in customer order detail
- `/admin/*`: admin catalog, order, payment, and shipment routes

See [API](api.md) for the full route reference.

## Checks And Builds

```sh
npm run backend:check
npm run backend:build
npm run frontend:check
npm run frontend:build
```

Run a full local Stripe checkout smoke test after starting Postgres, backend, frontend, and `stripe listen`:

```sh
npm run test:stripe-checkout
```

The smoke test restocks `dev-mug` locally before creating an order.
Because checkout now requires sign-in, set `PLAYWRIGHT_AUTH_STATE` to a Playwright storage-state JSON file for a signed-in customer before running it.
It uses installed Google Chrome through Playwright, so no Playwright browser download is required.

## Local Containers

Build the backend image:

```sh
make backend-docker-build
```

Build the frontend image:

```sh
make frontend-docker-build
```

Run the frontend production container with Compose:

```sh
docker compose --profile app up --build frontend
```

The backend container can be built locally, but Compose currently only defines `postgres` and optional `frontend`.

## Stop Or Reset

Stop Postgres but keep data:

```sh
docker compose stop postgres
```

Reset local Postgres data:

```sh
docker compose down -v
```

After resetting data, run migrations again:

```sh
npm run db:migrate
```
