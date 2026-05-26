# tele

`tele` is set up as a Fastify + TypeScript + Prisma backend with local Docker Postgres and AWS infrastructure managed by Terraform.

## Current State

Local development:

- Backend app: `apps/backend`
- Frontend app: `apps/frontend`
- Local Postgres: Docker Compose service `postgres`
- Prisma schema and initial migration are present
- Backend Docker image builds and has been smoke-tested locally
- Frontend Docker image builds and has been smoke-tested locally

AWS dev account:

- AWS profile: `dev`
- Account: `173748329850`
- Region: `us-east-2`
- Terraform state bucket: `tele-terraform-state-173748329850-us-east-2`
- Bootstrap state storage is retained
- The Terraform dev environment is currently destroyed to avoid AWS dev costs
- Recreate dev AWS resources with `terraform -chdir=infra/envs/dev apply`

## Layout

- `apps/backend`: Fastify API, Prisma schema, migrations, and Dockerfile.
- `apps/frontend`: Next.js app for local product development.
- `infra/bootstrap`: one-time Terraform state bucket setup.
- `infra/envs/dev`: AWS dev environment, including VPC, RDS, ECR, ECS prerequisites, and optional ALB/Fargate service.
- `docker-compose.yml`: local Postgres for development.
- `Makefile`: common local, Terraform, Docker, and ECR commands.

## Local Development

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

Build the frontend production container:

```sh
make frontend-docker-build
```

Run the frontend production container with Compose:

```sh
docker compose --profile app up --build frontend
```

Local URLs:

- Backend API: `http://127.0.0.1:3000`
- Frontend: `http://127.0.0.1:3001`

Useful endpoints:

- `GET /health`: process health
- `GET /ready`: database connectivity check
- `GET /users`: list starter users
- `POST /users`: create a starter user with `email` and optional `name`

Stop local Postgres:

```sh
docker compose stop postgres
```

Reset local Postgres data:

```sh
docker compose down -v
```

## Backend App

The backend is in `apps/backend`.

Important files:

- `src/index.ts`: process entrypoint and shutdown handling.
- `src/server.ts`: Fastify routes and error handling.
- `src/config.ts`: environment parsing. Supports local `DATABASE_URL` or AWS `DB_SECRET_JSON` + `DB_HOST`.
- `src/prisma.ts`: Prisma client.
- `prisma/schema.prisma`: Prisma schema.
- `prisma/migrations/20260526000000_init/migration.sql`: initial SQL migration.
- `prisma/migrations/20260526122912_ecommerce_schema/migration.sql`: ecommerce core schema.
- `Dockerfile`: production backend image.

Local environment example:

```sh
apps/backend/.env.example
```

The local `.env` file is intentionally ignored by git.

## Ecommerce Schema

The Prisma schema includes the core ecommerce tables:

- `users`, `addresses`
- `products`, `product_variants`, `product_images`
- `categories`, `product_categories`
- `carts`, `cart_items`
- `orders`, `order_addresses`, `order_items`
- `payments`, `shipments`

Orders snapshot purchased item and address details so historical orders do not depend on mutable product or address records.

## Frontend App

The frontend is a Next.js app in `apps/frontend`.

Important files:

- `app/page.tsx`: local development console UI.
- `app/layout.tsx`: app shell metadata and global CSS import.
- `app/globals.css`: frontend styling.
- `src/lib/api.ts`: typed browser API client for the Fastify backend.
- `Dockerfile`: production frontend image.

The frontend defaults to:

```text
NEXT_PUBLIC_API_URL=http://127.0.0.1:3000
```

Override that environment variable when pointing the frontend at a deployed backend.

## AWS Dev Environment

The AWS dev environment is currently torn down. The local Docker Postgres database is the active development database.

When recreated, Terraform provisions a private RDS Postgres database:

```text
identifier: tele-dev-postgres
port: 5432
database: tele
username: tele_admin
instance: db.t4g.micro
storage: 20 GB gp3, autoscale up to 100 GB
encrypted: yes
publicly accessible: no
backups: 7 days
```

Security model:

- RDS allows inbound TCP `5432` only from the backend security group.
- Your laptop cannot connect directly to RDS.
- The RDS master password is managed by AWS Secrets Manager.

Approximate RDS cost before credits: about `$14/month`.

Create the dev environment:

```sh
terraform -chdir=infra/envs/dev apply
```

Destroy the dev environment:

```sh
terraform -chdir=infra/envs/dev destroy
```

## AWS Backend Image

When the AWS dev environment exists, Terraform creates this ECR repository:

```text
173748329850.dkr.ecr.us-east-2.amazonaws.com/tele-dev-backend
```

Build and push a new image:

```sh
make backend-docker-build
make backend-ecr-login
make backend-ecr-push
```

The frontend image is local-only for now. Build it with:

```sh
make frontend-docker-build
```

## AWS Backend Service

The Terraform config includes an optional public backend service:

- Application Load Balancer
- HTTP listener on port `80`
- ECS Fargate task/service
- Task definition using the ECR backend image
- Secrets Manager injection for the RDS password
- CloudWatch logs at `/ecs/tele-dev-backend`

It is currently disabled in `infra/envs/dev/terraform.tfvars`:

```hcl
backend_service_enabled = false
```

To preview the service layer:

```sh
terraform -chdir=infra/envs/dev plan -var backend_service_enabled=true
```

The last dry run showed:

```text
9 to add, 0 to change, 0 to destroy
```

That would create the ALB, target group, listener, ECS task definition, ECS service, and HTTP security group rules.

Expected added cost when enabled: roughly `$20-30/month` before credits, mainly ALB + one small Fargate task.

## Terraform

Authenticate:

```sh
make aws-login
make aws-whoami
```

Format and validate:

```sh
make fmt
make validate
```

Plan dev changes:

```sh
make dev-plan
```

Apply dev changes:

```sh
terraform -chdir=infra/envs/dev apply
```

Destroy dev resources:

```sh
terraform -chdir=infra/envs/dev destroy
```

Terraform state:

```text
bucket: tele-terraform-state-173748329850-us-east-2
key: envs/dev/terraform.tfstate
```

## Migration Strategy

Local migrations:

```sh
npm run db:migrate
```

AWS RDS migrations should run from inside AWS when the dev environment exists because the database is private. The repo has the deploy command:

```sh
npm run db:deploy
```

The dev environment includes a one-off ECS task definition that runs `npm run db:deploy` against RDS. After recreating AWS dev and pushing an image, run it with:

```sh
make backend-migrate-aws
```

This starts a short-lived Fargate task in the dev VPC, waits for it to stop, and exits non-zero if the migration container fails.

The ECS task definitions use ARM64 Fargate because the local image is built on Apple Silicon by default.

The migration command uses `apps/backend/scripts/prisma-deploy.mjs` so Prisma CLI receives a concrete `DATABASE_URL` built from the AWS-injected RDS secret.

## Useful Commands

```sh
docker compose ps
docker compose logs postgres
npm run backend:check
npm run backend:build
npm run frontend:check
npm run frontend:build
make backend-docker-build
make frontend-docker-build
npm run db:generate
```

AWS-only commands after recreating `infra/envs/dev`:

```sh
make backend-migrate-aws
terraform -chdir=infra/envs/dev output
aws ecr describe-images --repository-name tele-dev-backend --image-ids imageTag=latest --region us-east-2 --profile dev
```
