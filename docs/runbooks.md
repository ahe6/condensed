# Runbooks

These are common operational flows for the current project state.

## Start Local Dev

```sh
docker compose up -d postgres
npm install
npm run db:migrate
npm run backend:dev
```

In another terminal:

```sh
npm run frontend:dev
```

Open:

- Backend: `http://127.0.0.1:3000/health`
- Shop: `http://localhost:3001`
- Admin: `http://localhost:3001/admin`

The public shop nav does not link to admin. Admin users open `/admin` directly.

## Check Local Health

```sh
docker compose ps
curl -s http://127.0.0.1:3000/health
curl -s http://127.0.0.1:3000/ready
```

## Test Stripe Webhooks Locally

Put Stripe test keys in `.env.test`, then sync them and forward Stripe webhook events:

```sh
make dev-test-env
stripe listen --forward-to http://127.0.0.1:3000/webhooks/stripe
```

Put the printed `whsec_...` value in `.env.test` as `STRIPE_WEBHOOK_SECRET`, run `make dev-test-env` again, then restart the backend. Checkout payments use Checkout Session webhooks such as `checkout.session.completed`; the Stripe CLI forwards those during local testing.

See [Payments](payments.md) for test cards, admin Stripe sync, dispute behavior, and the current refund caveat.

## Run Stripe Checkout Smoke Test

With Postgres, backend, frontend, and `stripe listen` running, run:

```sh
npm run test:stripe-checkout
```

This opens the local shop in installed Chrome, creates a dev mug order, fills Stripe's test card, submits payment, and polls the backend order API until `paymentStatus` is `PAID`.

The command restocks `dev-mug` to 25 units before running so repeated smoke tests do not fail from local inventory depletion.

## Expire Unpaid Orders

Run the local unpaid-order expiry job:

```sh
npm run orders:expire
```

or:

```sh
make orders-expire
```

Defaults:

- `ORDER_EXPIRY_MINUTES=15`
- `ORDER_EXPIRY_BATCH_SIZE=50`

The job expires open Stripe Checkout Sessions, cancels old unpaid unfulfilled orders, and releases inventory once by setting `orders.inventoryReleasedAt`.

## Reset Local Database

This removes local Postgres data.

```sh
docker compose down -v
docker compose up -d postgres
npm run db:migrate
```

## Regenerate Prisma Client

```sh
npm run db:generate
```

## Check Migration Status

From the backend workspace:

```sh
cd apps/backend
npx prisma migrate status --schema prisma/schema.prisma
```

## Build Everything Locally

```sh
npm run backend:check
npm run backend:build
npm run frontend:check
npm run frontend:build
```

## Build Local Docker Images

```sh
make backend-docker-build
make frontend-docker-build
```

## Recreate AWS Dev

```sh
make aws-login
make aws-whoami
make dev-init
make dev-plan
terraform -chdir=infra/envs/dev apply
```

## Deploy Cognito Only

Use this for local auth development without recreating RDS/ECS. See [Auth](auth.md) for the full auth model.

```sh
make aws-login
make aws-whoami
make dev-init
make dev-auth-plan
make dev-auth-apply
make dev-auth-env
```

Restart backend and frontend dev servers after `make dev-auth-env`.

## Auth Tasks

Signup recovery, deleting throwaway users, and granting admin access are covered in [Auth](auth.md).

## Push Backend Image To AWS

```sh
make backend-docker-build
make backend-ecr-login
make backend-ecr-push
```

## Run AWS RDS Migrations

AWS RDS is private. Use the one-off ECS migration task:

```sh
make backend-migrate-aws
```

## Inspect AWS Outputs

```sh
terraform -chdir=infra/envs/dev output
```

Useful output names:

- `backend_ecr_repository_url`
- `cognito_frontend_client_id`
- `cognito_hosted_ui_domain`
- `cognito_issuer`
- `ecs_cluster_name`
- `backend_migration_task_definition_arn`
- `backend_load_balancer_dns_name`
- `postgres_endpoint`
- `postgres_port`

## Check Backend ECR Image

```sh
aws ecr describe-images --repository-name tele-dev-backend --image-ids imageTag=latest --region us-east-2 --profile dev
```

## Destroy AWS Dev

```sh
terraform -chdir=infra/envs/dev destroy
```

The Terraform bootstrap state bucket is retained.

## If AWS Commands Fail With SSO Errors

Refresh SSO:

```sh
make aws-login
```

Then retry the AWS or Terraform command.
