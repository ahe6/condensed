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
- Frontend: `http://127.0.0.1:3001`
- Postgres: `127.0.0.1:5432`

Docker Compose Postgres settings:

```text
database: tele
username: tele_admin
password: tele_password
```

The backend reads local env from `apps/backend/.env`. The example is `apps/backend/.env.example`.

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

Current frontend scope:

- Checks backend readiness through `GET /ready`.
- Lists active products through `GET /products`.
- Creates and resumes browser-local carts.
- Adds, updates, removes, and clears cart items.
- Submits checkout through `POST /checkout`.
- Looks up orders through `GET /orders/:orderNumber`.
- Lists recent admin orders through `GET /admin/orders`.
- Creates manual payments and marks them authorized, paid, failed, or refunded.
- Runs on port `3001`.

## Useful Endpoints

- `GET /health`: process health
- `GET /ready`: database connectivity check
- `GET /products`, `GET /products/:slug`, `GET /categories`: public catalog
- `POST /carts`, `GET /carts/:id`, `POST /carts/:id/items`: cart flow
- `POST /checkout`: convert a cart into an order
- `GET /orders/:orderNumber`: customer order lookup
- `/admin/*`: dev-only catalog, order, payment, and shipment routes

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
