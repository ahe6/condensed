# Local Development

Local development uses Docker Postgres, the Fastify backend, and the Next.js frontend.

## Prerequisites

- Node.js with npm
- Docker
- Terraform only when working on infrastructure
- AWS CLI only when working on AWS

## Services

Local URLs:

- Backend API: `http://127.0.0.1:3000`
- Shop frontend: `http://localhost:3001`
- Admin frontend: `http://localhost:3001/admin`
- Postgres: `127.0.0.1:5432`

Docker Compose Postgres settings:

```text
database: tele
username: tele_admin
password: tele_password
```

The backend reads local env from `apps/backend/.env`. The example is `apps/backend/.env.example`.

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

## Frontend Configuration

The frontend defaults to:

```text
NEXT_PUBLIC_API_URL=http://127.0.0.1:3000
```

Override `NEXT_PUBLIC_API_URL` when pointing the frontend at a deployed backend.

Cognito login is disabled until these frontend env vars are set:

```text
NEXT_PUBLIC_COGNITO_DOMAIN
NEXT_PUBLIC_COGNITO_CLIENT_ID
NEXT_PUBLIC_COGNITO_REGION
```

The backend also needs:

```text
COGNITO_ISSUER
COGNITO_CLIENT_ID
```

Use the auth-only Terraform apply to create Cognito without recreating RDS/ECS:

```sh
make dev-init
make dev-auth-plan
make dev-auth-apply
```

Then write Cognito outputs into local env files:

```sh
make dev-auth-env
```

This updates `apps/backend/.env` and `apps/frontend/.env.local`. Restart the backend and frontend dev servers after changing these env files.

New signups receive a Cognito confirmation link. If a signup is interrupted or the link email is hard to find, use:

```text
http://localhost:3001/auth/confirm
```

That page can confirm the existing unconfirmed account with a code or resend the confirmation email.

During local dev, use `http://localhost:3001` consistently. `http://127.0.0.1:3001` is also allowed, but avoid mixing the two in the same login attempt. The frontend sends Cognito back to the current browser origin so the PKCE verifier remains available.

Delete throwaway Cognito dev users with:

```sh
make dev-auth-delete-user EMAIL=user@example.com
```

Grant backend admin access to a signed-up Cognito user with:

```sh
make dev-auth-add-admin EMAIL=user@example.com
```

Sign out and sign back in after changing group membership so Cognito issues a fresh ID token with the `admin` group claim.

Current frontend scope:

Shop route at `/`:

- Checks backend readiness through `GET /ready`.
- Lists active products through `GET /products`.
- Creates and resumes browser-local carts.
- Adds, updates, removes, and clears cart items.
- Submits checkout through `POST /checkout`.
- Links checkout orders to the signed-in Cognito user when auth is configured.
- Shows signed-in customer order history through `GET /me/orders`.
- Looks up orders through `GET /orders/:orderNumber`.

Admin route at `/admin`:

- Lists recent admin orders through `GET /admin/orders`.
- Creates manual payments and marks them authorized, paid, failed, or refunded.
- Creates shipments, updates tracking, and marks shipments shipped, delivered, or returned.
- Requires a signed-in Cognito user in the `admin` group.
- Runs on port `3001`.

## Useful Endpoints

- `GET /health`: process health
- `GET /ready`: database connectivity check
- `GET /me`, `GET /me/orders`: authenticated account and order history
- `GET /products`, `GET /products/:slug`, `GET /categories`: public catalog
- `POST /carts`, `GET /carts/:id`, `POST /carts/:id/items`: cart flow
- `POST /checkout`: convert a cart into an order
- `GET /orders/:orderNumber`: customer order lookup
- `/admin/*`: admin catalog, order, payment, and shipment routes

See [Backend API](backend-api.md) for the full route reference.

## Checks And Builds

```sh
npm run backend:check
npm run backend:build
npm run frontend:check
npm run frontend:build
```

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
