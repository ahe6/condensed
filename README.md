# tele

`tele` is a TypeScript ecommerce app scaffold with:

- Fastify backend in `apps/backend`
- Prisma and Postgres for data
- Next.js frontend in `apps/frontend`
- Local Docker Postgres for development
- Terraform-managed AWS dev infrastructure
- Cognito-backed customer authentication

## Current State

Local development is the active environment. Cognito is deployed for local auth testing. The costly AWS app stack is currently destroyed to avoid AWS costs, while the Terraform bootstrap state bucket is retained.

Implemented backend modules:

- `users`
- `catalog`
- `carts`
- `checkout`
- `orders`
- `payments`
- `shipments`
- `auth`

The frontend is split into a local shop route and a dev-admin route. `/` covers catalog browsing, cart management, checkout, account login, order history, and order lookup. `/admin` covers order payment and fulfillment controls.

## Quickstart

Start local Postgres:

```sh
docker compose up -d postgres
```

Install dependencies and apply local migrations:

```sh
npm install
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

Local URLs:

- Backend API: `http://127.0.0.1:3000`
- Shop: `http://localhost:3001`
- Admin: `http://localhost:3001/admin`

## Layout

- `apps/backend`: Fastify API, Prisma schema, migrations, scripts, and Dockerfile.
- `apps/frontend`: Next.js local development UI and Dockerfile.
- `infra/bootstrap`: one-time Terraform state bucket setup.
- `infra/envs/dev`: AWS dev environment for Cognito auth plus optional VPC, RDS, ECR, ECS, and public backend service.
- `docker-compose.yml`: local Postgres and optional frontend container.
- `Makefile`: common AWS, Terraform, Docker, ECR, and migration commands.
- `docs`: project docs.

## Docs

- [Docs Index](docs/README.md)
- [Local Development](docs/local-dev.md)
- [Backend Architecture](docs/backend-architecture.md)
- [Backend API](docs/backend-api.md)
- [Ecommerce Flows](docs/ecommerce-flows.md)
- [Database Schema](docs/database-schema.md)
- [Infrastructure](docs/infrastructure.md)
- [Deployment](docs/deployment.md)
- [Runbooks](docs/runbooks.md)

## Common Commands

```sh
npm run backend:check
npm run backend:build
npm run frontend:check
npm run frontend:build
npm run db:generate
docker compose ps
make dev-auth-env
```

See [Local Development](docs/local-dev.md) and [Runbooks](docs/runbooks.md) for setup, reset, and troubleshooting commands.
