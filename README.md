# tele

`tele` is a TypeScript ecommerce app scaffold with:

- Fastify backend in `apps/backend`
- Prisma and Postgres for data
- Next.js frontend in `apps/frontend`
- Local Docker Postgres for development
- Terraform-managed AWS dev infrastructure

## Current State

Local development is the active environment. The AWS dev environment is currently destroyed to avoid AWS costs, while the Terraform bootstrap state bucket is retained.

Implemented backend modules:

- `users`
- `catalog`
- `carts`
- `checkout`
- `orders`
- `payments`
- `shipments`

The frontend is currently a local shop console for catalog browsing, cart management, checkout, and order lookup.

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
- Frontend: `http://127.0.0.1:3001`

## Layout

- `apps/backend`: Fastify API, Prisma schema, migrations, scripts, and Dockerfile.
- `apps/frontend`: Next.js local development UI and Dockerfile.
- `infra/bootstrap`: one-time Terraform state bucket setup.
- `infra/envs/dev`: AWS dev environment for VPC, RDS, ECR, ECS, and optional public backend service.
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
```

See [Local Development](docs/local-dev.md) and [Runbooks](docs/runbooks.md) for setup, reset, and troubleshooting commands.
