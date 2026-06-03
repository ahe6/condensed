# health

`health` is a TypeScript ecommerce app scaffold with:

- Fastify backend in `apps/backend`
- Prisma and Postgres for data
- Next.js frontend in `apps/frontend`
- Local Docker Postgres for development
- Terraform-managed AWS dev infrastructure
- Cognito-backed customer authentication

## Current State

Local development is still the fastest dev workflow, and the AWS dev stack is currently deployed under `health-dev`. AWS dev includes Cognito, private RDS Postgres, ECR, the ECS cluster, backend/frontend image repositories, public HTTPS backend/frontend services, and the scheduled Stripe Checkout reconciliation job. The Terraform bootstrap state bucket is retained with its original legacy bucket name.

Current AWS dev URLs:

- Frontend: `https://dev.condensedhealth.com`
- Backend API: `https://api-dev.condensedhealth.com`

Get the current Terraform-managed URLs with:

```sh
terraform -chdir=infra/envs/dev output backend_public_url
terraform -chdir=infra/envs/dev output frontend_public_url
```

Implemented backend modules:

- `users`
- `catalog`
- `carts`
- `checkout`
- `orders`
- `payments`
- `shipments`
- `auth`

The frontend is split into local shop, cart, orders, account, addresses, and admin routes. `/` covers catalog browsing and add-to-cart, `/cart` covers cart review and checkout, `/orders` covers customer order history, `/account` covers profile plus account actions, `/addresses` covers saved addresses, and `/admin` is opened directly by admin users for payment and fulfillment controls.

## Quickstart

Start local Postgres, apply migrations, run the backend, run the frontend, and start the Stripe webhook listener when the Stripe CLI is available:

```sh
make local-dev
```

Restart the local app processes after env changes:

```sh
make local-dev-restart
```

Local URLs:

- Backend API: `http://127.0.0.1:3000`
- Shop: `http://localhost:3001`
- Admin: `http://localhost:3001/admin`

## Layout

- `apps/backend`: Fastify API, Prisma schema, migrations, scripts, and Dockerfile.
- `apps/frontend`: Next.js local development UI and Dockerfile.
- `infra/bootstrap`: one-time Terraform state bucket setup.
- `infra/envs/dev`: AWS dev environment for Cognito auth plus optional VPC, RDS, ECR, ECS, scheduled jobs, and public backend/frontend services.
- `docker-compose.yml`: local Postgres and optional frontend container.
- `Makefile`: common AWS, Terraform, Docker, ECR, and migration commands.
- `docs`: project docs.

## Docs

- [Docs Index](docs/README.md)
- [Getting Started](docs/getting-started.md)
- [Frontend](docs/frontend.md)
- [Backend](docs/backend.md)
- [API](docs/api.md)
- [Auth](docs/auth.md)
- [Payments](docs/payments.md)
- [Fulfillment](docs/fulfillment.md)
- [Notifications](docs/notifications.md)
- [Flows](docs/flows.md)
- [Database](docs/database.md)
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
make backend-deploy-aws
make frontend-deploy-aws
```

See [Getting Started](docs/getting-started.md) and [Runbooks](docs/runbooks.md) for setup, reset, and troubleshooting commands.
